import {failure, json, options} from '../_lib/http.js';
import {moderation} from '../_lib/v3.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'POST') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try { return json(context.request, await moderation(context.request, context.env), 201); }
  catch (error) { return failure(context.request, error); }
}
