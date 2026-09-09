import {failure, json, options, fail} from '../../_lib/http.js';
import {ensureSchema} from '../../_lib/auth.js';
import {mergeCatalogEntity} from '../../_lib/catalog-store.js';

function authorized(request, env) {
  const expected = String(env.EDITORIAL_TOKEN || '');
  const actual = String(request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  return expected.length >= 24 && actual === expected;
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'POST') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try {
    if (!authorized(context.request, context.env)) throw fail(401, 'Für Katalog-Zusammenführungen ist eine Betreiberfreigabe erforderlich.');
    const input = await context.request.json().catch(() => { throw fail(400, 'Ungültige JSON-Eingabe.'); });
    await ensureSchema(context.env.DB);
    return json(context.request, await mergeCatalogEntity(context.env.DB, input.entityType, String(input.fromId || ''), String(input.toId || '')));
  } catch (error) { return failure(context.request, error); }
}
