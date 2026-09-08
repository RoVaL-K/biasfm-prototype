import {fail, fetchJson, readCookie, safeReturnTo} from './http.js';
import {ensureSchema, readSession, requireAccount} from './auth.js';

const OAUTH_COOKIE = 'biasfm_lastfm_oauth';
const OAUTH_PREFIX = 'lastfm:oauth:';
const OAUTH_TTL = 600;

function base64Url(bytes) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function randomId(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

/* Last.fm signs requests with MD5. Cloudflare's Web Crypto implementation
 * does not expose MD5, so keep the small, dependency-free implementation here
 * instead of shipping a Node-only crypto package to Pages Functions. */
function md5(value) {
  const input = new TextEncoder().encode(String(value));
  const bytes = Array.from(input);
  const bitLength = input.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let index = 0; index < 8; index += 1) bytes.push((bitLength / (2 ** (8 * index))) & 0xff);

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];
  const constants = Array.from({length: 64}, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32) >>> 0);
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const rotate = (number, amount) => ((number << amount) | (number >>> (32 - amount))) >>> 0;

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const words = new Uint32Array(16);
    for (let index = 0; index < 16; index += 1) {
      const start = offset + index * 4;
      words[index] = bytes[start] | (bytes[start + 1] << 8) | (bytes[start + 2] << 16) | (bytes[start + 3] << 24);
    }
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let index = 0; index < 64; index += 1) {
      let f;
      let g;
      if (index < 16) {
        f = (b & c) | (~b & d);
        g = index;
      } else if (index < 32) {
        f = (d & b) | (~d & c);
        g = (5 * index + 1) % 16;
      } else if (index < 48) {
        f = b ^ c ^ d;
        g = (3 * index + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * index) % 16;
      }
      const next = d;
      const sum = (a + f + constants[index] + words[g]) >>> 0;
      d = c;
      c = b;
      b = (b + rotate(sum, shifts[index])) >>> 0;
      a = next;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return [a0, b0, c0, d0].map(number => [0, 8, 16, 24].map(shift => ((number >>> shift) & 0xff).toString(16).padStart(2, '0')).join('')).join('');
}

function apiConfig(env) {
  const apiKey = String(env.LASTFM_API_KEY || '');
  const apiSecret = String(env.LASTFM_API_SECRET || '');
  if (!apiKey || !apiSecret) throw fail(503, 'Last.fm-Kontoverknüpfung ist noch nicht freigeschaltet. Der Betreiber muss API-Key und API-Secret hinterlegen.');
  return {apiKey, apiSecret};
}

export function configured(env) {
  return Boolean(env.LASTFM_API_KEY && env.LASTFM_API_SECRET && env.DB && env.SESSIONS);
}

function callbackUri(request) {
  return new URL('/api/lastfm/callback', new URL(request.url).origin).href;
}

function oauthCookie(value, maxAge) {
  return `${OAUTH_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/api/lastfm; Max-Age=${maxAge}`;
}

function oauthKey(id) {
  return `${OAUTH_PREFIX}${id}`;
}

function appendStatus(value, status) {
  const url = new URL(value);
  url.searchParams.set('lastfm', status);
  return url.href;
}

function signature(params, secret) {
  const payload = Object.keys(params).sort().map(key => `${key}${params[key]}`).join('');
  return md5(`${payload}${secret}`);
}

function mapApiError(body, fallback) {
  if (!body?.error) return fallback;
  if (Number(body.error) === 4 || Number(body.error) === 9) return 'Die Last.fm-Verbindung ist ungültig oder wurde widerrufen. Bitte verbinde dein Konto erneut.';
  if (Number(body.error) === 13) return 'Last.fm hat die signierte Anfrage abgelehnt. Bitte prüfe den API-Secret.';
  return 'Last.fm konnte die Kontoverknüpfung nicht abschließen. Bitte versuche es erneut.';
}

async function apiCall(env, params) {
  const {apiKey, apiSecret} = apiConfig(env);
  const signed = {...params, api_key: apiKey, api_sig: signature({...params, api_key: apiKey}, apiSecret), format: 'json'};
  let result;
  try {
    const query = new URLSearchParams(signed);
    result = await fetchJson(`https://ws.audioscrobbler.com/2.0/?${query}`, {headers: {Accept: 'application/json'}}, 15000);
  } catch {
    throw fail(502, 'Last.fm ist gerade nicht erreichbar. Bitte versuche es später erneut.');
  }
  if (!result.response.ok || result.body?.error) throw fail(502, mapApiError(result.body, 'Last.fm konnte die Anfrage nicht verarbeiten.'));
  return result.body;
}

