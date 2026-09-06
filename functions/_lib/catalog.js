import {ARTISTS} from './catalog-data.js';

const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function findArtist(row) {
  const mbids = Array.isArray(row?.mbids) ? row.mbids : [];
  return ARTISTS.find(artist => mbids.length && artist.mbid && mbids.includes(artist.mbid)) ||
    ARTISTS.find(artist => [artist.name, artist.hangul, artist.romanized, ...(artist.aliases || [])]
      .filter(Boolean).some(name => normalize(name) === normalize(row?.name)));
}

export function summarize(rows, meta = {}) {
  const artists = new Map();
  for (const row of rows || []) {
    const plays = Number(row?.plays);
    if (!row?.name || !Number.isFinite(plays) || plays <= 0) continue;
    const mbids = Array.isArray(row.mbids) ? row.mbids : [];
    const key = mbids.length ? mbids.slice().sort().join(',') : normalize(row.name);
    const previous = artists.get(key);
    artists.set(key, {
      name: String(row.name),
      mbids,
      plays: plays + (previous?.plays || 0)
    });
  }

  let koreaScrobbles = 0;
  const genres = new Map();
  const topArtists = new Map();
  for (const row of artists.values()) {
    const match = findArtist(row);
    if (!match) continue;
    koreaScrobbles += row.plays;
    const current = topArtists.get(match.id) || {name: match.name, plays: 0, id: match.id};
    current.plays += row.plays;
    topArtists.set(match.id, current);
    const genre = match.genres?.[0] || 'Weitere';
    genres.set(genre, (genres.get(genre) || 0) + row.plays);
  }

  const totalScrobbles = [...artists.values()].reduce((sum, row) => sum + row.plays, 0);
  return {
    ...meta,
    totalScrobbles,
    koreaScrobbles,
    koreaShare: totalScrobbles ? Math.round(koreaScrobbles / totalScrobbles * 1000) / 10 : 0,
    topArtists: [...topArtists.values()].sort((a, b) => b.plays - a.plays),
    topKoreanGenres: [...genres].map(([label, count]) => ({label, pct: koreaScrobbles ? Math.round(count / koreaScrobbles * 100) : 0})),
    unmatchedScrobbles: totalScrobbles - koreaScrobbles,
    fetchedAt: new Date().toISOString()
  };
}

export {ARTISTS, normalize};
