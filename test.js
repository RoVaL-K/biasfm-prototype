const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const {createServer} = require('./server');
const {summarize,getListening} = require('./lib/listening');
global.BIAS_DATA = require('./js/data');
const core = require('./js/core');
function app(saved={}) {
  const html=fs.readFileSync('index.html','utf8');
  const dom=new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g,''), {url:'http://localhost/',runScripts:'dangerously',pretendToBeVisual:true});
  const w=dom.window;
  w.addEventListener('error',e=>{throw e.error;});
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.TextEncoder=TextEncoder;w.AbortController=AbortController;
  for(const [key,value] of Object.entries(saved)) w.localStorage.setItem(key,value);
  for(const match of html.matchAll(/<script src="([^"]+)"/g)) {const script=w.document.createElement('script');script.textContent=fs.readFileSync(match[1],'utf8');new (require('node:vm').Script)(script.textContent);w.document.body.appendChild(script);}
  // Keep the parser covered as a migration fixture without shipping a
  // Spotify-history import flow in the production page.
  const spotifyImport=w.document.createElement('script');spotifyImport.textContent=fs.readFileSync('js/spotify-import.js','utf8');w.document.body.appendChild(spotifyImport);
  w.biasApp.init();
  return {w,close:()=>w.close()};
}
test('Korean day changes exactly at midnight KST; answers require a complete title',()=>{
  assert.equal(core.koreaDate(new Date('2026-09-06T14:59:59Z')),'2026-09-06');
  assert.equal(core.koreaDate(new Date('2026-09-06T15:00:00Z')),'2026-09-07');
  assert.notEqual(core.daily(new Date('2026-09-06T14:59:59Z')).songId,core.daily(new Date('2026-09-06T15:00:00Z')).songId);
  assert.equal(core.correctGuess('not Ditto at all',BIAS_DATA.songs[0]),false);
  assert.equal(core.correctGuess('Ditto - NewJeans',BIAS_DATA.songs[0]),true);
});
test('Listening summaries use plays and leave unmatched artists unclassified',()=>{
  const r=summarize([{name:'NewJeans',plays:7},{name:'뉴진스',plays:3},{name:'Unknown',plays:90}],{});
  assert.equal(r.totalScrobbles,100);assert.equal(r.koreaScrobbles,10);assert.equal(r.koreaShare,10);assert.equal(r.unmatchedScrobbles,90);
  assert.equal(summarize([],{}).koreaShare,0);
  const identities=summarize([{name:'BIBI',mbids:['another-artist-id'],plays:90},{name:'비비',mbids:['21c93d2d-dc10-4f8f-ae91-7285eff37c2f'],plays:10}],{});
  assert.equal(identities.koreaScrobbles,10);assert.equal(identities.unmatchedScrobbles,90);
});
test('Provider imports parse real schemas and reject failures or missing credentials',async()=>{
  const result=await getListening('listenbrainz','tester',async()=>({ok:true,json:async()=>({payload:{listens:[{track_metadata:{artist_name:'NewJeans'}}]}})}));
  assert.equal(result.koreaShare,100);assert.equal(result.totalScrobbles,1);
  await assert.rejects(getListening('lastfm','tester',undefined,''),/nicht freigeschaltet/);
  await assert.rejects(getListening('bad','tester'),/gültigen/);
  await assert.rejects(getListening('listenbrainz','tester',async()=>({ok:false,status:404})),/nicht gefunden/);
  let calls=0;
  const last=await getListening('lastfm','tester',async()=>({ok:true,json:async()=>{calls++;return {topartists:{artist:[{name:'NewJeans',playcount:'5'}],'@attr':{totalPages:'2'}}};}}),'test-key');
  assert.equal(calls,2);assert.equal(last.totalScrobbles,10);
});
test('HTTP server serves the actual app and protects private files and malformed paths',async()=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  try {
    for(const p of ['/','/js/core.js','/css/views.css']) assert.equal((await fetch(origin+p)).status,200,p);
    for(const p of ['/server.js','/.git/config','/package.json','/lib/listening.js','/.env','/api/nope']) assert.equal((await fetch(origin+p)).status,404,p);
    assert.equal((await fetch(origin+'/%E0%A4%A')).status,400);
    assert.equal((await fetch(origin+'/',{method:'POST'})).status,405);
    assert.equal((await fetch(origin+'/api/listening?provider=no&username=test')).status,400);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('Every public and personal view renders without a player and navigation renders once',()=>{
  const {w,close}=app();try {
    for(const route of ['home','charts','kalender','catalog','game','stats','profile','settings','saved','curation','legal','admin']) {w.biasApp.navigateTo(route);assert.ok(w.document.querySelector('#main-content h1'),route);}
    assert.equal(w.document.querySelector('#bottom-dock'),null);
    assert.equal(w.document.querySelectorAll('.desktop-nav a').length,4);
    assert.equal(w.document.querySelector('#dock-total-time'),null);
    w.biasApp.navigateTo('home');assert.ok(!w.document.querySelector('#main-content').textContent.includes('78%'));
    let count=0;const render=w.biasStatsView.render.bind(w.biasStatsView);w.biasStatsView.render=c=>{count++;render(c);};w.biasApp.navigateTo('stats');assert.equal(count,1);
    w.biasApp.loadTrackToDock('track-ditto');assert.ok(w.document.querySelector('[role=dialog]'));
  }finally{close();}
});
test('Favorites, custom aliases, riddle answers and profile survive a reload',()=>{
  const a=app();let saved;
  try {
    a.w.biasApp.toggleLike('track-ditto');
    a.w.biasStore.addCurationAlias({artistId:'newjeans',alias:'my special nickname'});
    a.w.biasApp.navigateTo('game');a.w.biasGameView.submitGuess(a.w.biasGameView.targetSong.title);
    assert.equal(a.w.biasStore.riddleState.status,'won');
    saved=Object.fromEntries(Object.keys(a.w.localStorage).map(k=>[k,a.w.localStorage.getItem(k)]));
  }finally{a.close();}
  const b=app(saved);try {
    assert.ok(b.w.biasApp.likedSongs.has('track-ditto'));
    assert.equal(b.w.biasSearch.search('my special nickname')[0].id,'newjeans');
    b.w.biasApp.navigateTo('game');assert.equal(b.w.document.querySelector('#riddle-form'),null);
    b.w.biasApp.navigateTo('profile');assert.ok(b.w.document.querySelector('[data-favorite-remove="track-ditto"]'));
  }finally{b.close();}
});
test('Calendar create, update, genre filtering, escaped iCal and delete',()=>{
  const {w,close}=app();try {
    w.biasApp.navigateTo('curation');
    const fields={'cb-act':'Test & Artist','cb-title':'Release, One; 새','cb-date':'2099-01-02','cb-genres':'Hiphop','cb-desc':'First line\nBEGIN:VEVENT'};
    for(const [id,value] of Object.entries(fields)) w.document.getElementById(id).value=value;
    w.biasCurationView.handleSubmitComeback({preventDefault(){}});
    const cb=w.biasStore.customComebacks[0];assert.ok(w.biasStore.isTracked(cb.id));
    w.biasCurationView.editComeback(cb.id);w.document.getElementById('cb-title').value='Updated';w.biasCurationView.handleSubmitComeback({preventDefault(){}});assert.equal(w.biasStore.customComebacks.length,1);
    w.biasCalendarView.activeGenre='R&B';assert.equal(w.biasCalendarView.filteredComebacks().length,1);
    const ics=w.biasCalendarView.generateIcsContent([cb]);assert.ok(ics.includes('Release\\, One\\; 새'));assert.ok(ics.includes('First line\\nBEGIN:VEVENT'));assert.equal(ics.match(/\r\nBEGIN:VEVENT/g).length,1);
    for(const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line)<=75);
    w.biasCurationView.deleteComeback(cb.id);w.document.getElementById('confirm-delete').click();assert.equal(w.biasStore.customComebacks.length,0);assert.equal(w.biasStore.isTracked(cb.id),false);
  }finally{close();}
});
test('Modal switching keeps the new dialog; user text is not rendered as HTML',async()=>{
  const {w,close}=app();try {
    w.biasModals.openSongModal('track-ditto');w.biasModals.openArtistModal('newjeans');
    await new Promise(r=>setTimeout(r,230));assert.ok(w.biasModals.activeModal?.isConnected);assert.equal(w.document.querySelectorAll('.modal-backdrop').length,1);
    w.biasApp.showToast('<img src=x onerror=alert(1)>');assert.equal(w.document.querySelector('#global-toast img'),null);
    w.biasModals.closeCurrentModal();assert.equal(w.document.body.style.overflow,'');
  }finally{close();}
});
test('Stats render imported figures and preserve prior results when refresh fails',async()=>{
  const {w,close}=app();try {
    w.biasApp.navigateTo('stats');assert.equal(w.document.querySelector('#share-stats'),null);
    const result=summarize([{name:'NewJeans',plays:1},{name:'Unknown',plays:9}],{username:'tester',provider:'listenbrainz',periodLabel:'Letzte 10 Plays'});
    w.fetch=async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>result});
    w.document.getElementById('listening-username').value='tester';await w.biasStatsView.handleConnect({preventDefault(){}});
    assert.equal(w.biasStatsView.result.koreaShare,10);assert.ok(w.document.querySelector('#share-stats'));
    w.fetch=async()=>{throw new Error('Offline');};await w.biasStatsView.handleConnect({preventDefault(){}});
    assert.equal(w.document.querySelector('[role="alert"]').textContent,'Offline');assert.equal(w.biasStatsView.result.totalScrobbles,10);
    w.biasStatsView.openShareCard();assert.ok(w.document.querySelector('#download-card-btn'));
  }finally{close();}
});
test('Corrupt saved types recover safely',()=>{
  const {w,close}=app({biasfm_profile:'null',biasfm_tracked_comebacks:'{}',biasfm_custom_comebacks:'null'});try{w.biasApp.navigateTo('profile');assert.ok(w.document.querySelector('.profile-display h2'));}finally{close();}
});
test('A full browser store cannot report an unsaved profile or riddle as saved',()=>{
  const {w,close}=app();try {
    const username=w.biasStore.profile.username;
    const status=w.biasStore.riddleState.status;
    w.Storage.prototype.setItem=()=>{throw new Error('Quota exceeded');};
    assert.throws(()=>w.biasStore.updateProfile({username:'Not saved'}),/nicht gespeichert/);
    assert.equal(w.biasStore.profile.username,username);
    assert.throws(()=>w.biasStore.updateRiddleState({status:'won'}),/nicht gespeichert/);
    assert.equal(w.biasStore.riddleState.status,status);
  }finally{close();}
});
test('Spotify link validation and playlist persistence work without OAuth credentials',()=>{
  const {w,close}=app();try{
    assert.equal(w.biasApi.spotifyUrl('https://open.spotify.com/user/test?si=x','user'),'https://open.spotify.com/user/test');
    assert.throws(()=>w.biasApi.spotifyUrl('https://open.spotify.com.evil.test/user/x','user'));
    assert.throws(()=>w.biasApi.spotifyUrl('javascript:alert(1)','user'));
    assert.throws(()=>w.biasApi.spotifyUrl('https://open.spotify.com/playlist/not-an-id','playlist'));
    w.biasApp.navigateTo('settings');w.document.querySelector('#spotify-profile-url').value='https://open.spotify.com/user/test';w.document.querySelector('#spotify-link-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
    assert.equal(w.biasStore.profile.spotifyProfileUrl,'https://open.spotify.com/user/test');
    w.document.querySelector('#playlist-name').value='<b>My music</b>';w.document.querySelector('#playlist-url').value='https://open.spotify.com/playlist/1234567890123456789012';w.document.querySelector('#playlist-link-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
    assert.equal(w.biasStore.profile.spotifyPlaylists.length,1);assert.equal(w.document.querySelector('.playlist-card b').textContent,'<b>My music</b>');
    w.document.querySelector('[data-remove-playlist]').click();assert.equal(w.biasStore.profile.spotifyPlaylists.length,0);
  }finally{close();}
});
test('Spotify PKCE checks state, keeps tokens server-side, pages playlists and disconnects securely',async()=>{
  const {createSpotify}=require('./lib/spotify');let refreshes=0;
  const spotify=createSpotify({clientId:'test-client',origin:'http://127.0.0.1:3000',fetcher:async(url,opts)=>{
    if(url.includes('/api/token')){if(opts.body.get('grant_type')==='refresh_token')refreshes++;return {ok:true,json:async()=>({access_token:'private-access',refresh_token:'private-refresh',expires_in:refreshes?3600:0})};}
    if(url.endsWith('/me'))return {ok:true,json:async()=>({id:'tester',display_name:'Tester'})};
    if(url.endsWith('/me/player'))return {ok:true,status:204,json:async()=>{throw Error('No content')}};
    if(url.includes('/me/player/recently-played'))return {ok:true,status:200,json:async()=>({items:[{played_at:'2026-09-08T10:00:00.000Z',track:{id:'track-1',name:'Afterglow',artists:[{name:'Tester'}],album:{name:'Night Drive',images:[{url:'https://i.scdn.co/image/cover'}]},duration_ms:180000,external_urls:{spotify:'https://open.spotify.com/track/track-1'}}}]})};
    if(url.includes('/me/playlists'))return {ok:true,json:async()=>({items:[{id:'abc',name:'My playlist',owner:{display_name:'Tester'},items:{total:3},images:[]}],next:'next-page',total:21})};
    throw Error('Unexpected URL');
  }});
  async function request(path,cookie='',method='GET',origin='http://127.0.0.1:3000'){
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(status,h){this.status=status;Object.assign(this.headers,h);},end(){}};
    await spotify.handle({method,headers:{cookie,host:'127.0.0.1:3000',origin}},res,new URL(path,'http://127.0.0.1:3000'),(status,text)=>{res.status=status;res.body=JSON.parse(text);});return res;
  }
  const start=await request('/api/spotify/connect');const initialCookie=start.headers['Set-Cookie'].split(';')[0];const auth=new URL(start.headers.Location);
  assert.equal(auth.searchParams.get('code_challenge_method'),'S256');assert.ok(auth.searchParams.get('code_challenge').length>=43);assert.match(auth.searchParams.get('scope'),/user-read-currently-playing/);assert.match(auth.searchParams.get('scope'),/user-read-recently-played/);
  await assert.rejects(request('/api/spotify/callback?code=x&state=wrong',initialCookie),/ungültig/);
  const done=await request('/api/spotify/callback?code=x&state='+auth.searchParams.get('state'),initialCookie);const cookie=done.headers['Set-Cookie'].split(';')[0];assert.notEqual(cookie,initialCookie);
  const status=await request('/api/spotify/status',cookie);assert.equal(status.body.connected,true);assert.ok(!JSON.stringify(status.body).includes('private-'));
  const list=await request('/api/spotify/playlists?offset=20',cookie);assert.equal(list.body.nextOffset,40);assert.equal(list.body.items[0].total,3);assert.equal(refreshes,1);
  const activity=await request('/api/spotify/activity',cookie);assert.equal(activity.body.connected,true);assert.equal(activity.body.nowPlaying,null);assert.equal(activity.body.recentTracks[0].title,'Afterglow');assert.equal(activity.body.recentTracks[0].artist,'Tester');
  await assert.rejects(request('/api/spotify/disconnect',cookie,'POST','https://evil.test'),/direkt/);
  await request('/api/spotify/disconnect',cookie,'POST');assert.equal((await request('/api/spotify/status',cookie)).body.connected,false);
  await assert.rejects(request('/api/spotify/callback?code=x&state='+auth.searchParams.get('state'),initialCookie),/ungültig/);
});
test('Editorial data survives server restart, hides drafts and prevents unauthorized or stale edits',async()=>{
  const os=require('node:os'),path=require('node:path');const directory=fs.mkdtempSync(path.join(os.tmpdir(),'biasfm-editorial-'));
  const options={editorial:{directory,adminToken:'a-test-only-key-with-32-characters'},fetchReleases:async()=>({items:[],fetchedAt:new Date().toISOString()})};
  let server=createServer(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));let origin=`http://127.0.0.1:${server.address().port}`;
  const headers={'Content-Type':'application/json',Authorization:'Bearer a-test-only-key-with-32-characters'};
  try{
    assert.equal((await fetch(origin+'/api/editorial/releases')).status,401);
    assert.equal((await fetch(origin+'/api/editorial/releases',{method:'POST',headers,body:JSON.stringify({act:'A'})})).status,400);
    const input={act:'Artist',title:'New single',date:'2026-09-20',type:'Single',genres:['Idol'],sourceUrl:'https://example.com/announcement',state:'draft',pipelineStep:1};
    let response=await fetch(origin+'/api/editorial/releases',{method:'POST',headers,body:JSON.stringify(input)});assert.equal(response.status,201);let item=await response.json();
    assert.equal((await(await fetch(origin+'/api/releases')).json()).items.length,0);
    response=await fetch(origin+'/api/editorial/releases',{method:'POST',headers,body:JSON.stringify({...item,state:'published'})});assert.equal(response.status,200);const published=await response.json();
    response=await fetch(origin+'/api/editorial/releases',{method:'POST',headers,body:JSON.stringify({...item,title:'Stale'})});assert.equal(response.status,409);
    await new Promise(r=>server.close(r));server=createServer(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;
    assert.equal((await(await fetch(origin+'/api/releases')).json()).items[0].title,'New single');
    assert.equal((await fetch(origin+`/api/editorial/releases/${published.id}?version=1`,{method:'DELETE',headers})).status,409);
    assert.equal((await fetch(origin+`/api/editorial/releases/${published.id}?version=2`,{method:'DELETE',headers})).status,200);
    assert.equal((await(await fetch(origin+'/api/releases')).json()).items.length,0);
    assert.equal((await fetch(origin+'/.data/releases.json')).status,404);
  }finally{await new Promise(r=>server.close(r));fs.rmSync(directory,{recursive:true,force:true});}
});
test('Release feed rejects incomplete dates and mismatched artists and retains source attribution',async()=>{
  const {fetchReleases}=require('./lib/releases');
  const fixture={'release-groups':[
    {id:'59218bb7-ba92-470b-a359-71f9f90bd7eb',title:'Release','first-release-date':'2026-09-20','artist-credit':[{artist:{name:'NewJeans',id:'49204a7a-ed85-407a-828f-6fd46f1d8126'}}]},
    {id:'6493859c-f44d-4b8d-b5bd-bb79a5e34aa9',title:'Wrong','first-release-date':'2026-09-20','artist-credit':[{artist:{name:'NewJeans',id:'not-the-catalog-artist'}}]},
    {id:'6493859c-f44d-4b8d-b5bd-bb79a5e34aa9',title:'Incomplete','first-release-date':'2026','artist-credit':[{artist:{name:'NewJeans',id:'49204a7a-ed85-407a-828f-6fd46f1d8126'}}]}
  ]};
  const r=await fetchReleases(async()=>({ok:true,json:async()=>fixture}),new Date('2026-09-06T00:00:00Z'));assert.equal(r.items.length,1);assert.equal(r.items[0].sourceName,'MusicBrainz');assert.ok(r.items[0].sourceUrl.startsWith('https://musicbrainz.org/release-group/'));
});

test('Profile editing is separate, optional identity and independent theme survive reload',()=>{
 const {w,close}=app();let saved;
 try{
  w.biasApp.navigateTo('profile');assert.equal(w.document.querySelector('#prof-username'),null);
 w.biasApp.navigateTo('settings');
  assert.equal(w.document.getElementById('privacy-now-playing').checked,false);
  const productColor=w.document.documentElement.style.getPropertyValue('--bias');
  w.biasProfileView.selectColor('#ff4d6d','Blink Pink');
  assert.equal(w.document.documentElement.style.getPropertyValue('--bias'),productColor);
  assert.notEqual(w.biasStore.profile.accentColor,'#ff4d6d');
  w.document.querySelector('#prof-username').value='a valid name';w.biasProfileView.saveProfile();assert.equal(w.biasApp.currentRoute,'settings');
  w.document.querySelector('#prof-username').value='music-fan';w.document.querySelector('#prof-ult-artist').value='';
  w.document.querySelector('#prof-bio').value='<b>Independent music</b>';
  w.document.querySelector('#profile-theme').value='light';w.biasProfileView.saveProfile();
  assert.equal(w.biasApp.currentRoute,'profile');assert.equal(w.biasStore.profile.ultBiasArtist,'');
  assert.equal(w.biasStore.profile.accentColor,'#ff4d6d');assert.equal(w.biasStore.theme,'light');
  assert.equal(w.document.querySelector('.profile-display b'),null);
  saved=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));
 }finally{close();}
 const b=app(saved);try{assert.equal(b.w.biasStore.theme,'light');assert.equal(b.w.biasStore.profile.username,'music-fan');assert.equal(b.w.document.documentElement.style.getPropertyValue('--bias'),'#167d78');}finally{b.close();}
});
test('Song details provide favorites and streaming links without a playback dock',()=>{
 const {w,close}=app();try{w.biasModals.openSongModal('track-ditto');w.document.querySelector('#song-save').click();assert.ok(w.biasApp.likedSongs.has('track-ditto'));assert.ok(w.document.querySelector('.deeplink-btn.spotify').href.startsWith('https://open.spotify.com/'));assert.equal(w.document.querySelector('iframe'),null);w.biasModals.closeCurrentModal();w.biasApp.navigateTo('saved');assert.ok(w.document.querySelector('[data-favorite-open="track-ditto"]'));w.document.querySelector('[data-favorite-remove="track-ditto"]').click();assert.equal(w.biasApp.likedSongs.size,0);}finally{close();}
});
test('Daily modes have independent six-guess limits, aliases, persistence and spoilers only on completion',()=>{
 const {w,close}=app();try{
  w.biasApp.navigateTo('game');const g=w.biasGameView;
  g.choose('artist');const a=g.targetArtist;assert.ok(!w.document.querySelector('.clues-list').textContent.includes(a.name));g.submitGuess(a.hangul);assert.equal(g.state().status,'won');
  g.choose('credits');assert.equal(g.state().status,'playing');g.submitGuess(g.targetSong.credits.producers[0]);assert.equal(g.state().status,'won');
  g.choose('release');assert.equal(g.state().status,'playing');g.submitGuess('first wrong');g.submitGuess('first wrong');assert.equal(g.state().guesses.length,1);for(let i=1;i<6;i++)g.submitGuess('wrong '+i);assert.equal(g.state().status,'lost');g.submitGuess(g.targetSong.title);assert.equal(g.state().guesses.length,6);
  g.choose('artist');assert.equal(g.state().status,'won');
 }finally{close();}
});
test('Calendar navigates across years and exposes selected-day releases without fabricated timeline steps',()=>{
 const {w,close}=app();try{
  w.biasStore.addCustomComeback({id:'test-calendar',act:'Artist',title:'Album',date:'2027-01-02',type:'Album',genres:['Indie']});
  w.biasApp.navigateTo('kalender');const calendar=w.biasCalendarView;calendar.month='2026-12';calendar.setView('calendar');calendar.moveMonth(1);
  assert.equal(calendar.month,'2027-01');assert.equal(w.document.querySelectorAll('[data-day]').length,42);
  w.document.querySelector('[data-day="2027-01-02"]').click();assert.ok(w.document.querySelector('.calendar-day-detail').textContent.includes('Album'));
  calendar.openDetails('test-calendar');assert.ok(!w.document.querySelector('[role=dialog]').textContent.includes('Konzept-Fotos'));
  calendar.moveMonth(-1);assert.equal(calendar.month,'2026-12');
 }finally{close();}
});
test('Chart source deep links resolve to their own perspective and genre does not imply generation',()=>{
 const {w,close}=app();try{
  w.biasApp.navigateTo('home');w.document.querySelector('a[href="#charts/korea"]').click();assert.equal(w.biasApp.currentRoute,'charts');assert.ok(w.document.querySelector('#korea-chart-source'));
  w.biasChartsView.switchSource('catalog');assert.equal(w.document.querySelector('#gen-wrap').hidden,true);
  w.document.querySelector('[data-tag="Idol"]').click();assert.equal(w.document.querySelector('#gen-wrap').hidden,false);
  w.document.querySelector('[data-tag="Indie"]').click();assert.equal(w.document.querySelector('#gen-wrap').hidden,true);assert.equal(w.biasChartsView.activeGen,'Alle');
 }finally{close();}
});
test('Listening period is validated and sent to Last.fm instead of relabelling annual results',async()=>{
 let requested;
 const result=await getListening('lastfm','tester',async url=>{requested=new URL(url);return {ok:true,json:async()=>({topartists:{artist:[{name:'NewJeans',playcount:'3'}]}})};},'test-key','7day');
 assert.equal(requested.searchParams.get('period'),'7day');assert.equal(result.periodLabel,'Letzte 7 Tage');
 await assert.rejects(getListening('lastfm','tester',undefined,'test-key','invalid'),/Zeitraum/);
});

