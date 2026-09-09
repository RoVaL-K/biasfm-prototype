import {failure, json, options, fail} from '../_lib/http.js';
import {ensureSchema, requireAccount} from '../_lib/auth.js';
import {ingestListens, listListens, MAX_IMPORT_ROWS} from '../_lib/catalog-store.js';

async function body(request) {
  try { return await request.json(); } catch { throw fail(400, 'Ungültige JSON-Eingabe.'); }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (!['GET', 'POST'].includes(context.request.method)) return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try {
    const {row} = await requireAccount(context.request, context.env);
    await ensureSchema(context.env.DB);
    if (context.request.method === 'GET') {
      const limit = new URL(context.request.url).searchParams.get('limit') || '50';
      return json(context.request, {items: await listListens(context.env.DB, row.id, limit)});
    }
    const input = await body(context.request);
    if (!['lastfm', 'listenbrainz', 'manual'].includes(String(input.source || '').toLowerCase())) throw fail(400, 'Unbekannte Hörquelle.');
    if (!Array.isArray(input.rows) || input.rows.length > MAX_IMPORT_ROWS) throw fail(413, `Ein Import darf höchstens ${MAX_IMPORT_ROWS} Plays enthalten.`);
    const result = await ingestListens(context.env.DB, row.id, input.rows, {source: input.source, externalUser: input.externalUser, period: input.period});
    return json(context.request, result, 201);
  } catch (error) { return failure(context.request, error); }
}
