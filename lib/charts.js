async function fetchCharts(tag,fetcher=fetch,key=process.env.LASTFM_API_KEY) {
  if(!['k-pop','k-indie','k-hiphop','k-rnb'].includes(tag)) throw Object.assign(new Error('Unbekanntes Chart-Genre.'),{status:400});
  if(!key)throw Object.assign(new Error('Live-Charts sind noch nicht freigeschaltet. Dafür benötigt der Betreiber einen Last.fm-API-Zugang.'),{status:503});
  const response=await fetcher('https://ws.audioscrobbler.com/2.0/?'+new URLSearchParams({method:'tag.gettoptracks',tag,limit:'100',api_key:key,format:'json'}),{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Object.assign(new Error('Die Last.fm-Charts sind gerade nicht erreichbar.'),{status:502});
  const data=await response.json();if(data.error || !Array.isArray(data.tracks?.track))throw Object.assign(new Error('Last.fm konnte die Charts nicht liefern. Bitte den API-Zugang prüfen.'),{status:502});
  return {tag,fetchedAt:new Date().toISOString(),sourceUrl:'https://www.last.fm/tag/'+tag+'/tracks',items:data.tracks.track.map((t,i)=>({rank:i+1,title:t.name,artist:t.artist?.name || '',url:'https://open.spotify.com/search/'+encodeURIComponent(`${t.artist?.name || ''} ${t.name}`)}))};
}
module.exports={fetchCharts};
