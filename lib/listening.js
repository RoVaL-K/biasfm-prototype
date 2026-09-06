const catalog = require('../js/data');
const normalize = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
function summarize(rows, meta) {
  const artists = new Map();
  for (const row of rows) {
    if (!row.name || !Number.isFinite(row.plays) || row.plays <= 0) continue;
    const key = row.mbids?.length ? row.mbids.slice().sort().join(',') : normalize(row.name);
    const existing = artists.get(key);
    artists.set(key, {name: row.name, mbids:row.mbids || [], plays: row.plays + (existing?.plays || 0)});
  }
  const all = [...artists.values()];
  let koreaScrobbles = 0;
  const genres = new Map();
  const topArtists = [];
  for (const row of all) {
    const match = catalog.artists.find(a => row.mbids.length ? row.mbids.includes(a.mbid) : [a.name, a.hangul, a.romanized, ...(a.aliases || [])].filter(Boolean).some(n => normalize(n) === normalize(row.name)));
    if (!match) continue;
    koreaScrobbles += row.plays;
    const known = topArtists.find(a => a.id === match.id);
    if (known) known.plays += row.plays; else topArtists.push({name:match.name,plays:row.plays,id:match.id});
    const genre = match.genres?.[0] || 'Weitere';
    genres.set(genre, (genres.get(genre) || 0) + row.plays);
  }
  const totalScrobbles = all.reduce((sum, a) => sum + a.plays, 0);
  return {...meta, totalScrobbles, koreaScrobbles,
    koreaShare: totalScrobbles ? Math.round(koreaScrobbles / totalScrobbles * 1000) / 10 : 0,
    topArtists: topArtists.sort((a,b) => b.plays-a.plays),
    topKoreanGenres: [...genres].map(([label, count]) => ({label, pct: Math.round(count / koreaScrobbles * 100)})),
    unmatchedScrobbles: totalScrobbles - koreaScrobbles, fetchedAt: new Date().toISOString()};
}
async function getListening(provider, username, fetcher = fetch, apiKey = process.env.LASTFM_API_KEY, period = '12month') {
  const periods={'7day':'Letzte 7 Tage','1month':'Letzter Monat','3month':'Letzte 3 Monate','6month':'Letzte 6 Monate','12month':'Letzte 12 Monate',overall:'Gesamter Hörverlauf'};
  if(!Object.hasOwn(periods,period))throw Object.assign(new Error('Ungültiger Zeitraum.'),{status:400});
  if (!['lastfm','listenbrainz'].includes(provider) || !/^[\p{L}\p{N}_ .-]{1,64}$/u.test(username)) {
    throw Object.assign(new Error('Bitte einen gültigen Nutzernamen eingeben.'), {status:400});
  }
  async function request(url) {
    const response = await fetcher(url, {signal: AbortSignal.timeout(15000), headers:{Accept:'application/json'}});
    if (!response.ok) throw Object.assign(new Error(response.status === 404 ? 'Dieses öffentliche Profil wurde nicht gefunden.' : 'Der Musikdienst ist gerade nicht erreichbar. Bitte erneut versuchen.'), {status:response.status === 404 ? 404 : 502});
    const body = await response.json();
    if (body.error) throw Object.assign(new Error(body.error === 6 ? 'Dieses Last.fm-Profil wurde nicht gefunden.' : 'Last.fm konnte die Anfrage nicht verarbeiten.'), {status:502});
    return body;
  }
  if (provider === 'listenbrainz') {
    const body = await request(`https://api.listenbrainz.org/1/user/${encodeURIComponent(username)}/listens?count=1000`);
    const listens = body.payload?.listens;
    if (!Array.isArray(listens)) throw new Error('Ungültige Antwort von ListenBrainz.');
    return summarize(listens.map(l => ({name:l.track_metadata?.artist_name, mbids:l.track_metadata?.additional_info?.artist_mbids || l.track_metadata?.mbid_mapping?.artist_mbids || [], plays:1})), {provider,username,periodLabel:`Letzte ${listens.length} übermittelte Plays`, sample:true});
  }
  if (!apiKey) throw Object.assign(new Error('Last.fm ist noch nicht freigeschaltet. Bitte nutze ListenBrainz; für Last.fm muss der Betreiber den API-Zugang hinterlegen.'), {status:503});
  let rows = [], pages = 1;
  for (let page=1; page<=pages; page++) {
    const params = new URLSearchParams({method:'user.gettopartists',user:username,period,limit:'500',page:String(page),api_key:apiKey,format:'json'});
    const body = await request(`https://ws.audioscrobbler.com/2.0/?${params}`);
    if (!body.topartists || !Array.isArray(body.topartists.artist)) throw new Error('Ungültige Antwort von Last.fm.');
    const totalPages = Number(body.topartists['@attr']?.totalPages || 1);
    if (totalPages > 20) throw Object.assign(new Error('Dieses Profil ist für einen einzelnen Import zu groß. Bitte nutze ListenBrainz für die letzten Plays.'), {status:422});
    pages = totalPages;
    rows.push(...body.topartists.artist.map(a => ({name:a.name,mbids:a.mbid?[a.mbid]:[], plays:Number(a.playcount)})));
  }
  return summarize(rows, {provider,username,periodLabel:periods[period],period,sample:false});
}
module.exports = {summarize, getListening};
