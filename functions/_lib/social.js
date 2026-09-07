import {fail} from './http.js';
import {ARTISTS} from './catalog.js';
import {accountProfile, ensureSchema, readSession, requireAccount} from './auth.js';

function artist(artistId) {
  const value = String(artistId || '').trim();
  const match = ARTISTS.find(item => item.id === value);
  if (!match) throw fail(400, 'Dieser Artist ist im Katalog nicht verfügbar.');
  return match;
}

async function readBody(request) {
  try { return await request.json(); } catch { throw fail(400, 'Ungültige JSON-Eingabe.'); }
}

export async function listArtistFollows(request, env) {
  const {row} = await requireAccount(request, env);
  const result = await env.DB.prepare('SELECT artist_id, release_enabled, announcement_enabled, created_at FROM artist_follows WHERE user_id = ? ORDER BY created_at DESC').bind(row.id).all();
  return {items: (result.results || []).map(item => ({artistId: item.artist_id, release: Boolean(item.release_enabled), announcement: Boolean(item.announcement_enabled), createdAt: item.created_at}))};
}

export async function followArtist(request, env, followed = true) {
  const {row} = await requireAccount(request, env);
  const input = await readBody(request);
  const item = artist(input.artistId);
  const release = input.release !== false;
  const announcement = input.announcement === true;
  const now = new Date().toISOString();
  if (followed) {
    await env.DB.prepare(`INSERT INTO artist_follows (user_id, artist_id, release_enabled, announcement_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, artist_id) DO UPDATE SET release_enabled = excluded.release_enabled, announcement_enabled = excluded.announcement_enabled, updated_at = excluded.updated_at`)
      .bind(row.id, item.id, release ? 1 : 0, announcement ? 1 : 0, now, now).run();
    await env.DB.prepare('INSERT INTO account_notifications (id, user_id, kind, title, body, action_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(`follow-${row.id}-${item.id}-${Date.now()}`, row.id, 'social', `${item.name} gefolgt`, 'Release-Hinweise für diesen Artist sind für dich vorgemerkt.', `#catalog`, now).run();
    return {artistId: item.id, followed: true, release, announcement};
  }
  await env.DB.prepare('DELETE FROM artist_follows WHERE user_id = ? AND artist_id = ?').bind(row.id, item.id).run();
  return {artistId: item.id, followed: false};
}

export async function listNotifications(request, env) {
  const {row} = await requireAccount(request, env);
  const result = await env.DB.prepare('SELECT id, kind, title, body, action_url, read_at, created_at FROM account_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').bind(row.id).all();
  return {items: (result.results || []).map(item => ({id: item.id, kind: item.kind, title: item.title, body: item.body, actionUrl: item.action_url || '', read: Boolean(item.read_at), createdAt: item.created_at}))};
}

export async function markNotification(request, env, all = false) {
  const {row} = await requireAccount(request, env);
  const now = new Date().toISOString();
  if (all) await env.DB.prepare('UPDATE account_notifications SET read_at = COALESCE(read_at, ?) WHERE user_id = ?').bind(now, row.id).run();
  else {
    const input = await readBody(request);
    const id = String(input.id || '').trim();
    if (!id || id.length > 160) throw fail(400, 'Ungültige Benachrichtigung.');
    await env.DB.prepare('UPDATE account_notifications SET read_at = COALESCE(read_at, ?) WHERE user_id = ? AND id = ?').bind(now, row.id, id).run();
  }
  return {updated: true};
}

export async function publicProfile(request, env, username) {
  if (!env.DB) throw fail(503, 'Die Cloudflare-Datenbank ist noch nicht verbunden.');
  await ensureSchema(env.DB);
  const normalized = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,20}$/.test(normalized)) throw fail(400, 'Ungültiger Username.');
  const row = await env.DB.prepare('SELECT * FROM accounts WHERE username = ?').bind(normalized).first();
  if (!row) throw fail(404, 'Profil nicht gefunden.');
  const profile = accountProfile(row, false);
  const privacy = profile.privacy || {};
  if (privacy.profile === 'private') throw fail(404, 'Profil nicht gefunden.');
  if (privacy.profile === 'followers') {
    const {account: viewer} = await readSession(request, env);
    if (!viewer?.userId) throw fail(404, 'Profil nicht gefunden.');
  }
  if (privacy.favorites !== 'public') profile.favoriteArtists = [];
  if (privacy.stats !== 'public') delete profile.stats;
  return {profile};
}
