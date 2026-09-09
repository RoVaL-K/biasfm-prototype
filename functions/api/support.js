import {failure, json, options} from '../_lib/http.js';
import {support} from '../_lib/v3.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  try {
    if (!['GET', 'POST'].includes(context.request.method)) return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
    return json(context.request, await support(context.request, context.env), context.request.method === 'POST' ? 201 : 200);
  } catch (error) { return failure(context.request, error); }
}
