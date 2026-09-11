import {fail} from './http.js';
import {ensureSchema, requireAccount, readSession} from './auth.js';
import {isEmailVerified} from './verification.js';
import {ARTISTS} from './catalog.js';
import {SEED_TRACKS} from './catalog-store.js';

const ready = new WeakSet();
const VISIBILITY = new Set(['public', 'followers', 'private', 'unlisted']);
const GROUP_VISIBILITY = new Set(['public', 'private', 'unlisted']);
const GROUP_JOIN = new Set(['open', 'request']);

function text(value, max = 500) { return String(value ?? '').trim().slice(0, max); }
function id(prefix) { return `${prefix}_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`; }
function slug(value) { return text(value, 80).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || `item-${Date.now()}`; }
function json(value, fallback = {}) { try { const parsed = JSON.parse(value || ''); return parsed && typeof parsed === 'object' ? parsed : fallback; } catch { return fallback; } }
async function body(request) { try { return await request.json(); } catch { throw fail(400, 'Ungültige JSON-Eingabe.'); } }
function safeUrl(value) {
  const raw = text(value, 1000); if (!raw) return '';
  try { const url = new URL(raw); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

function canonicalArtistKey(value) {
  const raw = text(value, 160);
  const match = ARTISTS.find(item => item.id === raw || item.mbid === raw || `artist:${item.id}` === raw || `artist:${item.mbid}` === raw);
  return match ? `artist:${match.mbid || match.id}` : raw;
}

export async function ensureV3Schema(db) {
  if (!db) throw fail(503, 'Die Cloudflare-Datenbank ist noch nicht verbunden.');
  if (ready.has(db)) return;
  await ensureSchema(db);
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS community_groups (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '', visibility TEXT NOT NULL DEFAULT 'public',
      join_mode TEXT NOT NULL DEFAULT 'request', artist_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      CHECK (visibility IN ('public','private','unlisted')), CHECK (join_mode IN ('open','request'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_members (
      group_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member', status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (group_id, user_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_join_requests (
      id TEXT PRIMARY KEY, group_id TEXT NOT NULL, user_id TEXT NOT NULL, message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE (group_id, user_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_invites (
      id TEXT PRIMARY KEY, group_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, created_by TEXT NOT NULL,
      expires_at TEXT NOT NULL, max_uses INTEGER NOT NULL DEFAULT 1, use_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY, group_id TEXT NOT NULL, user_id TEXT NOT NULL, body TEXT NOT NULL,
      link_url TEXT NOT NULL DEFAULT '', link_type TEXT NOT NULL DEFAULT '', pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_lists (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'private', share_slug TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      CHECK (visibility IN ('public','followers','private','unlisted'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_list_items (
      list_id TEXT NOT NULL, kind TEXT NOT NULL, entity_id TEXT NOT NULL, title TEXT NOT NULL DEFAULT '',
      artist_name TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, PRIMARY KEY (list_id, kind, entity_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS saved_items (
      user_id TEXT NOT NULL, item_key TEXT NOT NULL, item_type TEXT NOT NULL, title TEXT NOT NULL DEFAULT '',
      artist_name TEXT NOT NULL DEFAULT '', cover_url TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'saved', created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, item_key, kind)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS content_reviews (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      score REAL NOT NULL, body TEXT NOT NULL DEFAULT '', spoiler INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
      UNIQUE (user_id, entity_type, entity_id), CHECK (score >= 0 AND score <= 10)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS account_xp (
      user_id TEXT PRIMARY KEY, account_xp INTEGER NOT NULL DEFAULT 0, leaderboard_opt_in INTEGER NOT NULL DEFAULT 0,
      artist_xp_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS artist_xp (
      user_id TEXT NOT NULL, artist_id TEXT NOT NULL, season_key TEXT NOT NULL DEFAULT 'all-time',
      xp INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, artist_id, season_key)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS artist_xp_events (
      listen_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, artist_id TEXT NOT NULL, created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS moderation_reports (
      id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL,
      reason TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS moderation_blocks (
      blocker_id TEXT NOT NULL, blocked_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (blocker_id, blocked_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_mutes (
      group_id TEXT NOT NULL, moderator_id TEXT NOT NULL, user_id TEXT NOT NULL,
      expires_at TEXT, reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
      PRIMARY KEY (group_id, user_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_moderation_log (
      id TEXT PRIMARY KEY, group_id TEXT NOT NULL, moderator_id TEXT NOT NULL,
      action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS moderation_appeals (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, target_type TEXT NOT NULL,
      target_id TEXT NOT NULL, details TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS support_interest (
      user_id TEXT PRIMARY KEY, tier TEXT NOT NULL DEFAULT 'donation', wall_visible INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS community_groups_updated ON community_groups (updated_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS community_posts_group_created ON community_posts (group_id, created_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS community_invites_group_expires ON community_invites (group_id, expires_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS user_lists_user_updated ON user_lists (user_id, updated_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS content_reviews_entity ON content_reviews (entity_type, entity_id, created_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS moderation_reports_status ON moderation_reports (status, created_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS artist_xp_artist ON artist_xp (artist_id, season_key, xp DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS artist_xp_events_user_date ON artist_xp_events (user_id, created_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS community_modlog_group_date ON community_moderation_log (group_id, created_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS moderation_appeals_status ON moderation_appeals (status, created_at DESC)')
  ]);
  ready.add(db);
}

function inviteToken() {
  // UUIDs are available in Workers and avoid depending on Node's Buffer API.
  return `${crypto.randomUUID()}${crypto.randomUUID().replaceAll('-', '')}`;
}

async function inviteHash(token) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function validInvite(db, groupId, token, now = new Date().toISOString()) {
  const value = text(token, 180);
  if (!value) return null;
  const hash = await inviteHash(value);
  return db.prepare('SELECT id, group_id, expires_at, max_uses, use_count FROM community_invites WHERE group_id = ? AND token_hash = ? AND expires_at > ? AND use_count < max_uses').bind(groupId, hash, now).first();
}

async function groupFor(db, groupId) {
  const group = await db.prepare('SELECT * FROM community_groups WHERE id = ?').bind(groupId).first();
  if (!group) throw fail(404, 'Gruppe nicht gefunden.');
  return group;
}

async function accountName(db, userId) {
  const row = await db.prepare('SELECT username, profile_json, privacy_json FROM accounts WHERE id = ?').bind(userId).first();
  if (!row) return {username: 'Mitglied', avatar: '', privacy: {}};
  const profile = json(row.profile_json);
  return {username: row.username, avatar: profile.avatarUrl || profile.avatarData || '', privacy: json(row.privacy_json)};
}

function publicGroup(row, memberCount = 0) {
  return {id: row.id, name: row.name, slug: row.slug, description: row.description, visibility: row.visibility, joinMode: row.join_mode, artistId: row.artist_id || '', memberCount: Number(memberCount || 0), createdAt: row.created_at, updatedAt: row.updated_at};
}

async function canReadGroup(db, group, userId, inviteValid = false) {
  if (group.visibility !== 'private') return true;
  if (inviteValid) return true;
  if (!userId) return false;
  const member = await db.prepare("SELECT status FROM community_members WHERE group_id = ? AND user_id = ? AND status = 'active'").bind(group.id, userId).first();
  return Boolean(member);
}

async function recentCount(db, table, column, userId, cutoff) {
  // Table and column names come only from the internal calls below.
  const result = await db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column} = ? AND created_at >= ?`).bind(userId, cutoff).first();
  return Number(result?.count || 0);
}

async function groupModerator(db, groupId, userId) {
  return Boolean(await db.prepare("SELECT 1 FROM community_members WHERE group_id = ? AND user_id = ? AND status = 'active' AND role IN ('owner','moderator')").bind(groupId, userId).first());
}

export async function communityDirectory(request, env) {
  await ensureV3Schema(env.DB);
  const url = new URL(request.url);
  const query = text(url.searchParams.get('q'), 80).toLowerCase();
  const groupId = text(url.searchParams.get('group'), 120);
  const inviteTokenValue = text(url.searchParams.get('invite'), 180);
  const session = await readSession(request, env);
  const userId = session.account?.userId || '';
  if (groupId) {
    const group = await groupFor(env.DB, groupId);
    const invite = group.visibility === 'private' ? await validInvite(env.DB, group.id, inviteTokenValue) : null;
    if (!await canReadGroup(env.DB, group, userId, Boolean(invite))) throw fail(404, 'Diese Gruppe ist privat.');
    const member = userId ? await env.DB.prepare('SELECT role, status FROM community_members WHERE group_id = ? AND user_id = ?').bind(group.id, userId).first() : null;
    // Public groups expose their directory card to everyone, but internal
    // posts remain visible only after an accepted membership. Blocked authors
    // are filtered at the database boundary as well.
    const canViewPosts = member?.status === 'active';
    const posts = canViewPosts ? await env.DB.prepare(`SELECT p.*, a.username FROM community_posts p LEFT JOIN accounts a ON a.id = p.user_id WHERE p.group_id = ? AND p.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM moderation_blocks b WHERE (b.blocker_id = ? AND b.blocked_id = p.user_id) OR (b.blocker_id = p.user_id AND b.blocked_id = ?)) AND NOT EXISTS (SELECT 1 FROM community_mutes m WHERE m.group_id = p.group_id AND m.user_id = p.user_id AND (m.expires_at IS NULL OR m.expires_at > ?)) ORDER BY p.pinned DESC, p.created_at DESC LIMIT 50`).bind(group.id, userId, userId, new Date().toISOString()).all() : {results: []};
    const requests = userId && await groupModerator(env.DB, group.id, userId) ? await env.DB.prepare(`SELECT r.id, r.user_id, r.message, r.status, r.created_at, a.username FROM community_join_requests r JOIN accounts a ON a.id = r.user_id WHERE r.group_id = ? AND r.status = 'pending' ORDER BY r.created_at ASC LIMIT 100`).bind(group.id).all() : {results: []};
    const modlog = userId && await groupModerator(env.DB, group.id, userId) ? await env.DB.prepare('SELECT action, target_type, target_id, reason, created_at FROM community_moderation_log WHERE group_id = ? ORDER BY created_at DESC LIMIT 100').bind(group.id).all() : {results: []};
    const members = canViewPosts ? await env.DB.prepare(`SELECT m.user_id, m.role,
      CASE WHEN m.status = 'active' AND EXISTS (SELECT 1 FROM community_mutes mute WHERE mute.group_id = m.group_id AND mute.user_id = m.user_id AND (mute.expires_at IS NULL OR mute.expires_at > ?)) THEN 'muted' ELSE m.status END AS status,
      a.username, a.profile_json, a.privacy_json
      FROM community_members m JOIN accounts a ON a.id = m.user_id
      WHERE m.group_id = ? AND m.status IN ('active', 'muted', 'removed', 'banned')
      ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END, a.username ASC LIMIT 500`).bind(new Date().toISOString(), group.id).all() : {results: []};
    const count = await env.DB.prepare("SELECT COUNT(*) AS member_count FROM community_members WHERE group_id = ? AND status = 'active'").bind(group.id).first();
    return {group: publicGroup(group, count?.member_count), membership: member ? {role: member.role, status: member.status} : null, inviteValid: Boolean(invite), canViewPosts, posts: (posts.results || []).map(post => ({id: post.id, userId: post.user_id, body: post.body, linkUrl: post.link_url, linkType: post.link_type, pinned: Boolean(post.pinned), createdAt: post.created_at, author: post.username || 'Mitglied'})), members: (members.results || []).map(item => { const privacy = json(item.privacy_json); const profile = json(item.profile_json); const canShowAvatar = item.user_id === userId || privacy.profile === 'public'; return {userId: item.user_id, username: item.username, role: item.role, status: item.status, avatarUrl: canShowAvatar ? safeUrl(profile.avatarUrl) : '', profilePrivate: privacy.profile !== 'public'}; }), joinRequests: (requests.results || []).map(requestRow => ({id: requestRow.id, userId: requestRow.user_id, username: requestRow.username, message: requestRow.message, createdAt: requestRow.created_at})), moderationLog: modlog.results || []};
  }
  const mine = url.searchParams.get('mine') === '1';
  if (mine) {
    if (!userId) return {groups: [], me: null};
    const rows = await env.DB.prepare(`SELECT g.*, COUNT(members.user_id) AS member_count
      FROM community_groups g
      JOIN community_members mine_member ON mine_member.group_id = g.id AND mine_member.user_id = ? AND mine_member.status = 'active'
      LEFT JOIN community_members members ON members.group_id = g.id AND members.status = 'active'
      GROUP BY g.id ORDER BY g.updated_at DESC LIMIT 100`).bind(userId).all();
    return {groups: (rows.results || []).map(group => publicGroup(group, group.member_count)), me: userId};
  }
  const rows = await env.DB.prepare(`SELECT g.*, COUNT(m.user_id) AS member_count FROM community_groups g LEFT JOIN community_members m ON m.group_id = g.id AND m.status = 'active' WHERE g.visibility = 'public' GROUP BY g.id ORDER BY g.updated_at DESC LIMIT 100`).all();
  const groups = (rows.results || []).filter(group => !query || `${group.name} ${group.description}`.toLowerCase().includes(query)).map(group => publicGroup(group, group.member_count));
  return {groups, me: userId || null};
}

export async function communityWrite(request, env) {
  await ensureV3Schema(env.DB);
  const {row} = await requireAccount(request, env);
  const input = await body(request);
  const action = text(input.action, 32) || 'create';
  const now = new Date().toISOString();
  if (action === 'create') {
    if (!await isEmailVerified(env.DB, row.id)) throw fail(403, 'Bestätige zuerst deine E-Mail-Adresse, bevor du eine Gruppe gründest.');
    const accountAge = Date.parse(row.created_at || '');
    if (!Number.isFinite(accountAge) || accountAge > Date.now() - 7 * 24 * 60 * 60 * 1000) throw fail(403, 'Dein Konto muss für eine Gruppengründung mindestens sieben Tage alt sein.');
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (await recentCount(env.DB, 'community_groups', 'owner_id', row.id, cutoff) >= 3) throw fail(429, 'Du kannst höchstens drei Gruppen pro Tag gründen.');
    const name = text(input.name, 80); if (name.length < 3) throw fail(400, 'Der Gruppenname muss mindestens 3 Zeichen lang sein.');
    const description = text(input.description, 500); const visibility = GROUP_VISIBILITY.has(input.visibility) ? input.visibility : 'public'; const joinMode = GROUP_JOIN.has(input.joinMode) ? input.joinMode : 'request';
    const group = {id: id('grp'), slug: `${slug(name)}-${Math.random().toString(36).slice(2, 7)}`, name, description, visibility, joinMode, artistId: text(input.artistId, 120) || null};
    await env.DB.prepare('INSERT INTO community_groups (id, owner_id, name, slug, description, visibility, join_mode, artist_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(group.id, row.id, group.name, group.slug, group.description, group.visibility, group.joinMode, group.artistId, now, now).run();
    await env.DB.prepare('INSERT INTO community_members (group_id, user_id, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(group.id, row.id, 'owner', 'active', now, now).run();
    return {group: {...group, memberCount: 1, createdAt: now, updatedAt: now}};
  }
  const group = await groupFor(env.DB, text(input.groupId, 120));
  if (action === 'invite') {
    if (!await groupModerator(env.DB, group.id, row.id)) throw fail(403, 'Nur Owner und Moderatoren können Einladungen erstellen.');
    const token = inviteToken();
    const days = Math.max(1, Math.min(30, Number(input.expiresInDays) || 7));
    const maxUses = Math.max(1, Math.min(100, Number(input.maxUses) || 1));
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare('INSERT INTO community_invites (id, group_id, token_hash, created_by, expires_at, max_uses, use_count, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)').bind(id('invite'), group.id, await inviteHash(token), row.id, expiresAt, maxUses, now).run();
    const inviteUrl = new URL(request.url);
    inviteUrl.pathname = '/';
    inviteUrl.search = '';
    inviteUrl.hash = `community/${encodeURIComponent(group.id)}?invite=${encodeURIComponent(token)}`;
    return {invite: {token, expiresAt, maxUses, url: inviteUrl.href}};
  }
  if (action === 'accept-invite') {
    const token = text(input.inviteToken, 180);
    const invite = await validInvite(env.DB, group.id, token, now);
    if (!invite) throw fail(410, 'Diese Einladung ist abgelaufen oder wurde bereits verwendet.');
    const existing = await env.DB.prepare('SELECT status FROM community_members WHERE group_id = ? AND user_id = ?').bind(group.id, row.id).first();
    if (existing?.status === 'banned') throw fail(403, 'Du bist aus dieser Gruppe gesperrt.');
    if (existing?.status === 'active') return {status: 'active'};
    const updated = await env.DB.prepare('UPDATE community_invites SET use_count = use_count + 1 WHERE id = ? AND expires_at > ? AND use_count < max_uses').bind(invite.id, now).run();
    if (!Number(updated?.meta?.changes || updated?.changes || 0)) throw fail(410, 'Diese Einladung ist abgelaufen oder wurde bereits verwendet.');
    await env.DB.prepare("INSERT INTO community_members (group_id, user_id, role, status, created_at, updated_at) VALUES (?, ?, 'member', 'active', ?, ?) ON CONFLICT(group_id,user_id) DO UPDATE SET status='active', updated_at=excluded.updated_at").bind(group.id, row.id, now, now).run();
    return {status: 'active'};
  }
  if (action === 'join') {
    if (group.visibility === 'private') throw fail(403, 'Diese private Gruppe kann nur über eine Einladung beigetreten werden.');
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (await recentCount(env.DB, 'community_join_requests', 'user_id', row.id, cutoff) >= 10) throw fail(429, 'Du kannst höchstens zehn Beitrittsanfragen pro Tag senden.');
    const existing = await env.DB.prepare('SELECT status FROM community_members WHERE group_id = ? AND user_id = ?').bind(group.id, row.id).first();
    if (existing?.status === 'banned') throw fail(403, 'Du bist aus dieser Gruppe gesperrt.');
    if (existing?.status === 'active') return {status: 'active'};
    if (group.join_mode === 'open') { await env.DB.prepare("INSERT INTO community_members (group_id, user_id, role, status, created_at, updated_at) VALUES (?, ?, 'member', 'active', ?, ?) ON CONFLICT(group_id,user_id) DO UPDATE SET status='active', updated_at=excluded.updated_at").bind(group.id, row.id, now, now).run(); return {status: 'active'}; }
    await env.DB.prepare('INSERT INTO community_join_requests (id, group_id, user_id, message, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(group_id,user_id) DO UPDATE SET message=excluded.message, status=\'pending\', updated_at=excluded.updated_at').bind(id('join'), group.id, row.id, text(input.message, 300), 'pending', now, now).run();
    return {status: 'pending'};
  }
  if (action === 'post') {
    const membership = await env.DB.prepare("SELECT role FROM community_members WHERE group_id = ? AND user_id = ? AND status = 'active'").bind(group.id, row.id).first();
    if (!membership) throw fail(403, 'Du musst der Gruppe beitreten, um zu posten.');
    const muted = await env.DB.prepare('SELECT 1 FROM community_mutes WHERE group_id = ? AND user_id = ? AND (expires_at IS NULL OR expires_at > ?)').bind(group.id, row.id, now).first();
    if (muted) throw fail(403, 'Du bist in dieser Gruppe vorübergehend stummgeschaltet.');
    if (!await isEmailVerified(env.DB, row.id)) throw fail(403, 'Bestätige zuerst deine E-Mail-Adresse, bevor du in Gruppen postest.');
    const memberCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM community_members WHERE group_id = ? AND status = 'active'").bind(group.id).first();
    if (Number(memberCount?.count || 0) >= 500) {
      const moderatorCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM community_members WHERE group_id = ? AND status = 'active' AND role IN ('owner','moderator')").bind(group.id).first();
      if (Number(moderatorCount?.count || 0) < 2) throw fail(403, 'Diese große Gruppe braucht mindestens zwei aktive Moderatoren, bevor neue Beiträge möglich sind.');
    }
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (await recentCount(env.DB, 'community_posts', 'user_id', row.id, cutoff) >= 30) throw fail(429, 'Du kannst höchstens 30 Beiträge pro Tag veröffentlichen.');
    const postBody = text(input.body, 5000); if (!postBody) throw fail(400, 'Ein Beitrag braucht Text.');
    const linkUrl = safeUrl(input.linkUrl);
    if (linkUrl) {
      const links = await env.DB.prepare('SELECT COUNT(*) AS count FROM community_posts WHERE user_id = ? AND created_at >= ? AND link_url <> \'\' AND deleted_at IS NULL').bind(row.id, cutoff).first();
      if (Number(links?.count || 0) >= 15) throw fail(429, 'Du kannst höchstens 15 externe Links pro Tag teilen.');
    }
    const post = {id: id('post'), body: postBody, linkUrl, linkType: text(input.linkType, 40)};
    await env.DB.prepare('INSERT INTO community_posts (id, group_id, user_id, body, link_url, link_type, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)').bind(post.id, group.id, row.id, post.body, post.linkUrl, post.linkType, now, now).run();
    return {post: {...post, pinned: false, createdAt: now, author: row.username}};
  }
  if (action === 'moderate-request') {
    const moderator = await env.DB.prepare("SELECT role FROM community_members WHERE group_id = ? AND user_id = ? AND status = 'active' AND role IN ('owner','moderator')").bind(group.id, row.id).first();
    if (!moderator) throw fail(403, 'Nur Owner und Moderatoren können Beitritte verwalten.');
    const requestId = text(input.requestId, 120); const decision = input.decision === 'approve' ? 'approve' : input.decision === 'reject' ? 'reject' : '';
    if (!requestId || !decision) throw fail(400, 'Ungültige Moderationsentscheidung.');
    const joinRequest = await env.DB.prepare('SELECT user_id FROM community_join_requests WHERE id = ? AND group_id = ?').bind(requestId, group.id).first(); if (!joinRequest) throw fail(404, 'Beitrittsanfrage nicht gefunden.');
    const existingMember = await env.DB.prepare('SELECT status FROM community_members WHERE group_id = ? AND user_id = ?').bind(group.id, joinRequest.user_id).first();
    if (decision === 'approve' && existingMember?.status === 'banned') throw fail(403, 'Dieses Mitglied ist aus der Gruppe gesperrt.');
    await env.DB.prepare('UPDATE community_join_requests SET status = ?, updated_at = ? WHERE id = ?').bind(decision === 'approve' ? 'approved' : 'rejected', now, requestId).run();
    if (decision === 'approve') await env.DB.prepare("INSERT INTO community_members (group_id, user_id, role, status, created_at, updated_at) VALUES (?, ?, 'member', 'active', ?, ?) ON CONFLICT(group_id,user_id) DO UPDATE SET status='active', updated_at=excluded.updated_at").bind(group.id, joinRequest.user_id, now, now).run();
    return {status: decision === 'approve' ? 'active' : 'rejected'};
  }
  if (action === 'pin') {
    const moderator = await env.DB.prepare("SELECT role FROM community_members WHERE group_id = ? AND user_id = ? AND status = 'active' AND role IN ('owner','moderator')").bind(group.id, row.id).first();
    if (!moderator) throw fail(403, 'Nur Owner und Moderatoren können Beiträge anpinnen.');
    const postId = text(input.postId, 120); await env.DB.prepare('UPDATE community_posts SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ? AND group_id = ? AND deleted_at IS NULL').bind(now, postId, group.id).run(); return {updated: true};
  }
  if (action === 'moderate-post') {
    if (!await groupModerator(env.DB, group.id, row.id)) throw fail(403, 'Nur Owner und Moderatoren können Beiträge moderieren.');
    const postId = text(input.postId, 120); const decision = input.decision === 'restore' ? 'restore' : input.decision === 'remove' ? 'remove' : '';
    if (!postId || !decision) throw fail(400, 'Ungültige Beitragsentscheidung.');
    const updated = await env.DB.prepare('UPDATE community_posts SET deleted_at = ?, updated_at = ? WHERE id = ? AND group_id = ?').bind(decision === 'remove' ? now : null, now, postId, group.id).run();
    if (!Number(updated?.meta?.changes || updated?.changes || 0)) throw fail(404, 'Beitrag nicht gefunden.');
    await env.DB.prepare('INSERT INTO community_moderation_log (id, group_id, moderator_id, action, target_type, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id('mod'), group.id, row.id, decision, 'community_post', postId, text(input.reason, 500), now).run();
    return {updated: true, decision};
  }
  if (action === 'moderate-member') {
    const moderator = await env.DB.prepare("SELECT role FROM community_members WHERE group_id = ? AND user_id = ? AND status = 'active' AND role IN ('owner','moderator')").bind(group.id, row.id).first();
    if (!moderator) throw fail(403, 'Nur Owner und Moderatoren können Mitglieder moderieren.');
    const target = text(input.userId, 120); const decision = ['mute', 'remove', 'ban', 'unban'].includes(input.decision) ? input.decision : '';
    if (!target || target === row.id || !decision) throw fail(400, 'Ungültige Mitgliederentscheidung.');
    const targetMember = await env.DB.prepare('SELECT role, status FROM community_members WHERE group_id = ? AND user_id = ?').bind(group.id, target).first();
    if (!targetMember) throw fail(404, 'Mitglied nicht gefunden.');
    if (targetMember.role === 'owner') throw fail(403, 'Der Owner kann nicht moderiert werden.');
    if (targetMember.role === 'moderator' && moderator.role !== 'owner') throw fail(403, 'Moderatoren können nur vom Owner verwaltet werden.');
    if (decision === 'mute') {
      const hours = Math.max(1, Math.min(168, Number(input.hours) || 24)); const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      await env.DB.prepare('INSERT INTO community_mutes (group_id, moderator_id, user_id, expires_at, reason, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(group_id,user_id) DO UPDATE SET moderator_id=excluded.moderator_id, expires_at=excluded.expires_at, reason=excluded.reason').bind(group.id, row.id, target, expires, text(input.reason, 500), now).run();
    } else {
      await env.DB.prepare('DELETE FROM community_mutes WHERE group_id = ? AND user_id = ?').bind(group.id, target).run();
      const status = decision === 'ban' ? 'banned' : decision === 'remove' ? 'removed' : 'active';
      await env.DB.prepare('UPDATE community_members SET status = ?, updated_at = ? WHERE group_id = ? AND user_id = ?').bind(status, now, group.id, target).run();
    }
    await env.DB.prepare('INSERT INTO community_moderation_log (id, group_id, moderator_id, action, target_type, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id('mod'), group.id, row.id, decision, 'community_member', target, text(input.reason, 500), now).run();
    return {updated: true, decision};
  }
  throw fail(400, 'Unbekannte Community-Aktion.');
}

export async function listCollections(request, env) {
  await ensureV3Schema(env.DB);
  const url = new URL(request.url);
  const share = text(url.searchParams.get('share'), 120);
  if (share) {
    const list = await env.DB.prepare('SELECT id, title, description, visibility, share_slug, updated_at FROM user_lists WHERE share_slug = ?').bind(share).first();
    if (!list || !['public', 'unlisted'].includes(list.visibility)) throw fail(404, 'Diese Liste ist nicht öffentlich verfügbar.');
    const rows = await env.DB.prepare('SELECT kind, entity_id, title, artist_name, note, position FROM user_list_items WHERE list_id = ? ORDER BY position ASC, created_at ASC').bind(list.id).all();
    return {list: {id: list.id, title: list.title, description: list.description, visibility: list.visibility, shareSlug: list.share_slug, updatedAt: list.updated_at, items: (rows.results || []).map(item => ({kind: item.kind, entityId: item.entity_id, title: item.title, artistName: item.artist_name, note: item.note}))}};
  }
  const itemKey = text(url.searchParams.get('item_key'), 180);
  const itemType = text(url.searchParams.get('item_type'), 40);
  if (itemKey && ['artist', 'release', 'song'].includes(itemType)) {
    // Counts are intentionally anonymised. Only accounts that explicitly
    // expose their favourites contribute to the public favourite count;
    // private and follower-only favourites never leak through this endpoint.
    const favoriteRows = await env.DB.prepare(`SELECT a.privacy_json
      FROM saved_items s JOIN accounts a ON a.id = s.user_id
      WHERE s.item_key = ? AND s.item_type = ? AND s.kind = 'favorite'`).bind(itemKey, itemType).all();
    const favoriteCount = (favoriteRows.results || []).filter(item => json(item.privacy_json).favorites === 'public').length;
    const listCount = await env.DB.prepare(`SELECT COUNT(DISTINCT l.id) AS count
      FROM user_lists l JOIN user_list_items i ON i.list_id = l.id
      WHERE l.visibility = 'public' AND i.entity_id = ? AND i.kind = ?`).bind(itemKey, itemType).first();
    const totalPublicLists = Number(listCount?.count || 0);
    const allLists = url.searchParams.get('all') === '1';
    const requestedLimit = Number(url.searchParams.get('limit'));
    const requestedOffset = Number(url.searchParams.get('offset'));
    const listLimit = allLists ? Math.min(100, Math.max(1, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 100)) : 3;
    const listOffset = allLists ? Math.max(0, Number.isFinite(requestedOffset) ? Math.floor(requestedOffset) : 0) : 0;
    const publicLists = await env.DB.prepare(`SELECT l.id, l.title, l.description, l.visibility, l.share_slug, l.updated_at,
      COUNT(all_items.entity_id) AS item_count
      FROM user_lists l
      JOIN user_list_items matching_item ON matching_item.list_id = l.id
      LEFT JOIN user_list_items all_items ON all_items.list_id = l.id
      WHERE l.visibility = 'public' AND matching_item.entity_id = ? AND matching_item.kind = ?
      GROUP BY l.id ORDER BY l.updated_at DESC LIMIT ${listLimit} OFFSET ${listOffset}`).bind(itemKey, itemType).all();
    const listItems = (publicLists.results || []).map(list => ({
      id: list.id, title: list.title, description: list.description, visibility: list.visibility,
      shareSlug: list.share_slug, itemCount: Number(list.item_count || 0), updatedAt: list.updated_at
    }));
    const {account: viewer} = await readSession(request, env);
    let viewerSaved = false; let viewerFavorite = false;
    if (viewer?.userId) {
      const saved = await env.DB.prepare('SELECT kind FROM saved_items WHERE user_id = ? AND item_key = ? AND item_type = ?').bind(viewer.userId, itemKey, itemType).all();
      for (const row of saved.results || []) { if (row.kind === 'saved') viewerSaved = true; if (row.kind === 'favorite') viewerFavorite = true; }
    }
    return {itemKey, itemType, favoriteCount, listCount: totalPublicLists, lists: listItems,
      listMoreCount: Math.max(0, totalPublicLists - listOffset - listItems.length),
      nextOffset: listOffset + listItems.length < totalPublicLists ? listOffset + listItems.length : null,
      viewer: {saved: viewerSaved, favorite: viewerFavorite}};
  }
  const {row} = await requireAccount(request, env);
  const lists = await env.DB.prepare('SELECT l.*, COUNT(i.entity_id) AS item_count FROM user_lists l LEFT JOIN user_list_items i ON i.list_id = l.id WHERE l.user_id = ? GROUP BY l.id ORDER BY l.updated_at DESC').bind(row.id).all();
  const saved = await env.DB.prepare("SELECT item_key, item_type, title, artist_name, cover_url, kind, created_at FROM saved_items WHERE user_id = ? ORDER BY created_at DESC LIMIT 200").bind(row.id).all();
  const ownItems = await env.DB.prepare('SELECT list_id, kind, entity_id, title, artist_name, note, position FROM user_list_items WHERE list_id IN (SELECT id FROM user_lists WHERE user_id = ?) ORDER BY list_id, position ASC, created_at ASC').bind(row.id).all();
  const grouped = (ownItems.results || []).reduce((map, item) => { (map[item.list_id] ||= []).push({kind: item.kind, entityId: item.entity_id, title: item.title, artistName: item.artist_name, note: item.note}); return map; }, {});
  return {lists: (lists.results || []).map(item => ({id: item.id, title: item.title, description: item.description, visibility: item.visibility, shareSlug: item.share_slug, itemCount: Number(item.item_count || 0), items: grouped[item.id] || [], updatedAt: item.updated_at})), saved: saved.results || []};
}

export async function writeCollections(request, env) {
  await ensureV3Schema(env.DB);
  const {row} = await requireAccount(request, env);
  const input = await body(request); const action = text(input.action, 40); const now = new Date().toISOString();
  if (action === 'create-list') {
    const title = text(input.title, 120); if (title.length < 1) throw fail(400, 'Bitte gib der Liste einen Namen.');
    const list = {id: id('list'), title, description: text(input.description, 500), visibility: VISIBILITY.has(input.visibility) ? input.visibility : 'private', shareSlug: `${slug(title)}-${Math.random().toString(36).slice(2, 8)}`};
    await env.DB.prepare('INSERT INTO user_lists (id, user_id, title, description, visibility, share_slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(list.id, row.id, list.title, list.description, list.visibility, list.shareSlug, now, now).run();
    return {list: {...list, itemCount: 0, updatedAt: now}};
  }
  if (action === 'add-item') {
    const list = await env.DB.prepare('SELECT id FROM user_lists WHERE id = ? AND user_id = ?').bind(text(input.listId, 120), row.id).first(); if (!list) throw fail(404, 'Liste nicht gefunden.');
    const kind = text(input.kind, 30) || 'song'; const entityId = text(input.entityId, 180); if (!entityId) throw fail(400, 'Eintrag fehlt.');
    await env.DB.prepare('INSERT INTO user_list_items (list_id, kind, entity_id, title, artist_name, note, position, created_at) VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT MAX(position)+1 FROM user_list_items WHERE list_id = ?), 0), ?) ON CONFLICT(list_id,kind,entity_id) DO UPDATE SET note=excluded.note').bind(list.id, kind, entityId, text(input.title, 200), text(input.artistName, 160), text(input.note, 500), list.id, now).run();
    await env.DB.prepare('UPDATE user_lists SET updated_at = ? WHERE id = ?').bind(now, list.id).run(); return {saved: true};
  }
  if (action === 'save' || action === 'favorite') {
    const kind = action === 'favorite' ? 'favorite' : 'saved'; const key = text(input.itemKey, 180); if (!key) throw fail(400, 'Eintrag fehlt.');
    await env.DB.prepare('INSERT INTO saved_items (user_id, item_key, item_type, title, artist_name, cover_url, kind, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id,item_key,kind) DO NOTHING').bind(row.id, key, text(input.itemType, 40) || 'release', text(input.title, 200), text(input.artistName, 160), safeUrl(input.coverUrl), kind, now).run(); return {saved: true, kind};
  }
  if (action === 'unsave' || action === 'unfavorite') { const kind = action === 'unfavorite' ? 'favorite' : 'saved'; await env.DB.prepare('DELETE FROM saved_items WHERE user_id = ? AND item_key = ? AND kind = ?').bind(row.id, text(input.itemKey, 180), kind).run(); return {saved: false, kind}; }
  throw fail(400, 'Unbekannte Listen-Aktion.');
}

export async function reviews(request, env) {
  await ensureV3Schema(env.DB);
  const url = new URL(request.url); const type = text(url.searchParams.get('entity_type'), 30); const entity = text(url.searchParams.get('entity_id'), 180);
  if (request.method === 'GET') {
    if (url.searchParams.get('mine') === '1') {
      const {row} = await requireAccount(request, env);
      const rows = await env.DB.prepare(`SELECT id, score, body, spoiler, entity_type, entity_id, created_at, updated_at FROM content_reviews WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 100`).bind(row.id).all();
      return {count: rows.results?.length || 0, items: (rows.results || []).map(item => ({id: item.id, score: Number(item.score), body: item.body, spoiler: Boolean(item.spoiler), entityType: item.entity_type, entityId: item.entity_id, edited: item.updated_at !== item.created_at, createdAt: item.created_at}))};
    }
    if (!type || !entity) throw fail(400, 'Bewertungsobjekt fehlt.');
    const qualificationCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const {account: viewer} = await readSession(request, env);
    const viewerId = viewer?.userId || '';
    const rows = await env.DB.prepare(`SELECT r.id, r.score, r.body, r.spoiler, r.created_at, r.updated_at, a.username, a.created_at AS account_created_at,
      CASE WHEN a.created_at <= ? AND EXISTS (SELECT 1 FROM account_email_verifications v WHERE v.user_id = r.user_id AND v.verified_at IS NOT NULL) THEN 1 ELSE 0 END AS qualified
      FROM content_reviews r JOIN accounts a ON a.id = r.user_id WHERE r.entity_type = ? AND r.entity_id = ? AND r.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM moderation_blocks b WHERE (b.blocker_id = ? AND b.blocked_id = r.user_id) OR (b.blocker_id = r.user_id AND b.blocked_id = ?))
      ORDER BY r.created_at DESC LIMIT 50`).bind(qualificationCutoff, type, entity, viewerId, viewerId).all();
    const allValues = (rows.results || []).map(item => Number(item.score));
    const values = (rows.results || []).filter(item => Number(item.qualified) === 1).map(item => Number(item.score));
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : null;
    return {count: allValues.length, qualifiedCount: values.length, average: values.length >= 5 ? avg : null, pending: allValues.length > 0 && values.length < 5, histogram: values.reduce((map, score) => { const bucket = Math.floor(score); map[bucket] = (map[bucket] || 0) + 1; return map; }, {}), items: (rows.results || []).map(item => ({id: item.id, score: Number(item.score), body: item.body, spoiler: Boolean(item.spoiler), edited: item.updated_at !== item.created_at, createdAt: item.created_at, username: item.username}))};
  }
  const {row} = await requireAccount(request, env); const input = await body(request); const score = Number(input.score); if (!Number.isFinite(score) || score < 0 || score > 10 || Math.round(score * 10) !== score * 10) throw fail(400, 'Bewertungen sind von 0,0 bis 10,0 in 0,1-Schritten möglich.');
  const entityType = text(input.entityType, 30), entityId = text(input.entityId, 180); if (!entityType || !entityId) throw fail(400, 'Bewertungsobjekt fehlt.');
  if (!['release', 'song'].includes(entityType)) throw fail(400, 'Reviews sind nur auf Release- und Songseiten möglich.');
  const knownSeed = SEED_TRACKS.some(item => item.id === entityId);
  const knownCatalog = entityType === 'song'
    ? await env.DB.prepare('SELECT 1 FROM catalog_tracks WHERE id = ? OR source_id = ?').bind(entityId, entityId).first()
    : await env.DB.prepare('SELECT 1 FROM catalog_albums WHERE id = ? OR source_id = ?').bind(entityId, entityId).first();
  if (!knownSeed && !knownCatalog) throw fail(404, 'Dieses Bewertungsobjekt ist noch nicht im Katalog.');
  const reviewBody = text(input.body, 5000); const now = new Date().toISOString();
  const existing = await env.DB.prepare('SELECT id FROM content_reviews WHERE user_id = ? AND entity_type = ? AND entity_id = ? AND deleted_at IS NULL').bind(row.id, entityType, entityId).first();
  if (!existing) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recent = await env.DB.prepare('SELECT COUNT(*) AS count FROM content_reviews WHERE user_id = ? AND created_at >= ? AND deleted_at IS NULL').bind(row.id, cutoff).first();
    if (Number(recent?.count || 0) >= 10) throw fail(429, 'Du kannst höchstens zehn neue Reviews pro Tag veröffentlichen.');
  }
  await env.DB.prepare('INSERT INTO content_reviews (id, user_id, entity_type, entity_id, score, body, spoiler, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id,entity_type,entity_id) DO UPDATE SET score=excluded.score, body=excluded.body, spoiler=excluded.spoiler, updated_at=excluded.updated_at, deleted_at=NULL').bind(id('review'), row.id, entityType, entityId, score, reviewBody, input.spoiler ? 1 : 0, now, now).run();
  // Editing an existing review changes the content but must not mint XP again.
  if (!existing) {
    await addXp(env.DB, row.id, reviewBody.length >= 200 ? 20 : 5, now);
    const artistId = text(input.artistId, 120);
    if (artistId && ARTISTS.some(artist => artist.id === artistId || artist.mbid === artistId || `artist:${artist.id}` === artistId || `artist:${artist.mbid}` === artistId)) await addArtistXp(env.DB, row.id, artistId, reviewBody.length >= 200 ? 15 : 5, now);
  }
  return {saved: true, edited: Boolean(existing), score, body: reviewBody};
}

async function addXp(db, userId, amount, now = new Date().toISOString()) {
  await db.prepare("INSERT INTO account_xp (user_id, account_xp, leaderboard_opt_in, artist_xp_json, updated_at) VALUES (?, ?, 0, '{}', ?) ON CONFLICT(user_id) DO UPDATE SET account_xp=account_xp+excluded.account_xp, updated_at=excluded.updated_at").bind(userId, Math.max(0, Math.min(Number(amount) || 0, 40)), now).run();
}

async function addArtistXp(db, userId, artistId, amount, now = new Date().toISOString()) {
  const key = canonicalArtistKey(artistId); if (!key) return;
  const current = await db.prepare('SELECT artist_xp_json FROM account_xp WHERE user_id = ?').bind(userId).first();
  const values = json(current?.artist_xp_json, {});
  values[key] = Math.max(0, Number(values[key] || 0)) + Math.max(0, Math.min(Number(amount) || 0, 30));
  await db.prepare("INSERT INTO account_xp (user_id, account_xp, leaderboard_opt_in, artist_xp_json, updated_at) VALUES (?, 0, 0, ?, ?) ON CONFLICT(user_id) DO UPDATE SET artist_xp_json=excluded.artist_xp_json, updated_at=excluded.updated_at").bind(userId, JSON.stringify(values), now).run();
  await db.prepare("INSERT INTO artist_xp (user_id, artist_id, season_key, xp, updated_at) VALUES (?, ?, 'all-time', ?, ?) ON CONFLICT(user_id, artist_id, season_key) DO UPDATE SET xp=artist_xp.xp+excluded.xp, updated_at=excluded.updated_at").bind(userId, key, Math.max(0, Math.min(Number(amount) || 0, 30)), now).run();
}

const XP_COST_ANCHORS = [[1, 100], [10, 500], [25, 1500], [50, 4000], [75, 8000], [100, 12000]];

// The V3 document specifies the XP needed for the transitions 1→2,
// 10→11, 25→26, 50→51 and 75→76. Interpolating the transition cost keeps
// those values exact while retaining a readable non-linear progression.
function xpCost(level) {
  const value = Math.max(1, Math.min(100, Number(level) || 1));
  for (let index = 1; index < XP_COST_ANCHORS.length; index += 1) {
    const [rightLevel, rightCost] = XP_COST_ANCHORS[index];
    const [leftLevel, leftCost] = XP_COST_ANCHORS[index - 1];
    if (value <= rightLevel) return Math.round(leftCost + (rightCost - leftCost) * ((value - leftLevel) / (rightLevel - leftLevel)));
  }
  return XP_COST_ANCHORS.at(-1)[1];
}

function xpForLevel(level) {
  const value = Math.max(1, Math.min(100, Number(level) || 1));
  let total = 0;
  for (let current = 1; current < value; current += 1) total += xpCost(current);
  return total;
}

function levelForXp(amount) {
  const xp = Math.max(0, Number(amount) || 0);
  let level = 1;
  while (level < 100 && xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export async function xp(request, env) {
  await ensureV3Schema(env.DB); const {row} = await requireAccount(request, env); const current = await env.DB.prepare('SELECT * FROM account_xp WHERE user_id = ?').bind(row.id).first();
  if (request.method === 'GET') {
    const accountXp = Number(current?.account_xp || 0); const level = levelForXp(accountXp); const next = xpForLevel(Math.min(100, level + 1));
    const url = new URL(request.url); const artistId = canonicalArtistKey(url.searchParams.get('artist'));
    let leaderboard = null;
    if (artistId) {
      const viewerId = row.id;
      const participants = await env.DB.prepare(`SELECT ax.user_id, ax.xp, a.username FROM artist_xp ax JOIN account_xp ap ON ap.user_id = ax.user_id JOIN accounts a ON a.id = ax.user_id
        WHERE ax.artist_id = ? AND ax.season_key = 'all-time' AND ap.leaderboard_opt_in = 1
        AND NOT EXISTS (SELECT 1 FROM moderation_blocks b WHERE (b.blocker_id = ? AND b.blocked_id = ax.user_id) OR (b.blocker_id = ax.user_id AND b.blocked_id = ?))
        ORDER BY ax.xp DESC LIMIT 100`).bind(artistId, viewerId, viewerId).all();
      const rows = participants.results || [];
      const count = await env.DB.prepare(`SELECT COUNT(*) AS participant_count FROM artist_xp ax JOIN account_xp ap ON ap.user_id = ax.user_id
        WHERE ax.artist_id = ? AND ax.season_key = 'all-time' AND ap.leaderboard_opt_in = 1
        AND NOT EXISTS (SELECT 1 FROM moderation_blocks b WHERE (b.blocker_id = ? AND b.blocked_id = ax.user_id) OR (b.blocker_id = ax.user_id AND b.blocked_id = ?))`).bind(artistId, viewerId, viewerId).first();
      const participantCount = Number(count?.participant_count || rows.length);
      leaderboard = {participantCount, available: participantCount >= 20, items: participantCount >= 20 ? rows.map((item, index) => ({rank:index + 1, username:item.username, xp:Number(item.xp), level:levelForXp(Number(item.xp))})) : []};
    }
    return {accountXp, level, nextLevelXp: next, leaderboardOptIn: Boolean(current?.leaderboard_opt_in), artistXp: json(current?.artist_xp_json, {}), leaderboard};
  }
  const input = await body(request); const now = new Date().toISOString(); if (typeof input.leaderboardOptIn === 'boolean') await env.DB.prepare("INSERT INTO account_xp (user_id, account_xp, leaderboard_opt_in, artist_xp_json, updated_at) VALUES (?, 0, ?, '{}', ?) ON CONFLICT(user_id) DO UPDATE SET leaderboard_opt_in=excluded.leaderboard_opt_in, updated_at=excluded.updated_at").bind(row.id, input.leaderboardOptIn ? 1 : 0, now).run(); return {updated: true};
}

export async function moderation(request, env) {
  await ensureV3Schema(env.DB); const {row} = await requireAccount(request, env); const input = await body(request); const action = text(input.action, 24); const now = new Date().toISOString();
  if (action === 'block') { const target = text(input.userId, 120); if (!target || target === row.id) throw fail(400, 'Ungültiger Nutzer.'); const exists = await env.DB.prepare('SELECT 1 FROM accounts WHERE id = ?').bind(target).first(); if (!exists) throw fail(404, 'Nutzer nicht gefunden.'); await env.DB.prepare('INSERT OR IGNORE INTO moderation_blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)').bind(row.id, target, now).run(); return {blocked: true}; }
  if (action === 'unblock') { const target = text(input.userId, 120); if (!target) throw fail(400, 'Ungültiger Nutzer.'); await env.DB.prepare('DELETE FROM moderation_blocks WHERE blocker_id = ? AND blocked_id = ?').bind(row.id, target).run(); return {blocked: false}; }
  if (action === 'report') { const reason = text(input.reason, 80); const targetType = text(input.targetType, 40); const targetId = text(input.targetId, 180); if (!reason) throw fail(400, 'Bitte wähle einen Meldegrund.'); if (!['community_post', 'review', 'guide', 'playlist', 'profile'].includes(targetType) || !targetId) throw fail(400, 'Ungültiges Meldeziel.'); const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); const recent = await env.DB.prepare('SELECT COUNT(*) AS count FROM moderation_reports WHERE reporter_id = ? AND created_at >= ?').bind(row.id, cutoff).first(); if (Number(recent?.count || 0) >= 30) throw fail(429, 'Du kannst höchstens 30 Meldungen pro Tag senden.'); await env.DB.prepare('INSERT INTO moderation_reports (id, reporter_id, target_type, target_id, reason, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id('report'), row.id, targetType, targetId, reason, text(input.details, 1000), now).run(); return {reported: true}; }
  if (action === 'appeal') { const targetType = text(input.targetType, 40); const targetId = text(input.targetId, 180); const details = text(input.details, 2000); if (!targetType || !targetId || details.length < 10) throw fail(400, 'Eine Beschwerde braucht ein Ziel und mindestens zehn Zeichen.'); const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); const recent = await env.DB.prepare('SELECT COUNT(*) AS count FROM moderation_appeals WHERE user_id = ? AND created_at >= ?').bind(row.id, cutoff).first(); if (Number(recent?.count || 0) >= 5) throw fail(429, 'Du kannst höchstens fünf Beschwerden pro Tag senden.'); await env.DB.prepare('INSERT INTO moderation_appeals (id, user_id, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id('appeal'), row.id, targetType, targetId, details, now).run(); return {submitted: true}; }
  throw fail(400, 'Unbekannte Moderations-Aktion.');
}

export async function support(request, env) {
  await ensureV3Schema(env.DB);
  if (request.method === 'GET') {
    const {account} = await readSession(request, env);
    let item = null;
    if (account?.userId) item = await env.DB.prepare('SELECT tier, wall_visible, created_at, updated_at FROM support_interest WHERE user_id = ?').bind(account.userId).first();
    return {configured: Boolean(env.STRIPE_SECRET_KEY), paymentReady: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET), interest: item ? {tier: item.tier, wallVisible: Boolean(item.wall_visible), createdAt: item.created_at} : null, tiers: [{id: 'donation', label: 'Einmalige Unterstützung', price: 'Eigener Betrag'}, {id: 'standard', label: 'Supporter', monthly: '1,49 €', yearly: '14,99 €'}, {id: 'premium', label: 'Premium', monthly: '3,49 €', yearly: '34,99 €'}]};
  }
  const {row} = await requireAccount(request, env); const now = new Date().toISOString();
  const input = await body(request); const tier = ['donation', 'standard', 'premium'].includes(input.tier) ? input.tier : 'donation'; await env.DB.prepare('INSERT INTO support_interest (user_id, tier, wall_visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET tier=excluded.tier, wall_visible=excluded.wall_visible, updated_at=excluded.updated_at').bind(row.id, tier, input.wallVisible ? 1 : 0, now, now).run(); return {saved: true, tier, paymentReady: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET)};
}
