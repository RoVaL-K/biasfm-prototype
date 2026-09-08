import {failure, options} from '../../../_lib/http.js';
import {redirectResponse, start} from '../../../_lib/oauth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return new Response('Methode nicht erlaubt.', {status: 405});
  try { return redirectResponse(await start(context.request, context.env, 'google')); }
  catch (error) { return failure(context.request, error); }
}
