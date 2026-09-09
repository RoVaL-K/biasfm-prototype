import {failure, json, options, fail} from '../../_lib/http.js';
import {ensureSchema} from '../../_lib/auth.js';
import {resolveCatalog} from '../../_lib/catalog-store.js';

async function inputFrom(request) {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    return {
      rawArtist: url.searchParams.get('artist') || '',
      rawTitle: url.searchParams.get('title') || '',
      rawAlbum: url.searchParams.get('album') || '',
      rawArtistMbid: url.searchParams.get('artist_mbid') || '',
      rawAlbumMbid: url.searchParams.get('album_mbid') || '',
      rawTrackMbid: url.searchParams.get('track_mbid') || ''
    };
  }
  try { return await request.json(); } catch { throw fail(400, 'Ungültige JSON-Eingabe.'); }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return options(context.request);
  if (!['GET', 'POST'].includes(context.request.method)) return json(context.request, {error: 'Methode nicht erlaubt.'}, 405);
  try {
    const input = await inputFrom(context.request);
    if (!input.rawArtist && !input.rawArtistMbid && !input.rawTrackMbid) throw fail(400, 'Bitte einen Artist oder eine MusicBrainz-ID angeben.');
    await ensureSchema(context.env.DB);
    return json(context.request, {canonical: await resolveCatalog(context.env.DB, input, {createStubs: false})});
  } catch (error) { return failure(context.request, error); }
}
