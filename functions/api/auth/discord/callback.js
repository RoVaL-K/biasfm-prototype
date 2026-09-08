import {failure, options} from '../../../_lib/http.js';
import {callback, redirectResponse} from '../../../_lib/oauth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return new Response('Methode nicht erlaubt.', {status: 405});
  try { return redirectResponse(await callback(context.request, context.env, 'discord')); }
  catch (error) { return failure(context.request, error); }
}
