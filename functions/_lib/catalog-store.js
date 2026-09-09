import {fail} from './http.js';
import {ARTISTS} from './catalog.js';

const SOURCES = new Set(['lastfm', 'listenbrainz', 'manual']);
const SEED_VERSION = 'catalog-v1';
const MAX_IMPORT_ROWS = 1000;

// The resolver deliberately keeps the matching rules small and deterministic.
// Hangul, romanisations and provider spellings are all stored as aliases so a
// later editorial merge can change the canonical entity without rewriting raw
// listens.
export function normalizeCatalogText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('und')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function cleanText(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function iso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function canonicalArtistId(artist) {
  return artist.mbid ? `artist:${artist.mbid}` : `artist:${artist.id}`;
}

function canonicalAlbumId(artistId, title) {
  return `album:${artistId}:${normalizeCatalogText(title)}`.slice(0, 240);
}

function canonicalTrackId(track) {
  return track.mbid ? `track:${track.mbid}` : `track:${track.id}`;
}

async function stableId(prefix, values) {
  const text = values.map(value => String(value ?? '')).join('\u001f');
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const hex = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${hex.slice(0, 32)}`;
  }
  // Cloudflare always has Web Crypto. This fallback keeps local unit fixtures
  // deterministic when a very small mock runtime does not provide it.
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${prefix}_${(hash >>> 0).toString(16)}`;
}

const SEED_TRACKS = [
  {id: 'track-ditto', mbid: 'c52e89d1-382a-43d8-b57f-d169f4469738', artistId: 'newjeans', title: 'Ditto', hangul: '디토', album: 'OMG (Single)'},
  {id: 'track-bamyanggaeng', mbid: '49e2954a-7182-411a-b6e9-277dca714092', artistId: 'bibi', title: 'Bam Yanggaeng', hangul: '밤양갱', album: '밤양갱 (Single)'},
  {id: 'track-your-home', mbid: 'a3819d94-a128-4444-9388-c71c4c3e8009', artistId: 'sumin', title: 'Your Home', hangul: '너네 집', album: 'MINISERIES'},
  {id: 'track-antifreeze', mbid: '9211a774-7221-4f1c-99d8-c71b6910a37e', artistId: 'black-skirts', title: 'Antifreeze', hangul: '안티프리즈', album: '201'},
  {id: 'track-tomboy', mbid: '39a9c402-18da-4392-aa2e-4b2049c39fa4', artistId: 'gidle', title: 'TOMBOY', hangul: '톰보이', album: 'I NEVER DIE'},
  {id: 'track-event-horizon', mbid: '1e194830-4e89-43c2-bf72-e5b3810f4439', artistId: 'younha', title: 'Event Horizon', hangul: '사건의 지평선', album: 'END THEORY: Final Edition'},
  {id: 'track-rush-hour', mbid: '7192cb91-9e20-4ea2-8d77-62e92c4b8192', artistId: 'crush', title: 'Rush Hour', hangul: '러쉬 아워', album: 'Rush Hour (Single)'},
  {id: 'track-through-the-night', mbid: '50e182cb-4899-4c81-8b22-8c7041a91e02', artistId: 'iu', title: 'Through the Night', hangul: '밤편지', album: 'Palette'},
  {id: 'track-guilty', mbid: '8cb92711-4a92-4211-9fa1-92b8109ca411', artistId: 'dynamic-duo', title: 'Guilty', hangul: '죽일 놈', album: 'Band of Dynamic Brothers'},
  {id: 'track-tik-tak-tok', mbid: '711829cb-1290-4822-9011-827b9a10fc21', artistId: 'silica-gel', title: 'Tik Tak Tok', hangul: '틱택톡', album: 'POWER ANDRE 99'},
  {id: 'track-nerdy-love', mbid: '209381c8-8922-4820-9cb1-82910acb4920', artistId: 'ph-1', title: 'Nerdy Love', hangul: '널디 러브', album: 'Nerdy Love (Single)'},
  {id: 'track-supernova', mbid: '928371cc-8299-4c12-8711-2093841029ba', artistId: 'aespa', title: 'Supernova', hangul: '슈퍼노바', album: 'Armageddon - The 1st Album'}
];

function chunks(items, size = 80) {
  const output = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

function artistView(row) {
  if (!row) return null;
  return {
    id: row.id,
    mbid: row.mbid || null,
    sourceId: row.source_id || '',
    name: row.canonical_name,
    hangul: row.hangul_name || '',
    romanized: row.romanized_name || '',
    type: row.artist_type || 'artist',
    isStub: Boolean(row.is_stub),
    mergedIntoId: row.merged_into_id || null,
    metadata: parseJson(row.metadata_json)
  };
}

function albumView(row) {
  if (!row) return null;
  return {id: row.id, mbid: row.mbid || null, title: row.canonical_title, artistId: row.artist_id, isStub: Boolean(row.is_stub), mergedIntoId: row.merged_into_id || null, metadata: parseJson(row.metadata_json)};
}

function trackView(row) {
  if (!row) return null;
  return {id: row.id, mbid: row.mbid || null, title: row.canonical_title, artistId: row.artist_id, albumId: row.album_id || null, isStub: Boolean(row.is_stub), mergedIntoId: row.merged_into_id || null, metadata: parseJson(row.metadata_json)};
}

function parseJson(value) {
  try { const parsed = JSON.parse(value || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; }
}

export async function ensureCatalogSeed(db) {
  if (!db) throw fail(503, 'Die Cloudflare-Datenbank ist noch nicht verbunden.');
  const version = await db.prepare('SELECT value FROM catalog_meta WHERE key = ?').bind('seed_version').first();
  if (version?.value === SEED_VERSION) return;
  const now = new Date().toISOString();
  const statements = [];
  for (const artist of ARTISTS) {
    const id = canonicalArtistId(artist);
    statements.push(db.prepare(`INSERT INTO catalog_artists (id, mbid, source_id, canonical_name, hangul_name, romanized_name, artist_type, metadata_json, is_stub, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET mbid = excluded.mbid, source_id = excluded.source_id, canonical_name = excluded.canonical_name, hangul_name = excluded.hangul_name, romanized_name = excluded.romanized_name, artist_type = excluded.artist_type, metadata_json = excluded.metadata_json, is_stub = 0, updated_at = excluded.updated_at`)
      .bind(id, artist.mbid || null, artist.id, artist.name, artist.hangul || '', artist.romanized || '', artist.type || 'artist', JSON.stringify({genres: artist.genres || [], generation: artist.generation || '', debutYear: artist.debutYear || null}), now, now));
    const aliases = [artist.name, artist.hangul, artist.romanized, ...(artist.aliases || [])].filter(Boolean);
    for (const alias of aliases) {
      const normalized = normalizeCatalogText(alias);
      if (!normalized) continue;
      statements.push(db.prepare(`INSERT OR IGNORE INTO catalog_aliases (entity_type, entity_id, alias, normalized_key, alias_kind, source, created_at, updated_at) VALUES ('artist', ?, ?, ?, ?, 'seed', ?, ?)`)
        .bind(id, String(alias).slice(0, 500), normalized, alias === artist.hangul ? 'hangul' : alias === artist.romanized ? 'romanized' : 'alias', now, now));
    }
  }
  for (const track of SEED_TRACKS) {
    const artist = ARTISTS.find(item => item.id === track.artistId);
    if (!artist) continue;
    const artistId = canonicalArtistId(artist);
    const albumId = canonicalAlbumId(artistId, track.album);
    const trackId = canonicalTrackId(track);
    statements.push(db.prepare(`INSERT INTO catalog_albums (id, mbid, source_id, artist_id, canonical_title, normalized_title, metadata_json, is_stub, created_at, updated_at)
      VALUES (?, NULL, ?, ?, ?, ?, ?, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET canonical_title = excluded.canonical_title, normalized_title = excluded.normalized_title, metadata_json = excluded.metadata_json, is_stub = 0, updated_at = excluded.updated_at`)
      .bind(albumId, `${artist.id}:${track.album}`, artistId, track.album, normalizeCatalogText(track.album), JSON.stringify({sourceId: `${artist.id}:${track.album}`}), now, now));
    statements.push(db.prepare(`INSERT INTO catalog_tracks (id, mbid, source_id, artist_id, album_id, canonical_title, normalized_title, metadata_json, is_stub, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET mbid = excluded.mbid, source_id = excluded.source_id, artist_id = excluded.artist_id, album_id = excluded.album_id, canonical_title = excluded.canonical_title, normalized_title = excluded.normalized_title, metadata_json = excluded.metadata_json, is_stub = 0, updated_at = excluded.updated_at`)
      .bind(trackId, track.mbid || null, track.id, artistId, albumId, track.title, normalizeCatalogText(track.title), JSON.stringify({hangul: track.hangul, sourceId: track.id}), now, now));
    for (const [alias, kind] of [[track.title, 'title'], [track.hangul, 'hangul'], [track.album, 'album']]) {
      const normalized = normalizeCatalogText(alias);
      if (!normalized) continue;
      const entityType = kind === 'album' ? 'album' : 'track';
      const entityId = kind === 'album' ? albumId : trackId;
      statements.push(db.prepare(`INSERT OR IGNORE INTO catalog_aliases (entity_type, entity_id, alias, normalized_key, alias_kind, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'seed', ?, ?)`)
        .bind(entityType, entityId, alias, normalized, kind, now, now));
    }
  }
  statements.push(db.prepare(`INSERT INTO catalog_meta (key, value, updated_at) VALUES ('seed_version', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).bind(SEED_VERSION, now));
  for (const batch of chunks(statements)) await db.batch(batch);
}

async function followMerge(db, table, row) {
  let current = row;
  for (let index = 0; index < 3 && current?.merged_into_id; index += 1) {
    current = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(current.merged_into_id).first();
  }
  return current || row;
}

async function byAlias(db, entityType, alias) {
  const normalized = normalizeCatalogText(alias);
  if (!normalized) return null;
  const table = entityType === 'artist' ? 'catalog_artists' : entityType === 'album' ? 'catalog_albums' : 'catalog_tracks';
  const row = await db.prepare(`SELECT entity.* FROM ${table} entity JOIN catalog_aliases alias ON alias.entity_id = entity.id AND alias.entity_type = ? WHERE alias.normalized_key = ? ORDER BY entity.is_stub ASC LIMIT 1`).bind(entityType, normalized).first();
  if (!row) return null;
  return followMerge(db, entityType === 'artist' ? 'catalog_artists' : entityType === 'album' ? 'catalog_albums' : 'catalog_tracks', row);
}

async function byMbid(db, entityType, mbid) {
  if (!mbid) return null;
  const table = entityType === 'artist' ? 'catalog_artists' : entityType === 'album' ? 'catalog_albums' : 'catalog_tracks';
  const row = await db.prepare(`SELECT * FROM ${table} WHERE mbid = ?`).bind(String(mbid).trim()).first();
  return row ? followMerge(db, table, row) : null;
}

async function createAlias(db, entityType, entityId, alias, kind, now) {
  const normalized = normalizeCatalogText(alias);
  if (!normalized) return;
  await db.prepare(`INSERT OR IGNORE INTO catalog_aliases (entity_type, entity_id, alias, normalized_key, alias_kind, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'listen', ?, ?)`)
    .bind(entityType, entityId, String(alias).slice(0, 500), normalized, kind, now, now).run();
}

async function ensureStubArtist(db, name, now, mbid = '') {
  const sourceId = `stub:${mbid || normalizeCatalogText(name)}`;
  let row = await db.prepare('SELECT * FROM catalog_artists WHERE source_id = ?').bind(sourceId).first();
  if (!row) {
    const id = await stableId('stub_artist', [sourceId]);
    await db.prepare(`INSERT OR IGNORE INTO catalog_artists (id, mbid, source_id, canonical_name, hangul_name, romanized_name, artist_type, metadata_json, is_stub, created_at, updated_at) VALUES (?, ?, ?, ?, '', '', 'artist', ?, 1, ?, ?)`)
      .bind(id, mbid || null, sourceId, name, JSON.stringify({stubReason: 'unmatched-listen'}), now, now).run();
    row = await db.prepare('SELECT * FROM catalog_artists WHERE source_id = ?').bind(sourceId).first();
    if (!row && mbid) row = await db.prepare('SELECT * FROM catalog_artists WHERE mbid = ?').bind(mbid).first();
  }
  await createAlias(db, 'artist', row.id, name, 'raw', now);
  return row;
}

async function ensureStubAlbum(db, artistId, title, now, mbid = '') {
  const sourceId = `stub:${mbid || `${artistId}:${normalizeCatalogText(title)}`}`;
  let row = await db.prepare('SELECT * FROM catalog_albums WHERE source_id = ?').bind(sourceId).first();
  if (!row) {
    const id = await stableId('stub_album', [sourceId]);
    await db.prepare(`INSERT OR IGNORE INTO catalog_albums (id, mbid, source_id, artist_id, canonical_title, normalized_title, metadata_json, is_stub, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .bind(id, mbid || null, sourceId, artistId, title, normalizeCatalogText(title), JSON.stringify({stubReason: 'unmatched-listen'}), now, now).run();
    row = await db.prepare('SELECT * FROM catalog_albums WHERE source_id = ?').bind(sourceId).first();
    if (!row && mbid) row = await db.prepare('SELECT * FROM catalog_albums WHERE mbid = ?').bind(mbid).first();
  }
  await createAlias(db, 'album', row.id, title, 'raw', now);
  return row;
}

async function ensureStubTrack(db, artistId, albumId, title, now, mbid = '') {
  const sourceId = `stub:${mbid || `${artistId}:${albumId || ''}:${normalizeCatalogText(title)}`}`;
  let row = await db.prepare('SELECT * FROM catalog_tracks WHERE source_id = ?').bind(sourceId).first();
  if (!row) {
    const id = await stableId('stub_track', [sourceId]);
    await db.prepare(`INSERT OR IGNORE INTO catalog_tracks (id, mbid, source_id, artist_id, album_id, canonical_title, normalized_title, metadata_json, is_stub, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .bind(id, mbid || null, sourceId, artistId, albumId || null, title, normalizeCatalogText(title), JSON.stringify({stubReason: 'unmatched-listen'}), now, now).run();
    row = await db.prepare('SELECT * FROM catalog_tracks WHERE source_id = ?').bind(sourceId).first();
    if (!row && mbid) row = await db.prepare('SELECT * FROM catalog_tracks WHERE mbid = ?').bind(mbid).first();
  }
  await createAlias(db, 'track', row.id, title, 'raw', now);
  return row;
}

export async function resolveCatalog(db, input, {createStubs = false} = {}) {
  await ensureCatalogSeed(db);
  const rawArtist = cleanText(input?.rawArtist || input?.artist, 240);
  const rawTitle = cleanText(input?.rawTitle || input?.title, 240);
  const rawAlbum = cleanText(input?.rawAlbum || input?.album, 240);
  const artistMbid = cleanText(input?.rawArtistMbid || input?.artistMbid, 120);
  const trackMbid = cleanText(input?.rawTrackMbid || input?.trackMbid, 120);
  const albumMbid = cleanText(input?.rawAlbumMbid || input?.albumMbid, 120);

  let artist = await byMbid(db, 'artist', artistMbid);
  if (!artist && rawArtist) artist = await byAlias(db, 'artist', rawArtist);
  // A title-only alias is not enough to identify a recording: common titles
  // such as "Home" or "Love" would otherwise attach an unknown artist to the
  // first matching catalog track. Resolve the artist first, then constrain the
  // title lookup to that artist. A global track alias is only safe when the
  // source did not provide an artist at all or supplied a canonical track MBID.
  let track = await byMbid(db, 'track', trackMbid);
  if (!track && rawTitle && artist) {
    track = await db.prepare(`SELECT t.* FROM catalog_tracks t
      LEFT JOIN catalog_aliases alias ON alias.entity_type = 'track' AND alias.entity_id = t.id
      WHERE t.artist_id = ? AND (t.normalized_title = ? OR alias.normalized_key = ?)
      ORDER BY t.is_stub ASC LIMIT 1`).bind(artist.id, normalizeCatalogText(rawTitle), normalizeCatalogText(rawTitle)).first();
    if (track) track = await followMerge(db, 'catalog_tracks', track);
  }
  if (!track && !artist && !rawArtist && rawTitle) track = await byAlias(db, 'track', rawTitle);
  let album = await byMbid(db, 'album', albumMbid);
  if (!album && rawAlbum) album = await byAlias(db, 'album', rawAlbum);
  if (!artist && track?.artist_id) artist = await followMerge(db, 'catalog_artists', await db.prepare('SELECT * FROM catalog_artists WHERE id = ?').bind(track.artist_id).first());
  if (artist && track && track.artist_id !== artist.id) track = null;
  if (artist && album && album.artist_id !== artist.id) album = null;
  if (!artist && createStubs && rawArtist) artist = await ensureStubArtist(db, rawArtist, new Date().toISOString(), artistMbid);
  if (artist && !album && rawAlbum) {
    const artistId = artist.id;
    album = await db.prepare('SELECT * FROM catalog_albums WHERE artist_id = ? AND normalized_title = ? ORDER BY is_stub ASC LIMIT 1').bind(artistId, normalizeCatalogText(rawAlbum)).first();
    album = album ? await followMerge(db, 'catalog_albums', album) : null;
    if (!album && createStubs) album = await ensureStubAlbum(db, artistId, rawAlbum, new Date().toISOString(), albumMbid);
  }
  if (!track && artist && rawTitle) {
    track = await db.prepare('SELECT * FROM catalog_tracks WHERE artist_id = ? AND normalized_title = ? ORDER BY is_stub ASC LIMIT 1').bind(artist.id, normalizeCatalogText(rawTitle)).first();
    track = track ? await followMerge(db, 'catalog_tracks', track) : null;
    if (!track && createStubs) track = await ensureStubTrack(db, artist.id, album?.id || null, rawTitle, new Date().toISOString(), trackMbid);
  }
  const status = track?.is_stub || album?.is_stub || artist?.is_stub ? 'stub' : track || album || artist ? 'matched' : 'unresolved';
  return {status, artist: artistView(artist), album: albumView(album), track: trackView(track)};
}

export async function ingestListens(db, userId, rows, options = {}) {
  const owner = cleanText(userId, 160);
  if (!owner) throw fail(401, 'Bitte melde dich für das Speichern von Hördaten an.');
  if (!Array.isArray(rows) || !rows.length) return {imported: 0, duplicates: 0, stubs: 0, matched: 0, importId: null};
  if (rows.length > MAX_IMPORT_ROWS) throw fail(413, `Ein Import darf höchstens ${MAX_IMPORT_ROWS} Plays enthalten.`);
  const source = cleanText(options.source, 40).toLowerCase();
  if (!SOURCES.has(source)) throw fail(400, 'Unbekannte Hörquelle.');
  await ensureCatalogSeed(db);
  const now = new Date().toISOString();
  const importId = await stableId('import', [owner, source, now, rows.length]);
  const counts = {imported: 0, duplicates: 0, stubs: 0, matched: 0};
  for (let index = 0; index < rows.length; index += 1) {
    const input = rows[index] || {};
    const rawArtist = cleanText(input.rawArtist || input.artist || input.artist_name, 240);
    const rawTitle = cleanText(input.rawTitle || input.title || input.track, 240);
    if (!rawArtist || !rawTitle) continue;
    const playedAt = iso(input.playedAt || input.played_at || input.timestamp);
    const sourceId = cleanText(input.sourceId || input.source_id, 255) || await stableId('source', [source, owner, playedAt || '', rawArtist, rawTitle, rawAlbum(input), index]);
    const rawAlbumValue = rawAlbum(input);
    const resolved = await resolveCatalog(db, {...input, rawArtist, rawTitle, rawAlbum: rawAlbumValue}, {createStubs: true});
    const listenId = await stableId('listen', [owner, source, sourceId]);
    const existing = await db.prepare('SELECT id FROM listens WHERE user_id = ? AND source = ? AND source_id = ?').bind(owner, source, sourceId).first();
    const result = await db.prepare(`INSERT INTO listens (id, user_id, source, source_id, played_at, raw_artist, raw_title, raw_album, raw_artist_mbid, raw_album_mbid, raw_track_mbid, resolved_artist_id, resolved_album_id, resolved_track_id, resolution_status, enrichment_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', ?, ?)
      ON CONFLICT(user_id, source, source_id) DO UPDATE SET played_at = excluded.played_at, raw_artist = excluded.raw_artist, raw_title = excluded.raw_title, raw_album = excluded.raw_album, raw_artist_mbid = excluded.raw_artist_mbid, raw_album_mbid = excluded.raw_album_mbid, raw_track_mbid = excluded.raw_track_mbid, resolved_artist_id = excluded.resolved_artist_id, resolved_album_id = excluded.resolved_album_id, resolved_track_id = excluded.resolved_track_id, resolution_status = excluded.resolution_status, updated_at = excluded.updated_at`)
      .bind(listenId, owner, source, sourceId, playedAt, rawArtist, rawTitle, rawAlbumValue || null, cleanText(input.rawArtistMbid || input.artistMbid || input.artist_mbid, 120) || null, cleanText(input.rawAlbumMbid || input.albumMbid || input.album_mbid, 120) || null, cleanText(input.rawTrackMbid || input.trackMbid || input.track_mbid, 120) || null, resolved.artist?.id || null, resolved.album?.id || null, resolved.track?.id || null, resolved.status, now, now).run();
    if (existing) counts.duplicates += 1; else if (Number(result?.meta?.changes || result?.changes || 0)) {
      counts.imported += 1;
      // Only canonical, non-stub matches earn Artist XP. Provider imports are
      // still preserved as raw listens when matching is uncertain, but they
      // cannot be used to farm a public fan level.
      if (resolved.status === 'matched' && resolved.artist?.id && !resolved.artist.isStub) {
        await awardArtistListenXp(db, owner, resolved.artist.id, listenId, now);
      }
    }
    if (resolved.status === 'stub') counts.stubs += 1; else if (resolved.status === 'matched') counts.matched += 1;
  }
  await db.prepare('INSERT INTO listen_imports (id, user_id, source, external_user, period, row_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(importId, owner, source, cleanText(options.externalUser, 160) || null, cleanText(options.period, 40) || null, rows.length, now).run();
  return {...counts, importId};
}

const ARTIST_PLAY_XP_DAILY_CAP = 50;

async function awardArtistListenXp(db, userId, artistId, listenId, now) {
  const inserted = await db.prepare('INSERT OR IGNORE INTO artist_xp_events (listen_id, user_id, artist_id, created_at) VALUES (?, ?, ?, ?)')
    .bind(listenId, userId, artistId, now).run();
  if (!Number(inserted?.meta?.changes || inserted?.changes || 0)) return;
  const dayKey = `day:${now.slice(0, 10)}`;
  const dayRow = await db.prepare('SELECT xp FROM artist_xp WHERE user_id = ? AND artist_id = ? AND season_key = ?')
    .bind(userId, artistId, dayKey).first();
  const currentDay = Number(dayRow?.xp || 0);
  if (currentDay >= ARTIST_PLAY_XP_DAILY_CAP) return;
  const amount = Math.min(1, ARTIST_PLAY_XP_DAILY_CAP - currentDay);
  await db.batch([
    db.prepare(`INSERT INTO artist_xp (user_id, artist_id, season_key, xp, updated_at) VALUES (?, ?, 'all-time', ?, ?)
      ON CONFLICT(user_id, artist_id, season_key) DO UPDATE SET xp = artist_xp.xp + excluded.xp, updated_at = excluded.updated_at`).bind(userId, artistId, amount, now),
    db.prepare(`INSERT INTO artist_xp (user_id, artist_id, season_key, xp, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, artist_id, season_key) DO UPDATE SET xp = artist_xp.xp + excluded.xp, updated_at = excluded.updated_at`).bind(userId, artistId, dayKey, amount, now)
  ]);
  const account = await db.prepare('SELECT artist_xp_json FROM account_xp WHERE user_id = ?').bind(userId).first();
  let values = {};
  try { values = JSON.parse(account?.artist_xp_json || '{}') || {}; } catch {}
  values[artistId] = Math.max(0, Number(values[artistId] || 0)) + amount;
  await db.prepare(`INSERT INTO account_xp (user_id, account_xp, leaderboard_opt_in, artist_xp_json, updated_at) VALUES (?, 0, 0, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET artist_xp_json = excluded.artist_xp_json, updated_at = excluded.updated_at`).bind(userId, JSON.stringify(values), now).run();
}

function rawAlbum(input) {
  return cleanText(input?.rawAlbum || input?.album || input?.album_name, 240);
}

export async function listListens(db, userId, limit = 50) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const result = await db.prepare(`SELECT l.id, l.source, l.played_at, l.raw_artist, l.raw_title, l.raw_album, l.resolution_status,
      t.id AS track_id, t.mbid AS track_mbid, t.canonical_title AS track_title,
      a.id AS artist_id, a.mbid AS artist_mbid, a.canonical_name AS artist_name,
      al.id AS album_id, al.mbid AS album_mbid, al.canonical_title AS album_title
    FROM listens l
    LEFT JOIN catalog_tracks t0 ON t0.id = l.resolved_track_id
    LEFT JOIN catalog_tracks t ON t.id = COALESCE(t0.merged_into_id, t0.id)
    LEFT JOIN catalog_artists a0 ON a0.id = COALESCE(t.artist_id, l.resolved_artist_id)
    LEFT JOIN catalog_artists a ON a.id = COALESCE(a0.merged_into_id, a0.id)
    LEFT JOIN catalog_albums al0 ON al0.id = COALESCE(t.album_id, l.resolved_album_id)
    LEFT JOIN catalog_albums al ON al.id = COALESCE(al0.merged_into_id, al0.id)
    WHERE l.user_id = ? ORDER BY COALESCE(l.played_at, l.created_at) DESC LIMIT ?`).bind(userId, safeLimit).all();
  return (result.results || []).map(row => ({id: row.id, source: row.source, playedAt: row.played_at, raw: {artist: row.raw_artist, title: row.raw_title, album: row.raw_album || ''}, resolution: row.resolution_status, artist: row.artist_id ? {id: row.artist_id, mbid: row.artist_mbid || null, name: row.artist_name} : null, album: row.album_id ? {id: row.album_id, mbid: row.album_mbid || null, title: row.album_title} : null, track: row.track_id ? {id: row.track_id, mbid: row.track_mbid || null, title: row.track_title} : null}));
}

export async function mergeCatalogEntity(db, entityType, fromId, toId) {
  const table = entityType === 'artist' ? 'catalog_artists' : entityType === 'album' ? 'catalog_albums' : entityType === 'track' ? 'catalog_tracks' : '';
  if (!table || !fromId || !toId || fromId === toId) throw fail(400, 'Ungültige Katalog-Zusammenführung.');
  const source = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(fromId).first();
  const target = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(toId).first();
  if (!source || !target) throw fail(404, 'Katalogeintrag nicht gefunden.');
  const now = new Date().toISOString();
  // Artist XP is keyed by the same canonical entity IDs as listens. Read the
  // small JSON projection before the merge so a stub merge cannot strand a
  // user's progress under the old ID.
  const xpRows = entityType === 'artist'
    ? (await db.prepare('SELECT user_id, artist_xp_json FROM account_xp').all()).results || []
    : [];
  const statements = [
    db.prepare(`INSERT OR IGNORE INTO catalog_aliases (entity_type, entity_id, alias, normalized_key, alias_kind, source, created_at, updated_at) SELECT entity_type, ?, alias, normalized_key, alias_kind, source, created_at, ? FROM catalog_aliases WHERE entity_type = ? AND entity_id = ?`).bind(toId, now, entityType, fromId),
    db.prepare(`UPDATE listens SET resolved_${entityType}_id = ?, updated_at = ? WHERE resolved_${entityType}_id = ?`).bind(toId, now, fromId),
    db.prepare(`UPDATE ${table} SET merged_into_id = ?, updated_at = ? WHERE id = ?`).bind(toId, now, fromId),
    db.prepare('DELETE FROM catalog_aliases WHERE entity_type = ? AND entity_id = ?').bind(entityType, fromId)
  ];
  if (entityType === 'artist') {
    statements.push(
      db.prepare('UPDATE catalog_albums SET artist_id = ?, updated_at = ? WHERE artist_id = ?').bind(toId, now, fromId),
      db.prepare('UPDATE catalog_tracks SET artist_id = ?, updated_at = ? WHERE artist_id = ?').bind(toId, now, fromId),
      db.prepare(`INSERT INTO artist_xp (user_id, artist_id, season_key, xp, updated_at)
        SELECT user_id, ?, season_key, SUM(xp), ? FROM artist_xp WHERE artist_id = ?
        GROUP BY user_id, season_key
        ON CONFLICT(user_id, artist_id, season_key) DO UPDATE SET xp = artist_xp.xp + excluded.xp, updated_at = excluded.updated_at`).bind(toId, now, fromId),
      db.prepare('DELETE FROM artist_xp WHERE artist_id = ?').bind(fromId),
      db.prepare('UPDATE artist_xp_events SET artist_id = ? WHERE artist_id = ?').bind(toId, fromId)
    );
  }
  if (entityType === 'album') statements.push(db.prepare('UPDATE catalog_tracks SET album_id = ?, updated_at = ? WHERE album_id = ?').bind(toId, now, fromId));
  await db.batch(statements);
  if (entityType === 'artist' && xpRows.length) {
    const updates = [];
    for (const row of xpRows) {
      const values = parseJson(row.artist_xp_json);
      if (!Object.hasOwn(values, fromId)) continue;
      values[toId] = Math.max(0, Number(values[toId] || 0)) + Math.max(0, Number(values[fromId] || 0));
      delete values[fromId];
      updates.push(db.prepare('UPDATE account_xp SET artist_xp_json = ?, updated_at = ? WHERE user_id = ?').bind(JSON.stringify(values), now, row.user_id));
    }
    for (const batch of chunks(updates)) await db.batch(batch);
  }
  return {fromId, toId, entityType, merged: true};
}

export {MAX_IMPORT_ROWS, SOURCES, SEED_TRACKS};
