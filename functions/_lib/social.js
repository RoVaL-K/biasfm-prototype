import {fail} from './http.js';
import {ARTISTS} from './catalog.js';
import {accountProfile, readActivityPrivacy, readSession, requireAccount} from './auth.js';
import {listListens} from './catalog-store.js';
import {publicNowPlaying} from './lastfm.js';
import {ensureV3Schema} from './v3.js';

function artist(artistId) {
  const value = String(artistId || '').trim();
  const match = ARTISTS.find(item => item.id === value);
  if (!match) throw fail(400, 'Dieser Artist ist im Katalog nicht verfügbar.');
  return match;
}

async function readBody(request) {
  try { return await request.json(); } catch { throw fail(400, 'Ungültige JSON-Eingabe.'); }
}

export async function isAccountFollower(db, followerId, followedId) {
  if (!followerId || !followedId) return false;
  if (followerId === followedId) return true;
  const row = await db.prepare('SELECT 1 FROM account_follows WHERE follower_id = ? AND followed_id = ?').bind(followerId, followedId).first();
  return Boolean(row);
}

export async function listAccountFollows(request, env) {
  const {row} = await requireAccount(request, env);
  const result = await env.DB.prepare(`SELECT f.followed_id, a.username, f.created_at
    FROM account_follows f JOIN accounts a ON a.id = f.followed_id
    WHERE f.follower_id = ? ORDER BY f.created_at DESC`).bind(row.id).all();
  return {items: (result.results || []).map(item => ({userId: item.followed_id, username: item.username, createdAt: item.created_at}))};
}

export async function followAccount(request, env, followed = true) {
  const {row} = await requireAccount(request, env);
  const input = await readBody(request);
  const username = String(input.username || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,20}$/.test(username)) throw fail(400, 'Ungültiger Username.');
  const target = await env.DB.prepare('SELECT id, username FROM accounts WHERE username = ?').bind(username).first();
  if (!target) throw fail(404, 'Profil nicht gefunden.');
  if (target.id === row.id) throw fail(400, 'Du kannst dir nicht selbst folgen.');
  if (followed) {
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT OR IGNORE INTO account_follows (follower_id, followed_id, created_at) VALUES (?, ?, ?)').bind(row.id, target.id, now).run();
    return {username: target.username, followed: true};
  }
  await env.DB.prepare('DELETE FROM account_follows WHERE follower_id = ? AND followed_id = ?').bind(row.id, target.id).run();
  return {username: target.username, followed: false};
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
  await ensureV3Schema(env.DB);
  const normalized = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,20}$/.test(normalized)) throw fail(400, 'Ungültiger Username.');
  const row = await env.DB.prepare('SELECT * FROM accounts WHERE username = ?').bind(normalized).first();
  if (!row) throw fail(404, 'Profil nicht gefunden.');
  const profile = accountProfile(row, false);
  const privacy = profile.privacy || {};
  const {account: viewer} = await readSession(request, env);
  const isOwner = viewer?.userId === row.id;
  const isFollower = isOwner || await isAccountFollower(env.DB, viewer?.userId, row.id);
  if (privacy.profile === 'private' && !isOwner) throw fail(404, 'Profil nicht gefunden.');
  if (privacy.profile === 'followers' && !isFollower) throw fail(404, 'Profil nicht gefunden.');
  if (!isOwner && privacy.favorites !== 'public' && !(privacy.favorites === 'followers' && isFollower)) profile.favoriteArtists = [];
  if (!isOwner && privacy.stats !== 'public' && !(privacy.stats === 'followers' && isFollower)) delete profile.stats;
  // Lists belong to the public profile when their visibility permits it.
  // Keep this query optional so older databases remain readable until the
  // V3 collection schema has been created by the lists endpoint.
  try {
    const visibleLists = await env.DB.prepare(`SELECT l.id, l.title, l.description, l.visibility, l.share_slug, l.updated_at,
      m.cover_data, m.list_position, m.sort_mode,
      (SELECT COUNT(*) FROM user_list_items i0 WHERE i0.list_id = l.id) AS item_count,
      (SELECT COUNT(*) FROM user_list_likes ll WHERE ll.list_id = l.id) AS like_count,
      (SELECT COUNT(*) FROM user_list_follows lf WHERE lf.list_id = l.id) AS follower_count
      FROM user_lists l LEFT JOIN user_list_meta m ON m.list_id = l.id
      WHERE l.user_id = ? AND (l.visibility = 'public' OR (l.visibility = 'followers' AND ? = 1) OR (? = 1 AND l.visibility = 'private'))
      ORDER BY COALESCE(m.list_position, 2147483647) ASC, l.updated_at DESC LIMIT 50`).bind(row.id, isFollower ? 1 : 0, isOwner ? 1 : 0).all();
    const listRows = visibleLists.results || [];
    const itemRows = listRows.length ? await env.DB.prepare(`SELECT i.list_id, i.kind, i.entity_id, i.title, i.artist_name, i.note, i.position,
      COALESCE(m.release_date, '') AS release_date, COALESCE(m.cover_url, '') AS cover_url
      FROM user_list_items i LEFT JOIN user_list_item_meta m ON m.list_id = i.list_id AND m.kind = i.kind AND m.entity_id = i.entity_id
      WHERE i.list_id IN (SELECT id FROM user_lists WHERE user_id = ?)
      ORDER BY i.list_id, i.position ASC, i.created_at ASC`).bind(row.id).all() : {results: []};
    const itemsByList = (itemRows.results || []).reduce((map, item) => {
      if (listRows.some(list => list.id === item.list_id)) (map[item.list_id] ||= []).push({
        kind: item.kind, entityId: item.entity_id, title: item.title, artistName: item.artist_name, note: item.note,
        position: Number(item.position || 0), releaseDate: item.release_date || '', coverUrl: item.cover_url || ''
      });
      return map;
    }, {});
    profile.lists = listRows.map(list => ({
      id: list.id, title: list.title, description: list.description, visibility: list.visibility,
      shareSlug: list.share_slug, coverData: list.cover_data || '', listPosition: Number(list.list_position || 0),
      sortMode: list.sort_mode || 'release_date', itemCount: Number(list.item_count || 0),
      likes: Number(list.like_count || 0), followers: Number(list.follower_count || 0), items: itemsByList[list.id] || [],
      updatedAt: list.updated_at
    }));
  } catch {
    profile.lists = [];
  }
  const activityPolicy = await readActivityPrivacy(env.DB, row.id, privacy);
  const activityAllowed = isOwner || activityPolicy.visibility === 'public' || (activityPolicy.visibility === 'followers' && isFollower);
  profile.activityVisibility = activityPolicy.visibility;
  profile.activityNowPlayingVisible = activityPolicy.showNowPlaying;
  if (activityAllowed) {
    profile.activity = await listListens(env.DB, row.id, 8);
    if (activityPolicy.showNowPlaying) {
      try {
        const connection = await env.DB.prepare('SELECT username FROM lastfm_connections WHERE account_id = ?').bind(row.id).first();
        if (connection?.username) {
          const nowPlaying = await publicNowPlaying(env, connection.username);
          if (nowPlaying) profile.nowPlaying = {...nowPlaying, source: 'lastfm'};
        }
      } catch {}
    }
  }
  return {profile};
}
