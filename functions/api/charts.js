import {failure, json, options, fetchJson, fail} from '../_lib/http.js';
import {readCache, writeCache} from '../_lib/cache.js';

const TAGS = new Set(['k-pop', 'k-indie', 'k-hiphop', 'k-rnb']);

async function fetchCharts(tag, key) {
  if (!TAGS.has(tag)) throw fail(400, 'Unbekanntes Chart-Genre.');
  if (!key) throw fail(503, 'Live-Charts sind noch nicht freigeschaltet. Dafür benötigt der Betreiber einen Last.fm-API-Zugang.');
  const params = new URLSearchParams({method: 'tag.gettoptracks', tag, limit: '100', api_key: key, format: 'json'});
  const result = await fetchJson(`https://ws.audioscrobbler.com/2.0/?${params}`, {headers: {Accept: 'application/json'}}, 15000);
  if (!result.response.ok || result.body?.error || !Array.isArray(result.body?.tracks?.track)) throw fail(502, 'Last.fm konnte die Charts nicht liefern. Bitte den API-Zugang prüfen.');
  return {
    tag,
    fetchedAt: new Date().toISOString(),
    sourceUrl: `https://www.last.fm/tag/${tag}/tracks`,
    items: result.body.tracks.track.map((track, index) => ({rank: index + 1, title: track.name, artist: track.artist?.name || '', url: `https://open.spotify.com/search/${encodeURIComponent(`${track.artist?.name || ''} ${track.name}`)}`}))
  };
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  const tag = new URL(context.request.url).searchParams.get('tag') || 'k-pop';
  const key = `charts:${tag}`;
  const cached = await readCache(context.env.CACHE, key);
  if (cached) return json(context.request, cached);
  try {
    const result = await fetchCharts(tag, context.env.LASTFM_API_KEY || '');
    await writeCache(context.env.CACHE, key, result, 900);
    return json(context.request, result);
  } catch (error) {
    return failure(context.request, error);
  }
}
