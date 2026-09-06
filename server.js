const http = require('http');
const fs = require('fs');
const path = require('path');
const {getListening} = require('./lib/listening');
const {createSpotify}=require('./lib/spotify');
const {createEditorial}=require('./lib/editorial');
const {fetchReleases}=require('./lib/releases');
const {fetchCharts}=require('./lib/charts');
const ROOT = __dirname;
const MIME = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
function createServer(options={}) {
  const spotify=createSpotify(options.spotify);
  const editorial=createEditorial(options.editorial);
  let releaseCache=null,releasePending=null,releaseRetryAt=0;
  const attempts=new Map();
  async function readBody(req) {
    if(!(req.headers['content-type'] || '').startsWith('application/json')) throw Object.assign(new Error('JSON-Eingabe erwartet.'),{status:415});
    let text='';for await(const chunk of req) {text+=chunk;if(Buffer.byteLength(text)>16384) throw Object.assign(new Error('Die Eingabe ist zu groß.'),{status:413});}
    try {const value=JSON.parse(text);if(!value || typeof value!=='object' || Array.isArray(value)) throw Error();return value;}catch{throw Object.assign(new Error('Ungültige Eingabe.'),{status:400});}
  }
  let active = 0;
  const cache = new Map();
  return http.createServer(async (req,res) => {
    const send = (status, body, type='application/json; charset=utf-8') => { res.writeHead(status, {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}); res.end(req.method === 'HEAD' ? undefined : body); };
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if(pathname.startsWith('/api/editorial/') || pathname === '/api/spotify/connect') {
        const key=req.socket.remoteAddress, now=Date.now();
        const entry=attempts.get(key);const count=entry && entry.until>now ? entry.count+1 : 1;
        if(attempts.size>2000) for(const [ip,a] of attempts) if(a.until<now) attempts.delete(ip);
        attempts.set(key,{count,until:entry && entry.until>now?entry.until:now+60000});
        if(count>30) return send(429,JSON.stringify({error:'Zu viele Anfragen. Bitte in einer Minute erneut versuchen.'}));
      }
      if(await spotify.handle(req,res,url,send)) return;
      if(await editorial.handle(req,res,url,send,readBody)) return;
      if(pathname === '/api/config' && req.method==='GET') return send(200,JSON.stringify({spotify:spotify.configured,lastfm:Boolean(process.env.LASTFM_API_KEY),editorial:editorial.enabled,operator:{name:process.env.OPERATOR_NAME || '',address:process.env.OPERATOR_ADDRESS || '',email:process.env.OPERATOR_EMAIL || ''}}));
      if(pathname === '/api/health' && req.method==='GET') return send(200,JSON.stringify({status:'ok'}));
      if(pathname === '/api/releases' && req.method==='GET') {
        let warning='';
        if(!releaseCache || releaseCache.expires<Date.now()) {
          try {
            if(Date.now()<releaseRetryAt) throw new Error('MusicBrainz ist vorübergehend nicht erreichbar. Bitte später aktualisieren.');
            if(!releasePending) releasePending=(options.fetchReleases || fetchReleases)().then(data=>{releaseCache={data,expires:Date.now()+1800000};return data;}).catch(e=>{releaseRetryAt=Date.now()+60000;throw e;}).finally(()=>{releasePending=null;});
            await releasePending;
          }catch(e){warning=e.message;}
        }
        const source=releaseCache?.data || {items:[],fetchedAt:null};
        return send(200,JSON.stringify({...source,items:[...editorial.publicRows(),...source.items],warning,stale:Boolean(warning&&releaseCache)}));
      }
      if (!['GET','HEAD'].includes(req.method)) return send(405, JSON.stringify({error:'Methode nicht erlaubt.'}));
      if(pathname === '/api/charts' && req.method==='GET') {
        const tag=url.searchParams.get('tag') || 'k-pop',key='charts:'+tag;
        const old=cache.get(key);if(old&&old.expires>Date.now())return send(200,JSON.stringify(old.data));
        if(active>=4)return send(429,JSON.stringify({error:'Bitte in einem Moment erneut versuchen.'}));
        active++;try{const data=await fetchCharts(tag);if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,{data,expires:Date.now()+900000});return send(200,JSON.stringify(data));}finally{active--;}
      }
      if (pathname === '/api/listening') {
        if (req.method === 'HEAD') return send(405,'');
        const provider = url.searchParams.get('provider') || '';
        const username = url.searchParams.get('username') || '';
        const key = `${provider}:${username}`;
        const saved = cache.get(key);
        if (saved && saved.expires > Date.now()) return send(200, JSON.stringify(saved.data));
        if (active >= 4) return send(429, JSON.stringify({error:'Gerade laufen mehrere Importe. Bitte in einem Moment erneut versuchen.'}));
        active++;
        try {
          const data = await getListening(provider, username);
          if (cache.size >= 100) cache.delete(cache.keys().next().value);
          cache.set(key, {data, expires:Date.now()+300000});
          return send(200, JSON.stringify(data));
        } finally { active--; }
      }
      if (pathname.startsWith('/api/')) return send(404, JSON.stringify({error:'Unbekannte Anfrage.'}));
      const allowed = pathname === '/' || /^\/(index\.html|404\.html|konzept\.html)$/.test(pathname) || /^\/(css|js)\/[a-zA-Z0-9_./-]+$/.test(pathname);
      if (!allowed || pathname.split('/').some(p => p.startsWith('.'))) return send(404,'Nicht gefunden.','text/plain');
      const file = path.resolve(ROOT, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(ROOT + path.sep)) return send(404,'Nicht gefunden.','text/plain');
      const ext = path.extname(file);
      if (!MIME[ext]) return send(404,'Nicht gefunden.','text/plain');
      const data = await fs.promises.readFile(file);
      send(200,data,MIME[ext]);
    } catch(e) {
      const status = e instanceof URIError ? 400 : e.code === 'ENOENT' || e.code === 'EISDIR' ? 404 : e.status || 502;
      send(status,JSON.stringify({error:e.status ? e.message : status === 404 ? 'Nicht gefunden.' : 'Die Anfrage konnte nicht geladen werden. Bitte erneut versuchen.'}));
    }
  });
}
if (require.main === module) {
  if(fs.existsSync(path.join(ROOT,'.env'))) process.loadEnvFile(path.join(ROOT,'.env'));
  const server = createServer();
  server.listen(process.env.PORT || 3000, () => console.log(`Local URL: http://localhost:${server.address().port}`));
  for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
}
module.exports = {createServer};
