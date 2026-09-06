import {cookie, fail, fetchJson, readCookie, safeReturnTo} from './http.js';

const SESSION_COOKIE = 'biasfm_spotify';
const sessionKey = id => `spotify:${id}`;

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

async function challenge(verifier) {
  return base64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
}

export function configured(env) {
  return Boolean(env.SPOTIFY_CLIENT_ID);
}

export async function readSession(request, env) {
  const id = readCookie(request, SESSION_COOKIE);
  if (!id || !env.SESSIONS) return {id: '', session: null};
  const session = await env.SESSIONS.get(sessionKey(id), 'json');
  if (!session || Number(session.expires || 0) <= Date.now()) {
    if (session) await env.SESSIONS.delete(sessionKey(id));
    return {id: '', session: null};
  }
  return {id, session};
}

async function writeSession(env, id, session, ttl = 604800) {
  if (!env.SESSIONS) throw fail(503, 'Die Cloudflare-Sessionablage ist noch nicht verbunden.');
  await env.SESSIONS.put(sessionKey(id), JSON.stringify(session), {expirationTtl: ttl});
}

async function token(env, params) {
  const result = await fetchJson('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({...params, client_id: env.SPOTIFY_CLIENT_ID})
  }, 15000);
  if (!result.response.ok || !result.body?.access_token) throw fail(401, 'Die Spotify-Verbindung ist abgelaufen. Bitte erneut verbinden.');
  return result.body;
}

async function access(env, id, session) {
  if (Number(session.tokenExpires || 0) > Date.now() + 60000) return session.accessToken;
  if (!session.refreshToken) throw fail(401, 'Bitte Spotify erneut verbinden.');
  const refreshed = await token(env, {grant_type: 'refresh_token', refresh_token: session.refreshToken});
  const next = {...session, accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token || session.refreshToken, tokenExpires: Date.now() + Number(refreshed.expires_in || 3600) * 1000};
  await writeSession(env, id, next);
  Object.assign(session, next);
  return next.accessToken;
}

async function spotifyFetch(env, id, session, path) {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {headers: {Authorization: `Bearer ${await access(env, id, session)}`}});
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw fail(401, 'Die Verbindung wurde widerrufen oder ist abgelaufen. Bitte erneut verbinden.');
    if (response.status === 403) throw fail(403, 'Spotify erlaubt diesen Zugriff für dein Konto oder diese App nicht.');
    if (response.status === 429) throw fail(429, 'Spotify begrenzt gerade die Anfragen. Bitte später erneut versuchen.');
    throw fail(502, 'Spotify ist gerade nicht erreichbar. Bitte erneut versuchen.');
  }
  return body;
}

export async function status(request, env) {
  const {session} = await readSession(request, env);
  return {configured: configured(env), connected: Boolean(session?.accessToken), profile: session?.profile || null};
}

export async function connect(request, env) {
  if (!configured(env)) throw fail(503, 'Spotify-Anmeldung ist noch nicht freigeschaltet. Du kannst bereits deinen Profil-Link und Playlists hinterlegen.');
  const requestUrl = new URL(request.url);
  const redirectUri = new URL('/api/spotify/callback', requestUrl.origin).href;
  const sid = await randomId();
  const state = await randomId(24);
  const verifier = await randomId(48);
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get('return_to'), new URL('/#settings', requestUrl.origin).href);
  await writeSession(env, sid, {state, verifier, returnTo, expires: Date.now() + 600000}, 600);
  const params = new URLSearchParams({client_id: env.SPOTIFY_CLIENT_ID, response_type: 'code', redirect_uri: redirectUri, scope: 'playlist-read-private playlist-read-collaborative', state, code_challenge_method: 'S256', code_challenge: await challenge(verifier)});
  return {location: `https://accounts.spotify.com/authorize?${params}`, headers: {'Set-Cookie': cookie(SESSION_COOKIE, sid, 600)}};
}

export async function callback(request, env) {
  const {id, session} = await readSession(request, env);
  const requestUrl = new URL(request.url);
  const fallback = new URL('/#settings', requestUrl.origin).href;
  if (!id || !session || session.state !== requestUrl.searchParams.get('state')) throw fail(400, 'Die Spotify-Anmeldung ist ungültig oder abgelaufen. Bitte starte sie erneut im Profil.');
  await env.SESSIONS.delete(sessionKey(id));
  if (requestUrl.searchParams.has('error')) return {location: `${session.returnTo || fallback}?spotify=cancelled`, headers: {'Set-Cookie': cookie(SESSION_COOKIE, '', 0)}};
  const code = requestUrl.searchParams.get('code');
  if (!code) throw fail(400, 'Spotify hat keinen Anmeldecode geliefert.');
  try {
    const redirectUri = new URL('/api/spotify/callback', requestUrl.origin).href;
    const tokenData = await token(env, {grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: session.verifier});
    const profileResponse = await fetch(`https://api.spotify.com/v1/me`, {headers: {Authorization: `Bearer ${tokenData.access_token}`}});
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile?.id) throw fail(502, 'Spotify hat kein gültiges Profil geliefert.');
    const next = {accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token, tokenExpires: Date.now() + Number(tokenData.expires_in || 3600) * 1000, expires: Date.now() + 604800000, profile: {id: profile.id, name: profile.display_name || profile.id, url: `https://open.spotify.com/user/${encodeURIComponent(profile.id)}`}};
    const nextId = await randomId();
    await writeSession(env, nextId, next);
    return {location: `${session.returnTo || fallback}?spotify=connected`, headers: {'Set-Cookie': cookie(SESSION_COOKIE, nextId, 604800)}};
  } catch {
    return {location: `${session.returnTo || fallback}?spotify=failed`, headers: {'Set-Cookie': cookie(SESSION_COOKIE, '', 0)}};
  }
}

export async function disconnect(request, env) {
  const {id} = await readSession(request, env);
  if (id && env.SESSIONS) await env.SESSIONS.delete(sessionKey(id));
  return {connected: false, headers: {'Set-Cookie': cookie(SESSION_COOKIE, '', 0)}};
}

export async function playlists(request, env) {
  const {id, session} = await readSession(request, env);
  if (!id || !session?.accessToken) throw fail(401, 'Bitte verbinde zuerst dein Spotify-Konto.');
  const offset = Number(new URL(request.url).searchParams.get('offset') || 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw fail(400, 'Ungültige Playlist-Seite.');
  const data = await spotifyFetch(env, id, session, `/me/playlists?limit=20&offset=${offset}`);
  return {items: (data?.items || []).filter(Boolean).map(playlist => ({id: playlist.id, name: playlist.name, owner: playlist.owner?.display_name || playlist.owner?.id || '', url: `https://open.spotify.com/playlist/${encodeURIComponent(playlist.id)}`, image: playlist.images?.find(image => /^https:\/\/i\.scdn\.co\//.test(image.url))?.url || '', total: playlist.items?.total ?? playlist.tracks?.total ?? null})), nextOffset: data?.next ? offset + 20 : null, total: data?.total};
}
