const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const error=(status,message)=>Object.assign(new Error(message),{status});
function validateRelease(input) {
  const text=(key,max,required=false)=>{const v=String(input[key] ?? '').trim();if(v.length>max || (required&&!v)) throw error(400,`Bitte ${key} prüfen.`);return v;};
  const date=text('date',10,true);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) throw error(400,'Bitte ein gültiges Datum eingeben.');
  const sourceUrl=text('sourceUrl',1000,true);let link;try{link=new URL(sourceUrl);}catch{throw error(400,'Bitte eine gültige Quellen-URL angeben.');}
  if(!['https:','http:'].includes(link.protocol) || link.username || link.password) throw error(400,'Bitte eine öffentliche HTTP-Quelle angeben.');
  const pipelineStep=Number(input.pipelineStep || 1);
  if(![1,2,3,4].includes(pipelineStep) || !['draft','published'].includes(input.state)) throw error(400,'Bitte Status und Release-Phase prüfen.');
  return {act:text('act',120,true),title:text('title',200,true),date,type:text('type',60,true),description:text('description',2000),genres:(Array.isArray(input.genres)?input.genres:[]).map(g=>String(g).trim()).filter(Boolean).slice(0,8).map(g=>g.slice(0,40)),sourceUrl:link.href,pipelineStep,state:input.state};
}
function createEditorial({directory=process.env.DATA_DIR || path.join(__dirname,'../.data'),adminToken=process.env.EDITORIAL_TOKEN}={}) {
  const file=path.join(directory,'releases.json');
  const read=()=>{try{const data=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(data)) throw Error('Invalid data');return data;}catch(e){if(e.code==='ENOENT')return [];throw error(503,'Die Redaktion konnte nicht geladen werden. Bitte den gespeicherten Datenbestand prüfen.');}};
  const write=rows=>{fs.mkdirSync(directory,{recursive:true,mode:0o700});const tmp=file+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(tmp,JSON.stringify(rows,null,2),{mode:0o600});fs.renameSync(tmp,file);};
  const authorized=req=>{const sent=Buffer.from((req.headers.authorization || '').replace(/^Bearer /,''));const expected=Buffer.from(adminToken || '');return expected.length>=24 && sent.length===expected.length && crypto.timingSafeEqual(sent,expected);};
  const check=req=>{if(!adminToken || adminToken.length<24)throw error(503,'Die öffentliche Redaktion ist noch nicht freigeschaltet.');if(!authorized(req))throw error(401,'Der Redaktionszugang ist ungültig.');};
  const publicRows=()=>read().filter(r=>r.state==='published').map(({state,...r})=>({...r,status:'Redaktionell eingetragen',sourceName:'Redaktion',sourceVerified:false}));
  return {enabled:Boolean(adminToken?.length>=24),publicRows,async handle(req,res,url,send,readBody) {
    if(!url.pathname.startsWith('/api/editorial/releases')) return false;
    check(req);
    if(url.pathname==='/api/editorial/releases' && req.method==='GET') {send(200,JSON.stringify({items:read()}));return true;}
    if(url.pathname==='/api/editorial/releases' && req.method==='POST') {
      const body=await readBody(req);const value=validateRelease(body);const rows=read();
      const old=body.id ? rows.find(r=>r.id===body.id) : null;
      if(body.id&&!old) throw error(404,'Dieser Eintrag existiert nicht mehr.');
      if(old && body.version!==old.version) throw error(409,'Der Eintrag wurde inzwischen geändert. Bitte neu laden und erneut bearbeiten.');
      if(rows.length>=1000&&!old) throw error(422,'Die Redaktion umfasst bereits 1.000 Einträge. Bitte zuerst archivieren.');
      const next={...value,id:old?.id || 'ed-'+crypto.randomUUID(),version:(old?.version || 0)+1,updatedAt:new Date().toISOString()};
      write(old ? rows.map(r=>r.id===old.id?next:r) : [...rows,next]);send(old?200:201,JSON.stringify(next));return true;
    }
    if(req.method==='DELETE' && /^\/api\/editorial\/releases\/ed-[a-f0-9-]{36}$/.test(url.pathname)) {
      const id=url.pathname.split('/').pop(),rows=read(),old=rows.find(r=>r.id===id);
      if(!old) throw error(404,'Der Eintrag existiert nicht mehr.');
      if(Number(url.searchParams.get('version'))!==old.version) throw error(409,'Der Eintrag wurde inzwischen geändert. Bitte neu laden.');
      write(rows.filter(r=>r.id!==id));send(200,JSON.stringify({deleted:true}));return true;
    }
    throw error(405,'Methode nicht erlaubt.');
  }};
}
module.exports={createEditorial,validateRelease};
