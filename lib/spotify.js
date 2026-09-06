const crypto = require('node:crypto');
const fail = (status,message) => Object.assign(new Error(message),{status});
function createSpotify({clientId=process.env.SPOTIFY_CLIENT_ID,origin=process.env.APP_ORIGIN || `http://127.0.0.1:${process.env.PORT || 3000}`,fetcher=fetch}={}) {
  const sessions=new Map();
  const appOrigin=new URL(origin).origin;
  const redirectUri=appOrigin+'/api/spotify/callback';
  const configured=Boolean(clientId);
  const cookie=(res,id,maxAge=604800) => res.setHeader('Set-Cookie',`biasfm_spotify=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${appOrigin.startsWith('https:') ? '; Secure' : ''}`);
  const read=req=>{const id=(req.headers.cookie || '').split(';').map(c=>c.trim()).find(c=>c.startsWith('biasfm_spotify='))?.slice(15);const session=sessions.get(id);if(session && session.expires>Date.now()) return {id,session};if(id) sessions.delete(id);return {};};
  const newId=()=>crypto.randomBytes(32).toString('hex');
  async function token(params) {
    const response=await fetcher('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...params,client_id:clientId}),signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw fail(401,'Die Spotify-Verbindung ist abgelaufen. Bitte erneut verbinden.');
    const data=await response.json();if(!data.access_token) throw fail(502,'Spotify hat keine gültige Verbindung geliefert.');return data;
  }
  async function access(session) {
    if(session.tokenExpires>Date.now()+60000) return session.accessToken;
    if(!session.refreshToken) throw fail(401,'Bitte Spotify erneut verbinden.');
    if(!session.refreshing) session.refreshing=token({grant_type:'refresh_token',refresh_token:session.refreshToken}).then(t=>{session.accessToken=t.access_token;session.refreshToken=t.refresh_token || session.refreshToken;session.tokenExpires=Date.now()+Number(t.expires_in)*1000;return session.accessToken;}).finally(()=>{delete session.refreshing;});
    return session.refreshing;
  }
  async function spotify(path,session) {
    const response=await fetcher('https://api.spotify.com/v1'+path,{headers:{Authorization:`Bearer ${await access(session)}`},signal:AbortSignal.timeout(15000)});
    if(!response.ok) {
      if(response.status===401) {session.tokenExpires=0;throw fail(401,'Die Verbindung wurde widerrufen oder ist abgelaufen. Bitte erneut verbinden.');}
      if(response.status===403) throw fail(403,'Spotify erlaubt diesen Zugriff für dein Konto oder diese App nicht. Der Betreiber muss die App-Freigabe prüfen.');
      if(response.status===429) throw fail(429,'Spotify begrenzt gerade die Anfragen. Bitte später erneut versuchen.');
      throw fail(502,'Spotify ist gerade nicht erreichbar. Bitte erneut versuchen.');
    }
    return response.json();
  }
  const redirect=(res,location)=>{res.writeHead(303,{Location:location,'Cache-Control':'no-store'});res.end();};
  return {configured,origin:appOrigin,async handle(req,res,url,send) {
    if(!url.pathname.startsWith('/api/spotify/')) return false;
    const {id,session}=read(req);
    if(url.pathname==='/api/spotify/disconnect' && req.method==='POST') {
      if(session && req.headers.origin!==appOrigin) throw fail(403,'Diese Aktion muss direkt auf bias.fm ausgeführt werden.');
      if(id) sessions.delete(id);cookie(res,'',0);send(200,JSON.stringify({connected:false}));return true;
    }
    if(req.method!=='GET') throw fail(405,'Methode nicht erlaubt.');
    if(url.pathname==='/api/spotify/status') {send(200,JSON.stringify({configured,connected:Boolean(session?.accessToken),profile:session?.profile || null}));return true;}
    if(!configured) throw fail(503,'Spotify-Anmeldung ist noch nicht freigeschaltet. Du kannst bereits deinen Profil-Link und Playlists hinterlegen.');
    if(url.pathname==='/api/spotify/connect') {
      if(req.headers.host!==new URL(appOrigin).host) {redirect(res,appOrigin+'/api/spotify/connect');return true;}
      for(const [key,value] of sessions) if(value.expires<Date.now()) sessions.delete(key);
      if(sessions.size>=1000) throw fail(429,'Zu viele gleichzeitige Verbindungen. Bitte später versuchen.');
      const sid=newId(),state=newId(),verifier=crypto.randomBytes(48).toString('base64url');
      sessions.set(sid,{state,verifier,expires:Date.now()+600000});cookie(res,sid,600);
      const params=new URLSearchParams({client_id:clientId,response_type:'code',redirect_uri:redirectUri,scope:'playlist-read-private playlist-read-collaborative',state,code_challenge_method:'S256',code_challenge:crypto.createHash('sha256').update(verifier).digest('base64url')});
      redirect(res,'https://accounts.spotify.com/authorize?'+params);return true;
    }
    if(url.pathname==='/api/spotify/callback') {
      if(!session?.state || session.state!==url.searchParams.get('state')) throw fail(400,'Die Spotify-Anmeldung ist ungültig oder abgelaufen. Bitte starte sie erneut im Profil.');
      const verifier=session.verifier;sessions.delete(id);
      if(url.searchParams.has('error')) {cookie(res,'',0);redirect(res,appOrigin+'/#profile?spotify=cancelled');return true;}
      if(!url.searchParams.get('code')) throw fail(400,'Spotify hat keinen Anmeldecode geliefert.');
      try {
        const t=await token({grant_type:'authorization_code',code:url.searchParams.get('code'),redirect_uri:redirectUri,code_verifier:verifier});
        const next={accessToken:t.access_token,refreshToken:t.refresh_token,tokenExpires:Date.now()+Number(t.expires_in)*1000,expires:Date.now()+604800000};
        const me=await spotify('/me',next);
        next.profile={id:me.id,name:me.display_name || me.id,url:`https://open.spotify.com/user/${encodeURIComponent(me.id)}`};
        const sid=newId();sessions.set(sid,next);cookie(res,sid);redirect(res,appOrigin+'/#profile?spotify=connected');return true;
      } catch(error) {cookie(res,'',0);redirect(res,appOrigin+'/#profile?spotify=failed');return true;}
    }
    if(url.pathname==='/api/spotify/playlists') {
      if(!session?.accessToken) throw fail(401,'Bitte verbinde zuerst dein Spotify-Konto.');
      const offset=Number(url.searchParams.get('offset') || 0);
      if(!Number.isSafeInteger(offset) || offset<0 || offset>100000) throw fail(400,'Ungültige Playlist-Seite.');
      const data=await spotify(`/me/playlists?limit=20&offset=${offset}`,session);
      send(200,JSON.stringify({items:(data.items || []).filter(Boolean).map(p=>({id:p.id,name:p.name,owner:p.owner?.display_name || p.owner?.id || '',url:`https://open.spotify.com/playlist/${encodeURIComponent(p.id)}`,image:p.images?.find(i=>/^https:\/\/i\.scdn\.co\//.test(i.url))?.url || '',total:p.items?.total ?? p.tracks?.total ?? null})),nextOffset:data.next ? offset+20 : null,total:data.total}));return true;
    }
    throw fail(404,'Unbekannte Spotify-Funktion.');
  }};
}
module.exports={createSpotify};
