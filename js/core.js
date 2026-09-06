(function(root) {
  const normalize = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const koreaDate = (now = new Date()) => new Date(now.getTime() + 9 * 3600000).toISOString().slice(0,10);
  function daily(now = new Date()) {
    const date = koreaDate(now);
    const dayNumber = Math.floor((Date.parse(date) - Date.UTC(2026,0,1))/86400000)+1;
    const song = BIAS_DATA.songs[((dayNumber % BIAS_DATA.songs.length) + BIAS_DATA.songs.length) % BIAS_DATA.songs.length];
    return {date,dayNumber,songId:song.id,hintYear:song.releaseYear,hintGenre:song.genres.join(' · '),hintProducer:song.credits.producers.join(', '),hintLyricHangul:song.title.length + ' Zeichen im Titel',hintLyricTranslation:song.artistName.length + ' Zeichen im Künstlernamen',initialBlur:24,coverPlaceholderGradient:song.coverGradient};
  }
  function correctGuess(guess,song) {
    const allowed = [song.title,song.hangulTitle,`${song.title} - ${song.artistName}`,`${song.hangulTitle} - ${song.artistName}`].filter(Boolean).map(normalize);
    return allowed.includes(normalize(guess));
  }
  function summarizeListening(rows, meta = {}) {
    const grouped = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      const name = String(row?.name || '').trim();
      const plays = Number(row?.plays);
      if (!name || !Number.isFinite(plays) || plays <= 0) continue;
      const mbids = Array.isArray(row.mbids) ? row.mbids.filter(Boolean) : [];
      const key = mbids.length ? mbids.slice().sort().join(',') : normalize(name);
      const current = grouped.get(key);
      grouped.set(key, {name, mbids, plays: (current?.plays || 0) + plays});
    }
    const artists = [...grouped.values()];
    const matchedArtists = new Map();
    const genres = new Map();
    let koreaScrobbles = 0;
    for (const row of artists) {
      const match = (BIAS_DATA.artists || []).find(artist => row.mbids.length
        ? row.mbids.includes(artist.mbid)
        : [artist.name, artist.hangul, artist.romanized, ...(artist.aliases || [])].filter(Boolean).some(alias => normalize(alias) === normalize(row.name)));
      if (!match) continue;
      koreaScrobbles += row.plays;
      matchedArtists.set(match.id, {id: match.id, name: match.name, plays: (matchedArtists.get(match.id)?.plays || 0) + row.plays});
      const genre = match.genres?.[0] || 'Weitere';
      genres.set(genre, (genres.get(genre) || 0) + row.plays);
    }
    const totalScrobbles = artists.reduce((sum, row) => sum + row.plays, 0);
    return {...meta, totalScrobbles, koreaScrobbles,
      koreaShare: totalScrobbles ? Math.round(koreaScrobbles / totalScrobbles * 1000) / 10 : 0,
      unmatchedScrobbles: totalScrobbles - koreaScrobbles,
      topArtists: [...matchedArtists.values()].sort((a,b) => b.plays - a.plays),
      topKoreanGenres: [...genres].sort((a,b) => b[1] - a[1]).map(([label,count]) => ({label, pct: koreaScrobbles ? Math.round(count / koreaScrobbles * 100) : 0})),
      fetchedAt: new Date().toISOString()};
  }
  const api = {normalize,koreaDate,daily,correctGuess,summarizeListening};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.biasCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
