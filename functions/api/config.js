import {json, options} from '../_lib/http.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  const env = context.env || {};
  return json(context.request, {
    spotify: Boolean(env.SPOTIFY_CLIENT_ID),
    lastfm: Boolean(env.LASTFM_API_KEY),
    lastfmOAuth: Boolean(env.LASTFM_API_KEY && env.LASTFM_API_SECRET && env.DB && env.SESSIONS),
    editorial: Boolean(env.EDITORIAL_TOKEN && String(env.EDITORIAL_TOKEN).length >= 24),
    accounts: Boolean(env.DB && env.SESSIONS),
    oauth: {google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.SESSIONS), discord: Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && env.SESSIONS)},
    v3: {community: Boolean(env.DB && env.SESSIONS), collections: Boolean(env.DB && env.SESSIONS), reviews: Boolean(env.DB && env.SESSIONS), xp: Boolean(env.DB && env.SESSIONS), supportInterest: Boolean(env.DB && env.SESSIONS), emailVerification: Boolean(env.DB && env.SESSIONS && env.RESEND_API_KEY && env.RESEND_FROM_EMAIL), payments: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET)},
    operator: {name: env.OPERATOR_NAME || '', address: env.OPERATOR_ADDRESS || '', email: env.OPERATOR_EMAIL || ''},
    runtime: 'cloudflare-pages-functions'
  });
}
