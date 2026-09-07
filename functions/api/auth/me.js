import {failure, json, options} from '../../_lib/http.js';
import {me} from '../../_lib/auth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try { return json(context.request, await me(context.request, context.env)); }
  catch (error) { return failure(context.request, error); }
}
