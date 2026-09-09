import {failure, json, options} from '../../_lib/http.js';
import {followAccount, listAccountFollows} from '../../_lib/social.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  try {
    if (context.request.method === 'GET') return json(context.request, await listAccountFollows(context.request, context.env));
    if (context.request.method === 'POST') return json(context.request, await followAccount(context.request, context.env, true), 201);
    if (context.request.method === 'DELETE') return json(context.request, await followAccount(context.request, context.env, false));
    return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  } catch (error) { return failure(context.request, error); }
}
