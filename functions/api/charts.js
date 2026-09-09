import {failure, json, options, fetchJson, fail} from '../_lib/http.js';
import {readCache, writeCache} from '../_lib/cache.js';
import {ensureSchema} from '../_lib/auth.js';
import {ensureCatalogSeed, resolveCatalog} from '../_lib/catalog-store.js';

const GENRE_ALIASES = {
  'K-Pop / Idol Pop': ['k-pop', 'kpop', 'k pop', 'korean pop', 'idol pop'],
  'K-R&B / Soul': ['k-rnb', 'krnb', 'k r&b', 'korean r&b', 'korean rnb', 'k-soul'],
  'K-Hiphop': ['k-hiphop', 'khiphop', 'k hip hop', 'korean hiphop', 'korean hip hop'],
  'Indie / Rock / Band': ['k-indie', 'k-indie rock', 'k-rock', 'korean indie', 'korean rock', 'band'],
  'Electronic / Club': ['k-electronic', 'k-house', 'k-club'],
  'Ballad / OST': ['k-ballad', 'ost', 'korean ost'],
  'Folk / Acoustic': ['k-folk', 'k-acoustic'],
  'Jazz / Experimental': ['k-jazz', 'experimental'],
  'Trot / Traditional': ['trot', 'k-trot']
};
// Last.fm tags are user supplied. Keep the provider vocabulary in one place
// and resolve every accepted spelling to a stable, cacheable tag before the
// request leaves our server.
const TAGS = new Set(Object.values(GENRE_ALIASES).flat());
const normalizeTag = value => String(value || '').toLocaleLowerCase('und').trim().replace(/\s+/g, ' ');
function providerTag(tag) {
  const normalized = normalizeTag(tag);
  for (const [label, aliases] of Object.entries(GENRE_ALIASES)) {
    if (normalizeTag(label) === normalized) return aliases[0];
    const match = aliases.find(alias => normalizeTag(alias) === normalized);
    if (match) return match;
  }
  return '';
}
function canonicalGenre(tag) {
  const normalized = normalizeTag(tag);
  return Object.entries(GENRE_ALIASES).find(([label, aliases]) => normalizeTag(label) === normalized || aliases.some(alias => normalizeTag(alias) === normalized))?.[0] || 'Weitere Signale';
}

function safeCover(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.href.slice(0, 1000) : '';
  } catch { return ''; }
}

async function matchChartTrack(db, track) {
  if (!db) return {canonical: null, coverUrl: ''};
  try {
    const canonical = await resolveCatalog(db, {
      rawArtist: track.artist?.name || '',
      rawTitle: track.name || '',
      rawArtistMbid: track.artist?.mbid || '',
      rawTrackMbid: track.mbid || ''
    }, {createStubs: false});
    const coverUrl = safeCover(canonical.track?.metadata?.coverUrl || canonical.album?.metadata?.coverUrl);
    return {canonical, coverUrl};
  } catch { return {canonical: null, coverUrl: ''}; }
}

async function fetchCharts(tag, key, db) {
  const resolvedTag = providerTag(tag);
  if (!resolvedTag || !TAGS.has(resolvedTag)) throw fail(400, 'Unbekanntes Chart-Genre.');
  if (!key) throw fail(503, 'Live-Charts sind noch nicht freigeschaltet. Dafür benötigt der Betreiber einen Last.fm-API-Zugang.');
  const params = new URLSearchParams({method: 'tag.gettoptracks', tag: resolvedTag, limit: '100', api_key: key, format: 'json'});
  const result = await fetchJson(`https://ws.audioscrobbler.com/2.0/?${params}`, {headers: {Accept: 'application/json'}}, 15000);
  if (!result.response.ok || result.body?.error || !Array.isArray(result.body?.tracks?.track)) throw fail(502, 'Last.fm konnte die Charts nicht liefern. Bitte den API-Zugang prüfen.');
  const items = await Promise.all(result.body.tracks.track.map(async (track, index) => {
    const match = await matchChartTrack(db, track);
    const coverUrl = match.coverUrl;
    return {
      rank: index + 1,
      title: track.name,
      artist: track.artist?.name || '',
      genre: canonicalGenre(resolvedTag),
      coverUrl,
      coverState: coverUrl ? 'matched' : 'neutral-fallback',
      coverSource: coverUrl ? 'catalog' : 'bias.fm',
      catalogTrackId: match.canonical?.track?.id || '',
      resolution: match.canonical?.status || 'unresolved',
      url: `https://open.spotify.com/search/${encodeURIComponent(`${track.artist?.name || ''} ${track.name}`)}`
    };
  }));
  return {
    tag: resolvedTag,
    requestedTag: String(tag || resolvedTag),
    fetchedAt: new Date().toISOString(),
    sourceUrl: `https://www.last.fm/tag/${resolvedTag}/tracks`,
    items
  };
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (context.request.method !== 'GET') return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  const requestedTag = new URL(context.request.url).searchParams.get('tag') || 'k-pop';
  const tag = providerTag(requestedTag);
  if (!tag) return failure(context.request, fail(400, 'Unbekanntes Chart-Genre.'));
  const key = `charts:${tag}`;
  const cached = await readCache(context.env.CACHE, key);
  if (cached) return json(context.request, cached);
  try {
    if (context.env.DB) {
      await ensureSchema(context.env.DB);
      await ensureCatalogSeed(context.env.DB);
    }
    const result = await fetchCharts(requestedTag, context.env.LASTFM_API_KEY || '', context.env.DB);
    await writeCache(context.env.CACHE, key, result, 900);
    return json(context.request, result);
  } catch (error) {
    return failure(context.request, error);
  }
}
