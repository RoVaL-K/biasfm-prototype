import {fail} from './http.js';

let schemaReady = new WeakSet();

async function ensureSchema(db) {
  if (!db || schemaReady.has(db)) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS releases (
    id TEXT PRIMARY KEY,
    act TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    genres_json TEXT NOT NULL DEFAULT '[]',
    source_url TEXT NOT NULL,
    events_json TEXT NOT NULL DEFAULT '[]',
    state TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
  schemaReady.add(db);
}

const text = (input, key, max, required = false) => {
  const value = String(input?.[key] ?? '').trim();
  if (value.length > max || (required && !value)) throw fail(400, `Bitte ${key} prüfen.`);
  return value;
};

export function validateRelease(input) {
  const date = text(input, 'date', 10, true);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw fail(400, 'Bitte ein gültiges Datum eingeben.');
  const sourceUrl = text(input, 'sourceUrl', 1000, true);
  let link;
  try { link = new URL(sourceUrl); } catch { throw fail(400, 'Bitte eine gültige Quellen-URL angeben.'); }
  if (!['https:', 'http:'].includes(link.protocol) || link.username || link.password) throw fail(400, 'Bitte eine öffentliche HTTP-Quelle angeben.');
  if (!['draft', 'published'].includes(input?.state)) throw fail(400, 'Bitte die Sichtbarkeit prüfen.');
  const events = (Array.isArray(input?.events) ? input.events : [])
    .map(event => ({date: String(event?.date || '').trim(), title: String(event?.title || '').trim()}))
    .filter(event => event.date && event.title)
    .slice(0, 12);
  if (events.some(event => !/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !Number.isFinite(Date.parse(event.date)) || event.title.length > 160)) throw fail(400, 'Bitte bestätigte Update-Termine prüfen.');
  return {
    act: text(input, 'act', 120, true),
    title: text(input, 'title', 200, true),
    date,
    type: text(input, 'type', 60, true),
    description: text(input, 'description', 2000),
    genres: (Array.isArray(input?.genres) ? input.genres : []).map(value => String(value).trim()).filter(Boolean).slice(0, 8).map(value => value.slice(0, 40)),
    sourceUrl: link.href,
    events,
    state: input.state
  };
}

function decode(row) {
  return {
    id: row.id,
    act: row.act,
    title: row.title,
    date: row.date,
    type: row.type,
    description: row.description,
    genres: JSON.parse(row.genres_json || '[]'),
    sourceUrl: row.source_url,
    events: JSON.parse(row.events_json || '[]'),
    state: row.state,
    version: row.version,
    updatedAt: row.updated_at
  };
}

export async function readPublished(db) {
  if (!db) return [];
  await ensureSchema(db);
  const result = await db.prepare(`SELECT * FROM releases WHERE state = 'published' ORDER BY date ASC`).all();
  return (result.results || []).map(row => {
    const item = decode(row);
    const {state, ...publicItem} = item;
    return {...publicItem, status: 'Redaktionell eingetragen', sourceName: 'Redaktion', sourceVerified: false};
  });
}

function authorized(request, env) {
  const expected = String(env.EDITORIAL_TOKEN || '');
  const provided = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  return expected.length >= 24 && provided.length === expected.length && provided === expected;
}

export async function listEditorial(request, env) {
  if (!authorized(request, env)) throw fail(env.EDITORIAL_TOKEN ? 401 : 503, env.EDITORIAL_TOKEN ? 'Der Redaktionszugang ist ungültig.' : 'Die öffentliche Redaktion ist noch nicht freigeschaltet.');
  if (!env.DB) throw fail(503, 'Die Cloudflare-Datenbank ist noch nicht verbunden.');
  await ensureSchema(env.DB);
  const result = await env.DB.prepare('SELECT * FROM releases ORDER BY date ASC').all();
  return (result.results || []).map(decode);
}

export async function saveEditorial(request, env) {
  if (!authorized(request, env)) throw fail(env.EDITORIAL_TOKEN ? 401 : 503, env.EDITORIAL_TOKEN ? 'Der Redaktionszugang ist ungültig.' : 'Die öffentliche Redaktion ist noch nicht freigeschaltet.');
  if (!env.DB) throw fail(503, 'Die Cloudflare-Datenbank ist noch nicht verbunden.');
  await ensureSchema(env.DB);
  let body;
  try { body = await request.json(); } catch { throw fail(400, 'Ungültige JSON-Eingabe.'); }
  const value = validateRelease(body);
  const id = body.id || `ed-${crypto.randomUUID()}`;
  const old = body.id ? await env.DB.prepare('SELECT * FROM releases WHERE id = ?').bind(body.id).first() : null;
  if (body.id && !old) throw fail(404, 'Dieser Eintrag existiert nicht mehr.');
  if (old && Number(body.version) !== Number(old.version)) throw fail(409, 'Der Eintrag wurde inzwischen geändert. Bitte neu laden und erneut bearbeiten.');
  const version = Number(old?.version || 0) + 1;
  const updatedAt = new Date().toISOString();
  await env.DB.prepare(`INSERT OR REPLACE INTO releases (id, act, title, date, type, description, genres_json, source_url, events_json, state, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, value.act, value.title, value.date, value.type, value.description, JSON.stringify(value.genres), value.sourceUrl, JSON.stringify(value.events), value.state, version, updatedAt).run();
  return {id, ...value, version, updatedAt};
}

export async function deleteEditorial(request, env, id) {
  if (!authorized(request, env)) throw fail(env.EDITORIAL_TOKEN ? 401 : 503, env.EDITORIAL_TOKEN ? 'Der Redaktionszugang ist ungültig.' : 'Die öffentliche Redaktion ist noch nicht freigeschaltet.');
  if (!env.DB) throw fail(503, 'Die Cloudflare-Datenbank ist noch nicht verbunden.');
  await ensureSchema(env.DB);
  const old = await env.DB.prepare('SELECT version FROM releases WHERE id = ?').bind(id).first();
  if (!old) throw fail(404, 'Der Eintrag existiert nicht mehr.');
  if (Number(new URL(request.url).searchParams.get('version')) !== Number(old.version)) throw fail(409, 'Der Eintrag wurde inzwischen geändert. Bitte neu laden.');
  await env.DB.prepare('DELETE FROM releases WHERE id = ?').bind(id).run();
  return {deleted: true};
}
