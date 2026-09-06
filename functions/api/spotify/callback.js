import {callback} from '../../_lib/spotify.js';
import {failure, options} from '../../_lib/http.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return new Response('Methode nicht erlaubt.', {status: 405});
  try {
    const result = await callback(context.request, context.env);
    return new Response(null, {status: 303, headers: {'Location': result.location, 'Cache-Control': 'no-store', ...result.headers}});
  } catch (error) {
    return failure(context.request, error);
  }
}
