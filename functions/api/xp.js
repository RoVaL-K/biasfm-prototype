import {failure, json, options} from '../_lib/http.js';
import {xp} from '../_lib/v3.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (!['GET', 'POST'].includes(context.request.method)) return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try { return json(context.request, await xp(context.request, context.env)); }
  catch (error) { return failure(context.request, error); }
}
