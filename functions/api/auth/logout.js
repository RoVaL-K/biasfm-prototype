import {failure, json, options} from '../../_lib/http.js';
import {logout} from '../../_lib/auth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'POST') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try {
    const result = await logout(context.request, context.env);
    return json(context.request, {authenticated: false}, 200, result.headers);
  } catch (error) { return failure(context.request, error); }
}
