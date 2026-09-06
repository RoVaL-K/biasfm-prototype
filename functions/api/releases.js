import {failure, json, options} from '../_lib/http.js';
import {readCache, writeCache} from '../_lib/cache.js';
import {fetchReleases} from '../_lib/releases.js';
import {readPublished} from '../_lib/editorial.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  let remote = await readCache(context.env.CACHE, 'releases:musicbrainz:v1');
  let warning = '';
  if (!remote) {
    try {
      remote = await fetchReleases();
      await writeCache(context.env.CACHE, 'releases:musicbrainz:v1', remote, 1800);
    } catch (error) {
      warning = error.message;
      remote = {items: [], fetchedAt: null, sourceUrl: 'https://musicbrainz.org'};
    }
  }
  try {
    const publicRows = await readPublished(context.env.DB);
    return json(context.request, {...remote, items: [...publicRows, ...(remote.items || [])], warning, stale: Boolean(warning)});
  } catch (error) {
    return failure(context.request, error);
  }
}
