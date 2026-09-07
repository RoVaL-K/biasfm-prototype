import {failure, json, options} from '../_lib/http.js';
import {listNotifications, markNotification} from '../_lib/social.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  try {
    if (context.request.method === 'GET') return json(context.request, await listNotifications(context.request, context.env));
    if (context.request.method === 'POST') return json(context.request, await markNotification(context.request, context.env, context.request.url.includes('all=true')));
    return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  } catch (error) { return failure(context.request, error); }
}
