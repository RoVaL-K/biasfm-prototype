const catalog=require('../js/data');
const identities=require('./artist-identities.json').artists;
const normalize=s=>String(s || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
async function fetchReleases(fetcher=fetch,now=new Date()) {
  const from=new Date(now.getTime()-90*86400000).toISOString().slice(0,10),to=new Date(now.getTime()+90*86400000).toISOString().slice(0,10);
  const names=Object.values(identities).map(id=>`arid:${id}`).join(' OR ');
  const query=`(${names}) AND firstreleasedate:[${from} TO ${to}]`;
  const response=await fetcher('https://musicbrainz.org/ws/2/release-group/?'+new URLSearchParams({query,fmt:'json',limit:'100'}),{headers:{'User-Agent':'bias-fm/1.1 (Korean music discovery)','Accept':'application/json'},signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw Object.assign(new Error('MusicBrainz ist gerade nicht erreichbar. Deine eigenen Termine bleiben verfügbar.'),{status:502});
  const data=await response.json();
  if(!Array.isArray(data['release-groups'])) throw Object.assign(new Error('MusicBrainz hat keine lesbare Release-Liste geliefert.'),{status:502});
  const items=data['release-groups'].flatMap(r=>{
    const date=r['first-release-date'];
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date<from || date>to || !/^[a-f0-9-]{36}$/i.test(r.id)) return [];
    const credited=(r['artist-credit'] || []).map(c=>c.artist?.name || c.name);
    const artist=catalog.artists.find(a=>(r['artist-credit'] || []).some(c=>c.artist?.id===identities[a.id]));
    if(!artist)return [];
    return [{id:'mb-'+r.id,act:credited.filter(Boolean).join(' & '),actHangul:artist.hangul,title:r.title,date,type:r['primary-type'] || 'Release',genres:artist.genres,sourceName:'MusicBrainz',sourceUrl:`https://musicbrainz.org/release-group/${r.id}`,description:'Veröffentlichungsdatum aus MusicBrainz. Angaben werden dort gemeinschaftlich gepflegt.',status:'MusicBrainz-Eintrag',pipelineStep:date<=now.toISOString().slice(0,10)?4:1}];
  });
  return {items,from,to,fetchedAt:now.toISOString(),limited:Number(data.count)>100,sourceUrl:'https://musicbrainz.org'};
}
module.exports={fetchReleases};
