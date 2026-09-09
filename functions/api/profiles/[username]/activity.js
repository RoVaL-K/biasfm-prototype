import {failure, json, options, fail} from '../../../_lib/http.js';
import {ensureSchema, readActivityPrivacy, readSession} from '../../../_lib/auth.js';
import {listListens} from '../../../_lib/catalog-store.js';
import {publicNowPlaying} from '../../../_lib/lastfm.js';
import {isAccountFollower} from '../../../_lib/social.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try {
    const username = String(context.params.username || '').trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,20}$/.test(username)) throw fail(400, 'Ungültiger Username.');
    await ensureSchema(context.env.DB);
    const owner = await context.env.DB.prepare('SELECT id, username, privacy_json FROM accounts WHERE username = ?').bind(username).first();
    if (!owner) throw fail(404, 'Profil nicht gefunden.');
    let privacy = {};
    try { privacy = JSON.parse(owner.privacy_json || '{}') || {}; } catch {}
    const activityPolicy = await readActivityPrivacy(context.env.DB, owner.id, privacy);
    const visibility = activityPolicy.visibility;
    const viewer = await readSession(context.request, context.env);
    const isOwner = viewer.account?.userId === owner.id;
    const isFollower = isOwner || await isAccountFollower(context.env.DB, viewer.account?.userId, owner.id);
    if (!isOwner && visibility === 'private') throw fail(404, 'Aktivität nicht verfügbar.');
    if (!isOwner && visibility === 'followers' && !isFollower) throw fail(404, 'Aktivität nicht verfügbar.');
    const items = await listListens(context.env.DB, owner.id, new URL(context.request.url).searchParams.get('limit') || '20');
    let nowPlaying = null;
    if (activityPolicy.showNowPlaying) {
      try {
        const connection = await context.env.DB.prepare('SELECT username FROM lastfm_connections WHERE account_id = ?').bind(owner.id).first();
        if (connection?.username) nowPlaying = await publicNowPlaying(context.env, connection.username);
      } catch {}
    }
    return json(context.request, {username: owner.username, visibility, showNowPlaying: activityPolicy.showNowPlaying, nowPlaying, items});
  } catch (error) { return failure(context.request, error); }
}
