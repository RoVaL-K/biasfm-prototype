import {failure, json, options} from '../_lib/http.js';
import {getListening} from '../_lib/listening.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  const url = new URL(context.request.url);
  try {
    const result = await getListening(url.searchParams.get('provider') || '', url.searchParams.get('username') || '', context.env.LASTFM_API_KEY || '', url.searchParams.get('period') || '12month');
    return json(context.request, result);
  } catch (error) {
    return failure(context.request, error);
  }
}