function profileUrl(username) {
  return `https://www.last.fm/user/${encodeURIComponent(username)}`;
}

export async function start(request, env) {
  apiConfig(env);
  const {row} = await requireAccount(request, env);
  const requestUrl = new URL(request.url);
  const returnTo = safeReturnTo(requestUrl.searchParams.get('return_to'), new URL('/#settings', requestUrl.origin).href);
  const id = await randomId(24);
  if (!env.SESSIONS) throw fail(503, 'Die Cloudflare-Sessionablage ist noch nicht verbunden.');
  await env.SESSIONS.put(oauthKey(id), JSON.stringify({userId: row.id, returnTo, expires: Date.now() + OAUTH_TTL * 1000}), {expirationTtl: OAUTH_TTL});
  const params = new URLSearchParams({api_key: String(env.LASTFM_API_KEY), cb: callbackUri(request)});
  return {location: `https://www.last.fm/api/auth/?${params}`, headers: {'Set-Cookie': oauthCookie(id, OAUTH_TTL)}};
}

export async function callback(request, env) {
  const requestUrl = new URL(request.url);
  const stateId = readCookie(request, OAUTH_COOKIE);
  const state = stateId && env.SESSIONS ? await env.SESSIONS.get(oauthKey(stateId), 'json') : null;
  const fallback = new URL('/#settings', requestUrl.origin).href;
  if (!state?.userId || Number(state.expires || 0) <= Date.now()) throw fail(400, 'Die Last.fm-Anmeldung ist abgelaufen. Bitte starte sie erneut in den Einstellungen.');
  await env.SESSIONS.delete(oauthKey(stateId));
  const clearState = oauthCookie('', 0);
  if (!requestUrl.searchParams.has('token')) return {location: appendStatus(state.returnTo || fallback, 'failed'), headers: {'Set-Cookie': clearState}};
  try {
    const body = await apiCall(env, {method: 'auth.getSession', token: requestUrl.searchParams.get('token')});
    const session = body?.session;
    const username = String(session?.name || '').trim();
    const sessionKey = String(session?.key || '').trim();
    if (!username || !sessionKey) throw fail(502, 'Last.fm hat keine gültige Sitzung geliefert.');
    await ensureSchema(env.DB);
    const usernameKey = username.toLowerCase();
    const existing = await env.DB.prepare('SELECT account_id FROM lastfm_connections WHERE username_key = ?').bind(usernameKey).first();
    if (existing?.account_id && existing.account_id !== state.userId) return {location: appendStatus(state.returnTo || fallback, 'conflict'), headers: {'Set-Cookie': clearState}};
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO lastfm_connections (account_id, username, username_key, session_key, subscriber, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id) DO UPDATE SET username = excluded.username, username_key = excluded.username_key, session_key = excluded.session_key, subscriber = excluded.subscriber, updated_at = excluded.updated_at`)
      .bind(state.userId, username, usernameKey, sessionKey, Number(session.subscriber || 0) === 1 ? 1 : 0, now, now).run();
    return {location: appendStatus(state.returnTo || fallback, 'connected'), headers: {'Set-Cookie': clearState}};
  } catch (error) {
    return {location: appendStatus(state.returnTo || fallback, error?.status === 409 ? 'conflict' : 'failed'), headers: {'Set-Cookie': clearState}};
  }
}

export async function status(request, env) {
  const result = {configured: configured(env), authenticated: false, connected: false, profile: null};
  if (!env.DB || !env.SESSIONS) return result;
  const {account} = await readSession(request, env);
  if (!account?.userId) return result;
  result.authenticated = true;
  await ensureSchema(env.DB);
  const connection = await env.DB.prepare('SELECT username, subscriber, updated_at FROM lastfm_connections WHERE account_id = ?').bind(account.userId).first();
  if (connection) {
    result.connected = true;
    result.profile = {name: connection.username, url: profileUrl(connection.username), subscriber: Number(connection.subscriber) === 1, updatedAt: connection.updated_at};
  }
  return result;
}

export async function disconnect(request, env) {
  const {row} = await requireAccount(request, env);
  await env.DB.prepare('DELETE FROM lastfm_connections WHERE account_id = ?').bind(row.id).run();
  return {connected: false};
}

export {OAUTH_COOKIE, oauthCookie, md5};
