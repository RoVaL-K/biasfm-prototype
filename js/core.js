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
  const api = {normalize,koreaDate,daily,correctGuess};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.biasCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
