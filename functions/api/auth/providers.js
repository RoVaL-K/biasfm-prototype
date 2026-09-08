import {failure, json, options} from '../../_lib/http.js';
import {providerStatus} from '../../_lib/oauth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try { return json(context.request, {providers: providerStatus(context.env)}); }
  catch (error) { return failure(context.request, error); }
}
