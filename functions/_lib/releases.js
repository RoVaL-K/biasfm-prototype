import {fail, fetchJson} from './http.js';
import {ARTISTS} from './catalog.js';

export async function fetchReleases() {
  const now = new Date();
  const from = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);
  const names = ARTISTS.filter(artist => artist.mbid).map(artist => `arid:${artist.mbid}`).join(' OR ');
  const query = `(${names}) AND firstreleasedate:[${from} TO ${to}]`;
  let result;
  try {
    result = await fetchJson(`https://musicbrainz.org/ws/2/release-group/?${new URLSearchParams({query, fmt: 'json', limit: '100'})}`, {
      headers: {'User-Agent': 'bias-fm/1.2 (Korean music discovery)', Accept: 'application/json'}
    }, 20000);
  } catch {
    throw fail(502, 'MusicBrainz ist gerade nicht erreichbar. Deine eigenen Termine bleiben verfügbar.');
  }
  if (!result.response.ok) throw fail(502, 'MusicBrainz ist gerade nicht erreichbar. Deine eigenen Termine bleiben verfügbar.');
  const groups = result.body?.['release-groups'];
  if (!Array.isArray(groups)) throw fail(502, 'MusicBrainz hat keine lesbare Release-Liste geliefert.');
  const items = groups.flatMap(release => {
    const date = release['first-release-date'];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date < from || date > to || !/^[a-f0-9-]{36}$/i.test(release.id)) return [];
    const credits = release['artist-credit'] || [];
    const artist = ARTISTS.find(candidate => credits.some(credit => credit.artist?.id === candidate.mbid));
    if (!artist) return [];
    const credited = credits.map(credit => credit.artist?.name || credit.name).filter(Boolean);
    return [{
      id: `mb-${release.id}`,
      act: credited.join(' & '),
      actHangul: artist.hangul,
      title: release.title,
      date,
      type: release['primary-type'] || 'Release',
      genres: artist.genres,
      sourceName: 'MusicBrainz',
      sourceUrl: `https://musicbrainz.org/release-group/${release.id}`,
      description: 'Veröffentlichungsdatum aus MusicBrainz. Angaben werden dort gemeinschaftlich gepflegt.',
      status: 'MusicBrainz-Eintrag',
      pipelineStep: date <= now.toISOString().slice(0, 10) ? 4 : 1
    }];
  });
  return {items, from, to, fetchedAt: now.toISOString(), limited: Number(result.body?.count) > 100, sourceUrl: 'https://musicbrainz.org'};
}
