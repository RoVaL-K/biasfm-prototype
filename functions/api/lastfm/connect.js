import {failure, options} from '../../_lib/http.js';
import {start} from '../../_lib/lastfm.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return new Response('Methode nicht erlaubt.', {status: 405});
  try {
    const result = await start(context.request, context.env);
    const headers = new Headers({'Location': result.location, 'Cache-Control': 'no-store'});
    for (const [name, value] of Object.entries(result.headers || {})) headers.append(name, value);
    return new Response(null, {status: 303, headers});
  } catch (error) { return failure(context.request, error); }
}
