-- bias.fm two-layer listening model.
-- Pages Functions also create these tables lazily through ensureSchema so a
-- fresh deployment can boot before an operator runs D1 migrations.
CREATE TABLE IF NOT EXISTS account_activity_privacy (
  account_id TEXT PRIMARY KEY,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'followers', 'private')),
  show_now_playing INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS catalog_artists (
  id TEXT PRIMARY KEY, mbid TEXT UNIQUE, source_id TEXT UNIQUE,
  canonical_name TEXT NOT NULL, hangul_name TEXT NOT NULL DEFAULT '', romanized_name TEXT NOT NULL DEFAULT '',
  artist_type TEXT NOT NULL DEFAULT 'artist', metadata_json TEXT NOT NULL DEFAULT '{}',
  is_stub INTEGER NOT NULL DEFAULT 0, merged_into_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_albums (
  id TEXT PRIMARY KEY, mbid TEXT UNIQUE, source_id TEXT UNIQUE, artist_id TEXT NOT NULL,
  canonical_title TEXT NOT NULL, normalized_title TEXT NOT NULL, metadata_json TEXT NOT NULL DEFAULT '{}',
  is_stub INTEGER NOT NULL DEFAULT 0, merged_into_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_tracks (
  id TEXT PRIMARY KEY, mbid TEXT UNIQUE, source_id TEXT UNIQUE, artist_id TEXT NOT NULL, album_id TEXT,
  canonical_title TEXT NOT NULL, normalized_title TEXT NOT NULL, metadata_json TEXT NOT NULL DEFAULT '{}',
  is_stub INTEGER NOT NULL DEFAULT 0, merged_into_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_aliases (
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'album', 'track')), entity_id TEXT NOT NULL,
  alias TEXT NOT NULL, normalized_key TEXT NOT NULL, alias_kind TEXT NOT NULL DEFAULT 'alias',
  source TEXT NOT NULL DEFAULT 'editorial', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id, normalized_key)
);
CREATE TABLE IF NOT EXISTS listens (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, source TEXT NOT NULL CHECK (source IN ('lastfm', 'listenbrainz', 'manual')),
  source_id TEXT NOT NULL, played_at TEXT, raw_artist TEXT NOT NULL, raw_title TEXT NOT NULL, raw_album TEXT,
  raw_artist_mbid TEXT, raw_album_mbid TEXT, raw_track_mbid TEXT, resolved_artist_id TEXT, resolved_album_id TEXT,
  resolved_track_id TEXT, resolution_status TEXT NOT NULL DEFAULT 'unresolved' CHECK (resolution_status IN ('matched', 'stub', 'artist_matched', 'unresolved')),
  enrichment_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE (user_id, source, source_id)
);
CREATE TABLE IF NOT EXISTS listen_imports (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, source TEXT NOT NULL, external_user TEXT, period TEXT,
  row_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_list_meta (
  list_id TEXT PRIMARY KEY, cover_data TEXT NOT NULL DEFAULT '',
  list_position INTEGER NOT NULL DEFAULT 0, sort_mode TEXT NOT NULL DEFAULT 'release_date',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_list_item_meta (
  list_id TEXT NOT NULL, kind TEXT NOT NULL, entity_id TEXT NOT NULL,
  release_date TEXT NOT NULL DEFAULT '', cover_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL, PRIMARY KEY (list_id, kind, entity_id)
);
CREATE TABLE IF NOT EXISTS user_list_likes (
  list_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY (list_id, user_id)
);
CREATE TABLE IF NOT EXISTS user_list_follows (
  list_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY (list_id, user_id)
);
CREATE INDEX IF NOT EXISTS catalog_aliases_lookup ON catalog_aliases (entity_type, normalized_key);
CREATE INDEX IF NOT EXISTS catalog_tracks_artist_title ON catalog_tracks (artist_id, normalized_title);
CREATE INDEX IF NOT EXISTS catalog_albums_artist_title ON catalog_albums (artist_id, normalized_title);
CREATE INDEX IF NOT EXISTS listens_user_played ON listens (user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS listens_resolution ON listens (resolution_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS listens_source ON listens (source, source_id);
CREATE INDEX IF NOT EXISTS account_activity_privacy_visibility ON account_activity_privacy (visibility);
CREATE INDEX IF NOT EXISTS user_list_meta_position ON user_list_meta (list_position ASC, updated_at DESC);
CREATE INDEX IF NOT EXISTS user_list_items_release_date ON user_list_item_meta (list_id, release_date DESC);
CREATE INDEX IF NOT EXISTS user_list_likes_list ON user_list_likes (list_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_list_follows_list ON user_list_follows (list_id, created_at DESC);
