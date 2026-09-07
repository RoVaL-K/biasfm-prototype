import {fail, readCookie} from './http.js';

const ACCOUNT_COOKIE = 'biasfm_account';
const SESSION_PREFIX = 'account:';
const SESSION_TTL = 60 * 60 * 24 * 30;
const schemaReady = new WeakSet();

const PROFILE_DEFAULTS = {
  bio: '', avatarData: '', ultBiasArtist: '', ultBiasMember: '', biasMemberId: '',
  favoriteArtists: [], biasLine: [], accentColor: '#38bdf8', fandomName: 'Eigener Profil-Akzent'
};
const PRIVACY_DEFAULTS = {profile: 'public', stats: 'private', activity: 'private', follows: 'public', favorites: 'public'};
const NOTIFICATION_DEFAULTS = {release: true, announcement: false, reminder: true, social: false, product: true};
const PRIVACY_VALUES = new Set(['public', 'followers', 'private']);

function accountCookie(value, maxAge) {
  // SameSite=None is required when the GitHub Pages mirror calls the
  // Cloudflare API with credentials. Secure keeps the account session HTTPS-only.
  return `${ACCOUNT_COOKIE}=${value}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAge}`;
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(value).length + 3) % 4);
  const binary = atob(normalized);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function randomId(bytes = 24) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

async function hashPassword(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256'}, key, 256);
  return `pbkdf2$150000$${base64Url(salt)}$${base64Url(bits)}`;
}

async function verifyPassword(password, encoded) {
  const [scheme, iterationText, saltText, digestText] = String(encoded || '').split('$');
  const iterations = Number(iterationText);
  if (scheme !== 'pbkdf2' || !Number.isSafeInteger(iterations) || iterations < 100000 || iterations > 500000 || !saltText || !digestText) return false;
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({name: 'PBKDF2', salt: fromBase64Url(saltText), iterations, hash: 'SHA-256'}, key, 256));
    const expected = fromBase64Url(digestText);
    if (bits.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < bits.length; index += 1) difference |= bits[index] ^ expected[index];
    return difference === 0;
  } catch { return false; }
}

async function ensureSchema(db) {
  if (!db) throw fail(503, 'Die Cloudflare-Datenbank ist noch nicht verbunden.');
  if (schemaReady.has(db)) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      profile_json TEXT NOT NULL DEFAULT '{}',
      privacy_json TEXT NOT NULL DEFAULT '{}',
      notification_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS artist_follows (
      user_id TEXT NOT NULL,
      artist_id TEXT NOT NULL,
      release_enabled INTEGER NOT NULL DEFAULT 1,
      announcement_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, artist_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS account_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      action_url TEXT NOT NULL DEFAULT '',
      read_at TEXT,
      created_at TEXT NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS account_notifications_user_created ON account_notifications (user_id, created_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS artist_follows_artist ON artist_follows (artist_id)')
  ]);
  schemaReady.add(db);
}

function parseJsonObject(value, fallback = {}) {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch { return fallback; }
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email) || email.length > 254) throw fail(400, 'Bitte eine gültige E-Mail-Adresse eingeben.');
  return email;
}

function normalizeUsername(value) {
  const username = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,20}$/.test(username)) throw fail(400, 'Der Username muss 3–20 Kleinbuchstaben, Zahlen, - oder _ enthalten.');
  return username;
}

function validatePassword(value) {
  const password = String(value || '');
  if (password.length < 10 || password.length > 128) throw fail(400, 'Das Passwort muss 10–128 Zeichen lang sein.');
  return password;
}

function cleanAvatar(value) {
  const avatarData = String(value || '');
  if (!avatarData) return '';
  if (!/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(avatarData) || avatarData.length > 3_000_000) throw fail(400, 'Das Profilbild muss als JPG, PNG oder WebP bis 2 MB vorliegen.');
  return avatarData;
}

