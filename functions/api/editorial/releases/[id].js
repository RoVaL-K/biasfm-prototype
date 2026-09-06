import {failure, json, options} from '../../../_lib/http.js';
import {deleteEditorial} from '../../../_lib/editorial.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'DELETE') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try {
    return json(context.request, await deleteEditorial(context.request, context.env, context.params.id));
  } catch (error) {
    return failure(context.request, error);
  }
}
