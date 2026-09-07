import {json, options} from '../_lib/http.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  const env = context.env || {};
  return json(context.request, {
    spotify: Boolean(env.SPOTIFY_CLIENT_ID),
    lastfm: Boolean(env.LASTFM_API_KEY),
    editorial: Boolean(env.EDITORIAL_TOKEN && String(env.EDITORIAL_TOKEN).length >= 24),
    accounts: Boolean(env.DB && env.SESSIONS),
    operator: {name: env.OPERATOR_NAME || '', address: env.OPERATOR_ADDRESS || '', email: env.OPERATOR_EMAIL || ''},
    runtime: 'cloudflare-pages-functions'
  });
}