function cleanProfile(input, existing = {}) {
  const profile = {...PROFILE_DEFAULTS, ...existing};
  if (Object.hasOwn(input || {}, 'username')) profile.username = normalizeUsername(input.username);
  if (Object.hasOwn(input || {}, 'bio')) profile.bio = String(input.bio || '').slice(0, 360);
  if (Object.hasOwn(input || {}, 'avatarData')) profile.avatarData = cleanAvatar(input.avatarData);
  for (const key of ['ultBiasArtist', 'ultBiasMember', 'biasMemberId']) {
    if (Object.hasOwn(input || {}, key)) profile[key] = String(input[key] || '').slice(0, 120);
  }
  if (Object.hasOwn(input || {}, 'accentColor') && /^#[0-9a-f]{6}$/i.test(String(input.accentColor))) profile.accentColor = String(input.accentColor).toLowerCase();
  if (Object.hasOwn(input || {}, 'fandomName')) profile.fandomName = String(input.fandomName || '').slice(0, 80);
  if (Object.hasOwn(input || {}, 'favoriteArtists') || Object.hasOwn(input || {}, 'biasLine')) {
    const values = Array.isArray(input.favoriteArtists) ? input.favoriteArtists : input.biasLine;
    profile.favoriteArtists = [...new Set((Array.isArray(values) ? values : []).map(value => String(value).trim()).filter(value => /^[a-z0-9_-]{1,100}$/i.test(value)))].slice(0, 10);
    profile.biasLine = profile.favoriteArtists.slice();
  }
  return profile;
}

function cleanPrivacy(input, existing = {}) {
  const next = {...PRIVACY_DEFAULTS, ...existing};
  for (const key of Object.keys(PRIVACY_DEFAULTS)) if (Object.hasOwn(input || {}, key) && PRIVACY_VALUES.has(input[key])) next[key] = input[key];
  return next;
}

function cleanNotifications(input, existing = {}) {
  const next = {...NOTIFICATION_DEFAULTS, ...existing};
  for (const key of Object.keys(NOTIFICATION_DEFAULTS)) if (Object.hasOwn(input || {}, key)) next[key] = Boolean(input[key]);
  return next;
}

function decodeAccount(row) {
  if (!row) return null;
  return {
    ...row,
    profile: parseJsonObject(row.profile_json, {}),
    privacy: {...PRIVACY_DEFAULTS, ...parseJsonObject(row.privacy_json, {})},
    notificationPrefs: {...NOTIFICATION_DEFAULTS, ...parseJsonObject(row.notification_json, {})}
  };
}

export function accountProfile(row, includePrivate = true) {
  const account = decodeAccount(row);
  if (!account) return null;
  const profile = cleanProfile(account.profile, account.profile);
  const result = {
    id: account.id,
    username: account.username,
    bio: profile.bio || '',
    avatarData: profile.avatarData || '',
    ultBiasArtist: profile.ultBiasArtist || '',
    ultBiasMember: profile.ultBiasMember || '',
    biasMemberId: profile.biasMemberId || '',
    favoriteArtists: profile.favoriteArtists || [],
    privacy: account.privacy
  };
  if (includePrivate) {
    result.email = account.email;
    result.accentColor = profile.accentColor || PROFILE_DEFAULTS.accentColor;
    result.fandomName = profile.fandomName || PROFILE_DEFAULTS.fandomName;
    result.notificationPrefs = account.notificationPrefs;
  }
  return result;
}

async function readSession(request, env) {
  const token = readCookie(request, ACCOUNT_COOKIE);
  if (!token || !env.SESSIONS) return {token: '', account: null};
  const account = await env.SESSIONS.get(`${SESSION_PREFIX}${token}`, 'json');
  if (!account || Number(account.expires || 0) <= Date.now()) {
    if (account) await env.SESSIONS.delete(`${SESSION_PREFIX}${token}`);
    return {token: '', account: null};
  }
  return {token, account};
}

async function requireAccount(request, env) {
  const {token, account} = await readSession(request, env);
  if (!token || !account?.userId) throw fail(401, 'Bitte melde dich für diese Funktion an.');
  await ensureSchema(env.DB);
  const row = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(account.userId).first();
  if (!row) throw fail(401, 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
  return {token, account, row};
}

async function createSession(env, userId) {
  if (!env.SESSIONS) throw fail(503, 'Die Cloudflare-Sessionablage ist noch nicht verbunden.');
  const token = await randomId(32);
  await env.SESSIONS.put(`${SESSION_PREFIX}${token}`, JSON.stringify({userId, expires: Date.now() + SESSION_TTL * 1000}), {expirationTtl: SESSION_TTL});
  return token;
}

async function body(request) {
  try { return await request.json(); } catch { throw fail(400, 'Ungültige JSON-Eingabe.'); }
}

export async function me(request, env) {
  const {account: session} = await readSession(request, env);
  if (!session?.userId || !env.DB) return {authenticated: false};
  await ensureSchema(env.DB);
  const account = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(session.userId).first();
  if (!account) return {authenticated: false};
  return {authenticated: true, profile: accountProfile(account, true)};
}

export async function signup(request, env) {
  await ensureSchema(env.DB);
  const input = await body(request);
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);
  const passwordHash = await hashPassword(validatePassword(input.password));
  const id = `acct_${await randomId(18)}`;
  const now = new Date().toISOString();
  const profile = cleanProfile({username, bio: ''});
  try {
    await env.DB.prepare(`INSERT INTO accounts (id, email, username, password_hash, profile_json, privacy_json, notification_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, email, username, passwordHash, JSON.stringify(profile), JSON.stringify(PRIVACY_DEFAULTS), JSON.stringify(NOTIFICATION_DEFAULTS), now, now).run();
  } catch (error) {
    if (/unique|constraint/i.test(error?.message || '')) throw fail(409, 'E-Mail oder Username ist bereits vergeben.');
    throw error;
  }
  const token = await createSession(env, id);
  const row = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(id).first();
  return {profile: accountProfile(row, true), headers: {'Set-Cookie': accountCookie(token, SESSION_TTL)}};
}

export async function login(request, env) {
  await ensureSchema(env.DB);
  const input = await body(request);
  const email = normalizeEmail(input.email);
  const password = validatePassword(input.password);
  const row = await env.DB.prepare('SELECT * FROM accounts WHERE email = ?').bind(email).first();
  if (!row || !(await verifyPassword(password, row.password_hash))) throw fail(401, 'E-Mail oder Passwort ist nicht korrekt.');
  const token = await createSession(env, row.id);
  return {profile: accountProfile(row, true), headers: {'Set-Cookie': accountCookie(token, SESSION_TTL)}};
}

export async function logout(request, env) {
  const {token} = await readSession(request, env);
  if (token && env.SESSIONS) await env.SESSIONS.delete(`${SESSION_PREFIX}${token}`);
  return {headers: {'Set-Cookie': accountCookie('', 0)}};
}

export async function updateProfile(request, env) {
  const {row} = await requireAccount(request, env);
  const input = await body(request);
  const current = decodeAccount(row);
  const profile = cleanProfile(input, current.profile);
  const privacy = cleanPrivacy(input.privacy, current.privacy);
  const notificationPrefs = cleanNotifications(input.notificationPrefs, current.notificationPrefs);
  if (profile.username !== row.username) {
    const duplicate = await env.DB.prepare('SELECT id FROM accounts WHERE username = ? AND id != ?').bind(profile.username, row.id).first();
    if (duplicate) throw fail(409, 'Dieser Username ist bereits vergeben.');
  }
  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE accounts SET username = ?, profile_json = ?, privacy_json = ?, notification_json = ?, updated_at = ? WHERE id = ?')
    .bind(profile.username, JSON.stringify(profile), JSON.stringify(privacy), JSON.stringify(notificationPrefs), now, row.id).run();
  const next = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(row.id).first();
  return {profile: accountProfile(next, true)};
}

export async function currentAccount(request, env) {
  return requireAccount(request, env);
}

export {ACCOUNT_COOKIE, accountCookie, ensureSchema, readSession, requireAccount, SESSION_PREFIX};
