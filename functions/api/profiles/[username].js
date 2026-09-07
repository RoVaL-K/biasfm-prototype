import {failure, json, options} from '../../_lib/http.js';
import {publicProfile} from '../../_lib/social.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try { return json(context.request, await publicProfile(context.request, context.env, context.params.username)); }
  catch (error) { return failure(context.request, error); }
}
