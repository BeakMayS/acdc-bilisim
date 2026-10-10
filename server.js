// AC/DC Bilişim ortak demo sunucusu — Node.js built-ins only.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3017);
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_USER = process.env.ACDC_ADMIN_USER || 'acdcadmin';
const ADMIN_PASS = process.env.ACDC_ADMIN_PASS || 'ACdc2026!';
const DATA_DIR = path.join(ROOT, 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
const SITE_FILE = path.join(DATA_DIR, 'site-state.json');
const sessions = new Map();
const TYPES = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
fs.mkdirSync(DATA_DIR, {recursive:true});
if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, '[]', 'utf8');
if (!fs.existsSync(SITE_FILE)) fs.writeFileSync(SITE_FILE, '{}', 'utf8');
function readJson(file, fallback){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return fallback}}
function writeJson(file, value){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2),'utf8');fs.renameSync(tmp,file)}
function readRequests(){return readJson(REQUESTS_FILE,[])}
function writeRequests(rows){writeJson(REQUESTS_FILE,rows)}
function send(res,status,obj,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(obj))}
function readBody(req,limit=100*1024*1024){return new Promise((resolve,reject)=>{let data='',failed=false;req.on('data',chunk=>{if(failed)return;data+=chunk.toString('utf8');if(Buffer.byteLength(data,'utf8')>limit){failed=true;reject(new Error('İstek çok büyük. Fotoğrafları daha küçük boyutla yükleyin.'));req.pause()}});req.on('end',()=>{if(failed)return;try{resolve(data?JSON.parse(data):{})}catch{reject(new Error('Geçersiz JSON'))}});req.on('error',reject)})}
function isAdmin(req){const m=(req.headers.cookie||'').match(/(?:^|;\s*)acdc_session=([a-f0-9]+)/);if(!m)return false;const exp=sessions.get(m[1]);if(!exp||exp<Date.now()){sessions.delete(m[1]);return false}return true}
function requireAdmin(req,res){if(isAdmin(req))return true;send(res,401,{error:'Oturum bulunamadı. Yönetici girişi yapın.'});return false}
function clean(v,max=3000){return String(v??'').trim().slice(0,max)}
function validPhone(v){return /^[+\d\s().-]{7,30}$/.test(v)}
function safeEqual(a,b){const aa=Buffer.from(String(a));const bb=Buffer.from(String(b));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
function routeApi(req,res,url){
 if(req.method==='GET'&&url.pathname==='/api/site-state')return send(res,200,{state:readJson(SITE_FILE,{})});
 if(req.method==='PUT'&&url.pathname==='/api/admin/site-state'){
  if(!requireAdmin(req,res))return;
  return readBody(req).then(body=>{if(!body||typeof body!=='object'||Array.isArray(body))return send(res,400,{error:'Site verisi geçersiz.'});writeJson(SITE_FILE,body);return send(res,200,{ok:true})}).catch(e=>send(res,413,{error:e.message||'Site kaydedilemedi.'}));
 }
 if(req.method==='POST'&&url.pathname==='/api/requests')return readBody(req,100000).then(body=>{const name=clean(body.name,100),phone=clean(body.phone,30),service=clean(body.service,100),details=clean(body.details,3000);if(name.length<2||!validPhone(phone)||!service||details.length<5)return send(res,400,{error:'Lütfen ad, geçerli telefon, hizmet ve iş detaylarını doldurun.'});const rows=readRequests();const item={id:crypto.randomUUID(),createdAt:new Date().toISOString(),name,phone,service,place:clean(body.place,120),budget:clean(body.budget,80),timing:clean(body.timing,80),details,status:'Yeni'};rows.unshift(item);writeRequests(rows);return send(res,201,{ok:true,id:item.id})}).catch(e=>send(res,400,{error:e.message||'Talep kaydedilemedi.'}));
 if(req.method==='POST'&&url.pathname==='/api/admin/login')return readBody(req,10000).then(body=>{if(!safeEqual(body.username||'',ADMIN_USER)||!safeEqual(body.password||'',ADMIN_PASS))return send(res,401,{error:'Kullanıcı adı veya şifre yanlış.'});const token=crypto.randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*60*60*1000);return send(res,200,{ok:true},{'Set-Cookie':`acdc_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`})}).catch(e=>send(res,400,{error:e.message}));
 if(req.method==='POST'&&url.pathname==='/api/admin/logout'){const m=(req.headers.cookie||'').match(/(?:^|;\s*)acdc_session=([a-f0-9]+)/);if(m)sessions.delete(m[1]);return send(res,200,{ok:true},{'Set-Cookie':'acdc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
 if(url.pathname==='/api/admin/requests'&&req.method==='GET'){if(!requireAdmin(req,res))return;return send(res,200,{requests:readRequests()});}
 const match=url.pathname.match(/^\/api\/admin\/requests\/([a-f0-9-]+)$/i);
 if(match&&req.method==='PATCH'){if(!requireAdmin(req,res))return;return readBody(req,10000).then(body=>{const allowed=['Yeni','İnceleniyor','Teklif verildi','Tamamlandı'];if(!allowed.includes(body.status))return send(res,400,{error:'Geçersiz talep durumu.'});const rows=readRequests(),item=rows.find(x=>x.id===match[1]);if(!item)return send(res,404,{error:'Talep bulunamadı.'});item.status=body.status;writeRequests(rows);return send(res,200,{ok:true})}).catch(e=>send(res,400,{error:e.message}));}
 if(match&&req.method==='DELETE'){if(!requireAdmin(req,res))return;const rows=readRequests(),next=rows.filter(x=>x.id!==match[1]);if(next.length===rows.length)return send(res,404,{error:'Talep bulunamadı.'});writeRequests(next);return send(res,200,{ok:true});}
 send(res,404,{error:'API adresi bulunamadı.'});
}
http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/'))return routeApi(req,res,url);if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end('Method not allowed')}if(url.pathname==='/'||url.pathname==='/admin'||url.pathname==='/admin/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return req.method==='HEAD'?res.end():fs.createReadStream(path.join(ROOT,'index.html')).pipe(res)}const target=path.resolve(ROOT,'.'+decodeURIComponent(url.pathname));if(!target.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end('Forbidden')}fs.stat(target,(err,st)=>{if(err||!st.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found')}res.writeHead(200,{'Content-Type':TYPES[path.extname(target).toLowerCase()]||'application/octet-stream','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();fs.createReadStream(target).pipe(res)})}).listen(PORT,HOST,()=>console.log(`AC/DC ortak demo: http://localhost:${PORT} | Yönetim: http://localhost:${PORT}/admin\nKullanıcı: ${ADMIN_USER}\nSunucuya kayıt: data/site-state.json ve data/requests.json`));
