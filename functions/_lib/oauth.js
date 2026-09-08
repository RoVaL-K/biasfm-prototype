import {fail, fetchJson, readCookie, safeReturnTo} from './http.js';
import {accountCookie, accountProfile, createSession, ensureSchema, normalizeEmail} from './auth.js';

const OAUTH_COOKIE = 'biasfm_oauth';
const OAUTH_PREFIX = 'oauth:';
const OAUTH_TTL = 600;
const SESSION_TTL = 60 * 60 * 24 * 30;

const PROVIDERS = {
  google: {
    label: 'Google',
    clientId: 'GOOGLE_CLIENT_ID',
    clientSecret: 'GOOGLE_CLIENT_SECRET',
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile'
  },
  discord: {
    label: 'Discord',
    clientId: 'DISCORD_CLIENT_ID',
    clientSecret: 'DISCORD_CLIENT_SECRET',
    authorize: 'https://discord.com/oauth2/authorize',
    token: 'https://discord.com/api/oauth2/token',
    userinfo: 'https://discord.com/api/users/@me',
    scope: 'identify email'
  }
};

function providerConfig(provider, env) {
  const config = PROVIDERS[provider];
  if (!config) throw fail(404, 'Dieser Login-Anbieter ist nicht verfügbar.');
  return {...config, clientId: String(env[config.clientId] || ''), clientSecret: String(env[config.clientSecret] || '')};
}

export function providerStatus(env) {
  return Object.fromEntries(Object.entries(PROVIDERS).map(([id, config]) => [id, Boolean(env[config.clientId] && env[config.clientSecret] && env.SESSIONS)]));
}

export function configured(env, provider) {
  const config = providerConfig(provider, env);
  return Boolean(config.clientId && config.clientSecret && env.SESSIONS);
}

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

function stateKey(id) {
  return `${OAUTH_PREFIX}${id}`;
}

function oauthCookie(value, maxAge) {
  return `${OAUTH_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=${maxAge}`;
}

function appendAuthStatus(value, status) {
  const url = new URL(value);
  url.searchParams.set('auth', status);
  return url.href;
}

function redirectUri(request, provider) {
  return new URL(`/api/auth/${provider}/callback`, new URL(request.url).origin).href;
}

export async function start(request, env, provider) {
  const config = providerConfig(provider, env);
  if (!configured(env, provider)) throw fail(503, `${config.label}-Login ist noch nicht freigeschaltet.`);
  const requestUrl = new URL(request.url);
  const returnTo = safeReturnTo(requestUrl.searchParams.get('return_to'), new URL('/#profile', requestUrl.origin).href);
  const id = await randomId(24);
  const state = await randomId(24);
  const verifier = await randomId(48);
  if (!env.SESSIONS) throw fail(503, 'Die Cloudflare-Sessionablage ist noch nicht verbunden.');
  await env.SESSIONS.put(stateKey(id), JSON.stringify({provider, state, verifier, returnTo, expires: Date.now() + OAUTH_TTL * 1000}), {expirationTtl: OAUTH_TTL});
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri(request, provider),
    response_type: 'code',
    scope: config.scope,
    state,
    code_challenge_method: 'S256',
    code_challenge: await challenge(verifier)
  });
  if (provider === 'google') {
    params.set('access_type', 'online');
    params.set('prompt', 'select_account');
  } else {
    params.set('prompt', 'consent');
  }
  return {location: `${config.authorize}?${params}`, cookies: [oauthCookie(id, OAUTH_TTL)]};
}

async function exchangeCode(config, request, provider, code, verifier) {
  const result = await fetchJson(config.token, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri(request, provider),
      code_verifier: verifier
    })
  }, 15000);
  if (!result.response.ok || !result.body?.access_token) throw fail(401, `${config.label} konnte die Anmeldung nicht bestätigen.`);
  return result.body.access_token;
}

async function providerIdentity(config, accessToken, provider) {
  const response = await fetch(config.userinfo, {headers: {Authorization: `Bearer ${accessToken}`} });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw fail(401, `${config.label} hat kein gültiges Profil geliefert.`);
  if (provider === 'google') {
    if (!body.sub || !body.email || body.email_verified !== true) throw fail(403, 'Google muss eine bestätigte E-Mail-Adresse freigeben.');
    return {subject: String(body.sub), email: normalizeEmail(body.email), displayName: body.name || body.email.split('@')[0], avatarUrl: safeProviderAvatar('google', body.picture)};
  }
  if (!body.id || !body.email || body.verified !== true) throw fail(403, 'Discord muss eine bestätigte E-Mail-Adresse freigeben.');
  return {subject: String(body.id), email: normalizeEmail(body.email), displayName: body.global_name || body.username || body.email.split('@')[0], avatarUrl: body.avatar ? safeProviderAvatar('discord', `https://cdn.discordapp.com/avatars/${encodeURIComponent(body.id)}/${encodeURIComponent(body.avatar)}.png?size=128`) : ''};
}

