import {failure, json, options} from '../../_lib/http.js';
import {listEditorial, saveEditorial} from '../../_lib/editorial.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  try {
    if (context.request.method === 'GET') return json(context.request, {items: await listEditorial(context.request, context.env)});
    if (context.request.method === 'POST') return json(context.request, await saveEditorial(context.request, context.env), 201);
    return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  } catch (error) {
    return failure(context.request, error);
  }
}
