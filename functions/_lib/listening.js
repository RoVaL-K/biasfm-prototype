import {fail, fetchJson} from './http.js';
import {summarize} from './catalog.js';

const PERIODS = {
  '7day': 'Letzte 7 Tage',
  '1month': 'Letzter Monat',
  '3month': 'Letzte 3 Monate',
  '6month': 'Letzte 6 Monate',
  '12month': 'Letzte 12 Monate',
  overall: 'Gesamter Hörverlauf'
};

export async function getListening(provider, username, apiKey = '', period = '12month') {
  if (!Object.hasOwn(PERIODS, period)) throw fail(400, 'Ungültiger Zeitraum.');
  if (!['lastfm', 'listenbrainz'].includes(provider) || !/^[\p{L}\p{N}_ .-]{1,64}$/u.test(username)) {
    throw fail(400, 'Bitte einen gültigen Nutzernamen eingeben.');
  }

  async function request(url) {
    let result;
    try { result = await fetchJson(url, {headers: {Accept: 'application/json'}}, 15000); }
    catch { throw fail(502, 'Der Musikdienst ist gerade nicht erreichbar. Bitte erneut versuchen.'); }
    const {response, body} = result;
    if (!response.ok) throw fail(response.status === 404 ? 404 : 502, response.status === 404 ? 'Dieses öffentliche Profil wurde nicht gefunden.' : 'Der Musikdienst ist gerade nicht erreichbar. Bitte erneut versuchen.');
    if (body?.error) throw fail(502, body.error === 6 ? 'Dieses Last.fm-Profil wurde nicht gefunden.' : 'Last.fm konnte die Anfrage nicht verarbeiten.');
    return body;
  }

  if (provider === 'listenbrainz') {
    const body = await request(`https://api.listenbrainz.org/1/user/${encodeURIComponent(username)}/listens?count=1000`);
    const listens = body?.payload?.listens;
    if (!Array.isArray(listens)) throw fail(502, 'ListenBrainz hat keine lesbare Hörhistorie geliefert.');
    return summarize(listens.map(item => ({
      name: item.track_metadata?.artist_name,
      mbids: item.track_metadata?.additional_info?.artist_mbids || item.track_metadata?.mbid_mapping?.artist_mbids || [],
      plays: 1
    })), {provider, username, periodLabel: `Letzte ${listens.length} übermittelte Plays`, sample: true});
  }

  if (!apiKey) throw fail(503, 'Last.fm ist noch nicht freigeschaltet. Bitte nutze ListenBrainz; für Last.fm muss der Betreiber den API-Zugang hinterlegen.');
  let rows = [];
  let pages = 1;
  for (let page = 1; page <= pages; page += 1) {
    const params = new URLSearchParams({method: 'user.gettopartists', user: username, period, limit: '500', page: String(page), api_key: apiKey, format: 'json'});
    const body = await request(`https://ws.audioscrobbler.com/2.0/?${params}`);
    if (!body?.topartists || !Array.isArray(body.topartists.artist)) throw fail(502, 'Last.fm hat keine lesbare Künstlerliste geliefert.');
    pages = Number(body.topartists['@attr']?.totalPages || 1);
    if (pages > 20) throw fail(422, 'Dieses Profil ist für einen einzelnen Import zu groß. Bitte nutze ListenBrainz für die letzten Plays.');
    rows.push(...body.topartists.artist.map(artist => ({name: artist.name, mbids: artist.mbid ? [artist.mbid] : [], plays: Number(artist.playcount)})));
  }
  return summarize(rows, {provider, username, periodLabel: PERIODS[period], period, sample: false});
}