function safeProviderAvatar(provider, value) {
  try {
    const url = new URL(String(value || ''));
    const allowed = url.protocol === 'https:' && (provider === 'google' ? url.hostname.endsWith('.googleusercontent.com') : url.hostname === 'cdn.discordapp.com' || url.hostname === 'media.discordapp.net');
    return allowed ? url.href.slice(0, 1000) : '';
  } catch { return ''; }
}

function usernameBase(displayName, provider) {
  const ascii = String(displayName || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const fallback = provider === 'google' ? 'google-user' : 'discord-user';
  return (ascii || fallback).slice(0, 20);
}

async function uniqueUsername(db, displayName, provider) {
  const base = usernameBase(displayName, provider);
  for (let index = 0; index < 100; index += 1) {
    const suffix = index ? `-${index + 1}` : '';
    const candidate = `${base.slice(0, Math.max(3, 20 - suffix.length))}${suffix}`;
    const exists = await db.prepare('SELECT id FROM accounts WHERE username = ?').bind(candidate).first();
    if (!exists) return candidate;
  }
  return `${provider}-${(await randomId(6)).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`.slice(0, 20);
}

async function accountForIdentity(env, provider, identity) {
  await ensureSchema(env.DB);
  const existingIdentity = await env.DB.prepare('SELECT account_id FROM account_identities WHERE provider = ? AND subject = ?').bind(provider, identity.subject).first();
  if (existingIdentity?.account_id) {
    const row = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(existingIdentity.account_id).first();
    if (row) return row;
    await env.DB.prepare('DELETE FROM account_identities WHERE provider = ? AND subject = ?').bind(provider, identity.subject).run();
  }

  const existingAccount = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?').bind(identity.email).first();
  if (existingAccount) {
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO account_identities (provider, subject, account_id, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider, subject) DO UPDATE SET account_id = excluded.account_id, email = excluded.email, updated_at = excluded.updated_at`)
      .bind(provider, identity.subject, existingAccount.id, identity.email, now, now).run();
    return existingAccount;
  }

  const id = `acct_${await randomId(18)}`;
  const username = await uniqueUsername(env.DB, identity.displayName, provider);
  const now = new Date().toISOString();
  const profile = {bio: '', avatarData: '', avatarUrl: identity.avatarUrl || '', ultBiasArtist: '', ultBiasMember: '', biasMemberId: '', favoriteArtists: [], biasLine: [], accentColor: '#38bdf8', fandomName: 'Eigener Profil-Akzent'};
  try {
    await env.DB.prepare(`INSERT INTO accounts (id, email, username, password_hash, profile_json, privacy_json, notification_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, identity.email, username, `oauth$${provider}$${await randomId(24)}`, JSON.stringify(profile), JSON.stringify({profile: 'public', stats: 'private', activity: 'private', follows: 'public', favorites: 'public'}), JSON.stringify({release: true, announcement: false, reminder: true, social: false, product: true}), now, now).run();
  } catch (error) {
    if (!/unique|constraint/i.test(error?.message || '')) throw error;
    const retry = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?').bind(identity.email).first();
    if (retry) return accountForIdentity(env, provider, identity);
    throw error;
  }
  await env.DB.prepare('INSERT INTO account_identities (provider, subject, account_id, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(provider, identity.subject, id, identity.email, now, now).run();
  return await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(id).first();
}

export async function callback(request, env, provider) {
  const config = providerConfig(provider, env);
  const requestUrl = new URL(request.url);
  const stateId = readCookie(request, OAUTH_COOKIE);
  const state = stateId && env.SESSIONS ? await env.SESSIONS.get(stateKey(stateId), 'json') : null;
  if (!state || state.provider !== provider || state.state !== requestUrl.searchParams.get('state')) throw fail(400, 'Die OAuth-Anmeldung ist ungültig oder abgelaufen. Bitte starte sie erneut.');
  await env.SESSIONS.delete(stateKey(stateId));
  const clearState = oauthCookie('', 0);
  if (requestUrl.searchParams.has('error')) return {location: appendAuthStatus(state.returnTo, 'cancelled'), cookies: [clearState]};
  const code = requestUrl.searchParams.get('code');
  if (!code) return {location: appendAuthStatus(state.returnTo, 'failed'), cookies: [clearState]};
  try {
    const accessToken = await exchangeCode(config, request, provider, code, state.verifier);
    const identity = await providerIdentity(config, accessToken, provider);
    const row = await accountForIdentity(env, provider, identity);
    const token = await createSession(env, row.id);
    return {location: appendAuthStatus(state.returnTo, 'connected'), cookies: [accountCookie(token, SESSION_TTL), clearState], profile: accountProfile(row, true)};
  } catch {
    return {location: appendAuthStatus(state.returnTo, 'failed'), cookies: [clearState]};
  }
}

export function redirectResponse(result) {
  const headers = new Headers({'Location': result.location, 'Cache-Control': 'no-store'});
  for (const value of result.cookies || []) headers.append('Set-Cookie', value);
  return new Response(null, {status: 303, headers});
}

export {OAUTH_COOKIE, oauthCookie};