test('All five product themes and the profile accent stay independent and contrast-safe',()=>{
 const {w,close}=app();try{
  w.biasApp.navigateTo('settings');
  assert.equal(w.document.querySelectorAll('#profile-theme option').length,5);
  const productColor=w.document.documentElement.style.getPropertyValue('--bias');
  w.document.getElementById('profile-theme').value='holographic';
  w.biasProfileView.selectColor('#fbbf24','Coral Sunshine');
  assert.equal(w.document.documentElement.style.getPropertyValue('--bias'),productColor);
  w.document.getElementById('profile-accent-hex').value='#fbbf24';
  w.biasProfileView.saveProfile();
  assert.equal(w.biasStore.theme,'holographic');assert.equal(w.biasStore.profile.accentColor,'#fbbf24');
  assert.equal(w.document.documentElement.getAttribute('data-theme'),'holographic');
  w.biasApp.navigateTo('settings');w.document.getElementById('profile-accent-hex').value='#000001';w.biasProfileView.saveProfile();
  assert.equal(w.biasStore.profile.accentColor,'#fbbf24');
 }finally{close();}
});

test('Spotify JSON history import parses real export fields and maps unknown artists honestly',()=>{
 const {w,close}=app();try{
  const parsed=w.biasSpotifyImport.parseJSON(JSON.stringify([{master_metadata_album_artist_name:'NewJeans',master_metadata_track_name:'Ditto',ms_played:120000,ts:'2024-01-01T00:00:00Z'},{master_metadata_album_artist_name:'Unknown',master_metadata_track_name:'Song',ms_played:0}]));
  assert.equal(parsed.rows.length,1);assert.equal(parsed.skipped,1);
  const result=w.biasCore.summarizeListening(parsed.rows,{provider:'spotify-import'});
  assert.equal(result.totalScrobbles,1);assert.equal(result.koreaScrobbles,1);assert.equal(result.unmatchedScrobbles,0);
 }finally{close();}
});
test('Spotify ZIP history import reads matching files and deduplicates entries across files',async()=>{
 const {w,close}=app();try{
  const entries=[
   ['StreamingHistory0.json',JSON.stringify([{master_metadata_album_artist_name:'NewJeans',ms_played:120000,ts:'2024-01-01T00:00:00Z'}])],
   ['StreamingHistory1.json',JSON.stringify([{master_metadata_album_artist_name:'NewJeans',ms_played:120000,ts:'2024-01-01T00:00:00Z'},{master_metadata_album_artist_name:'BIBI',ms_played:120000,ts:'2024-01-02T00:00:00Z'}])],
   ['notes.txt','ignored']
  ];
  const chunks=[],central=[];let offset=0;
  for(const [name,text] of entries){const nameBytes=Buffer.from(name),data=Buffer.from(text),local=Buffer.alloc(30+nameBytes.length);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0,6);local.writeUInt16LE(0,8);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(nameBytes.length,26);nameBytes.copy(local,30);chunks.push(local,data);const head=Buffer.alloc(46+nameBytes.length);head.writeUInt32LE(0x02014b50,0);head.writeUInt16LE(20,4);head.writeUInt16LE(20,6);head.writeUInt16LE(0,8);head.writeUInt16LE(0,10);head.writeUInt32LE(data.length,20);head.writeUInt32LE(data.length,24);head.writeUInt16LE(nameBytes.length,28);head.writeUInt32LE(offset,42);nameBytes.copy(head,46);central.push(head);offset+=local.length+data.length;}
  const centralData=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(centralData.length,12);end.writeUInt32LE(offset,16);const zip=Buffer.concat([...chunks,centralData,end]);const buffer=zip.buffer.slice(zip.byteOffset,zip.byteOffset+zip.byteLength);const parsed=await w.biasSpotifyImport.parseZIP(buffer);assert.equal(parsed.files,2);assert.equal(parsed.rows.length,2);assert.equal(parsed.skipped,1);assert.equal(Array.from(parsed.rows,map=>map.name).join(','),'NewJeans,BIBI');
 }finally{close();}
});

