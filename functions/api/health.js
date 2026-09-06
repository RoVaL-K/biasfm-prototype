import {json, options} from '../_lib/http.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (!['GET', 'HEAD'].includes(context.request.method)) return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  return json(context.request, {status: 'ok', runtime: 'cloudflare-pages-functions', fetchedAt: new Date().toISOString()});
}