test('Agenda is a bounded 14-day view while the calendar retains month navigation',()=>{
 const {w,close}=app();try{
  const today=w.biasCore.koreaDate();
  w.biasStore.addCustomComeback({id:'agenda-near',act:'Near',title:'Soon',date:w.biasCalendarView.addDays(today,3),type:'Single',genres:['Indie']});
  w.biasStore.addCustomComeback({id:'agenda-far',act:'Far',title:'Later',date:w.biasCalendarView.addDays(today,20),type:'Single',genres:['Indie']});
  w.biasApp.navigateTo('kalender');
  assert.equal(w.document.querySelector('.agenda-controls h2').textContent.includes('–'),true);
  assert.equal(w.document.body.textContent.includes('Near'),true);assert.equal(w.document.body.textContent.includes('Later'),false);
  w.biasCalendarView.moveAgenda(1);assert.equal(w.document.body.textContent.includes('Later'),true);
 }finally{close();}
});

test('Public product removes concept page, preserves source labels and accessible cover text',async()=>{
 const {w,close}=app();try{
  assert.equal(w.document.querySelector('.desktop-nav').textContent.includes('Konzept'),false);
  w.biasApp.navigateTo('catalog');w.document.querySelector('[data-tab="releases"]').click();assert.match(w.document.querySelector('.artwork').getAttribute('aria-label'),/^Cover:/);
  w.biasApp.navigateTo('curation');assert.ok(w.document.querySelector('.proposal-gate'));
 }finally{close();}
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));try{assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/konzept.html`)).status,404);}finally{await new Promise(resolve=>server.close(resolve));}
});

test('Improvement V3 routes expose discover, community, detail, list, support and security surfaces',()=>{
 const {w,close}=app();
 try{
  w.biasApp.navigateTo('catalog');assert.equal(w.document.querySelectorAll('[data-v3-tab]').length,3);assert.ok(w.document.querySelector('#v3-discover-search'));assert.ok(w.document.querySelector('.v3-sort-control'));assert.equal(w.document.querySelector('.v3-filter-row .v3-sort-control'),null);
  const filterToggle=w.document.querySelector('[data-v3-filter-toggle]');assert.ok(filterToggle);filterToggle.click();assert.equal(w.document.querySelector('.v3-discover-filter-shell').classList.contains('is-open'),true);w.document.querySelector('[data-v3-filter-close]').click();assert.equal(w.document.querySelector('.v3-discover-filter-shell').classList.contains('is-open'),false);
  w.biasApp.navigateTo('community');assert.equal(w.document.querySelector('#main-content h1').textContent,'Gemeinsam entdecken');assert.ok(w.document.querySelectorAll('.v3-group-card').length>=3);assert.ok(w.document.querySelector('[data-v3-discover]'));assert.ok(w.document.querySelector('[data-v3-mine]'));
  w.history.pushState(null,'','#artist/newjeans');w.biasApp.navigateTo('artist',false);assert.equal(w.document.querySelector('#main-content h1').textContent,'NewJeans');
  w.history.pushState(null,'','#song/track-ditto');w.biasApp.navigateTo('song',false);assert.equal(w.document.querySelector('#main-content h1').textContent,'Ditto');assert.ok(w.document.querySelector('[data-v3-item-stats]'));
  w.biasApp.navigateTo('lists');assert.equal(w.document.querySelector('#main-content h1').textContent,'Meine Listen');
  w.biasApp.navigateTo('support');assert.equal(w.document.querySelector('#main-content h1').textContent,'Support bias.fm');
  w.biasApp.navigateTo('profile');assert.ok(w.document.querySelector('#v3-leaderboard-optin'));assert.ok(w.document.querySelector('.v3-profile-art'));assert.equal(w.document.querySelector('.v3-profile-art').classList.contains('profile-art-v2'),false);
  w.biasApp.navigateTo('settings');assert.ok(w.document.querySelector('[data-v3-security]'));
 }finally{close();}
});
