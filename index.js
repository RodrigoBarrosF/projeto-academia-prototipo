'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID,randomBytes,timingSafeEqual}=require('node:crypto');
const D=require('../domain');
const {openDatabase,passwordHash,verifyPassword,digest}=require('./store');
class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new HttpError(status,message);};
function createApp(options={}) {
 const production=options.production??process.env.NODE_ENV==='production';
 const origin=options.origin||process.env.APP_ORIGIN||'http://localhost:3000';
 if(production&&!origin.startsWith('https://'))throw Error('Produção exige APP_ORIGIN HTTPS.');
 const store=openDatabase(options.database||process.env.DB_PATH||path.join(__dirname,'../data/dryfit.sqlite'));
 const {db,getUser,users,updateUser,transaction,audit}=store;
 const limits=new Map();
 const cleanup=setInterval(()=>{for(const [key,value]of limits)if(value.until<Date.now())limits.delete(key);db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('DELETE FROM resets WHERE expires<?').run(Date.now());},60000);cleanup.unref();
 const limit=(key,max=20)=>{let entry=limits.get(key);if(!entry||entry.until<Date.now())entry={count:0,until:Date.now()+600000};entry.count++;limits.set(key,entry);if(entry.count>max)fail(429,'Muitas tentativas. Aguarde alguns minutos.');};
 const clientAllowed=(actor,user)=>user&&user.role==='client'&&(actor.role==='admin'||actor.id===user.id||actor.role==='personal'&&user.personalId===actor.id);
 const accessible=(actor)=>users().filter(u=>actor.role==='admin'||u.id===actor.id||actor.role==='personal'&&u.personalId===actor.id||actor.role==='client'&&u.id===actor.personalId);
 const snapshot=(actor)=>{
  const list=accessible(actor);const ids=new Set(list.filter(u=>u.role==='client').map(u=>u.id));
  return {version:1,users:list,attendance:db.prepare('SELECT payload FROM attendance ORDER BY day DESC').all().map(r=>JSON.parse(r.payload)).filter(a=>ids.has(a.userId)),accesses:db.prepare('SELECT user_id AS userId,at FROM accesses ORDER BY id DESC LIMIT 10000').all().filter(a=>ids.has(a.userId)),messages:db.prepare('SELECT payload FROM messages ORDER BY rowid DESC LIMIT 2000').all().map(r=>JSON.parse(r.payload)).filter(m=>ids.has(m.clientId)).reverse(),payments:db.prepare('SELECT payload FROM orders ORDER BY rowid DESC').all().map(r=>JSON.parse(r.payload)).filter(o=>ids.has(o.userId))};
 };
 const publicUser=user=>({...user,cpf: '*********'+user.cpf.slice(-2)});
 const publicState=actor=>{const value=snapshot(actor);value.users=value.users.map(publicUser);return value;};
 const createSession=(res,user)=>{
  const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(token),user.id,csrf,Date.now()+8*3600000);
  db.prepare('INSERT INTO accesses(user_id,at) VALUES(?,?)').run(user.id,new Date().toISOString());
  res.setHeader('Set-Cookie',`dryfit_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${production?'; Secure':''}`);
  return {user:publicUser(user),csrf,state:publicState(user)};
 };
 async function body(req){
  if(!(req.headers['content-type']||'').startsWith('application/json'))fail(415,'Envie JSON.');
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16384)fail(413,'Requisição muito grande.');}
  try{const parsed=JSON.parse(raw||'{}');if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error();return parsed;}catch{fail(400,'JSON inválido.');}
 }
 const response=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 const sessionFor=req=>{const match=(req.headers.cookie||'').match(/(?:^|;\s*)dryfit_session=([a-f0-9]{64})(?:;|$)/);if(!match)return null;const s=db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires>?').get(digest(match[1]),Date.now());return s?{...s,user:getUser(s.user_id)}:null;};
 const csrfCheck=(req,s)=>{const value=req.headers['x-csrf-token'];if(typeof value!=='string'||value.length!==s.csrf.length||!timingSafeEqual(Buffer.from(value),Buffer.from(s.csrf)))fail(403,'Recarregue a página antes de tentar novamente.');};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'");if(production)res.setHeader('Strict-Transport-Security','max-age=31536000');
  try {
   const url=new URL(req.url,origin),route=url.pathname;
   if(!route.startsWith('/api/')){
    if(req.method!=='GET'&&req.method!=='HEAD')fail(405,'Método não permitido.');
    const files={'/':'live.html','/index.html':'live.html','/style.css':'style.css','/domain.js':'domain.js','/live.js':'live.js','/account.js':'account.js','/demo/account.js':'account.js','/demo/':'index.html','/demo/index.html':'index.html','/demo/style.css':'style.css','/demo/domain.js':'domain.js','/demo/app.js':'app.js'};
    const file=files[route];if(!file)fail(404,'Página não encontrada.');const bytes=fs.readFileSync(path.join(__dirname,'..',file));res.setHeader('Content-Type',file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');res.setHeader('Cache-Control','no-cache');res.end(req.method==='HEAD'?undefined:bytes);return;
   }
   if(route==='/api/health'&&req.method==='GET'){db.prepare('SELECT 1').get();return response(res,{ok:true});}
   if(route==='/api/config'&&req.method==='GET')return response(res,{plans:D.plans,payments:false,gate:false});
   if(req.method!=='GET'){
    if(req.headers.origin!==origin)fail(403,'Origem não permitida.');
    const fetchSite=req.headers['sec-fetch-site'];if(fetchSite&&fetchSite!=='same-origin'&&fetchSite!=='none')fail(403,'Origem não permitida.');
   }
   if(req.method==='POST'&&['/api/auth/register','/api/auth/login','/api/auth/reset'].includes(route)){
    limit('auth:'+req.socket.remoteAddress);
    const data=await body(req);
    if(route==='/api/auth/reset'){
     if(typeof data.token!=='string'||typeof data.password!=='string'||data.password.length<12||data.password.length>128)fail(400,'Token e senha de 12 a 128 caracteres são necessários.');
     const reset=db.prepare('SELECT * FROM resets WHERE token_hash=? AND expires>?').get(digest(data.token),Date.now());if(!reset)fail(400,'Token inválido ou expirado.');const hash=await passwordHash(data.password);
     transaction(()=>{db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash,reset.user_id);db.prepare('DELETE FROM resets WHERE user_id=?').run(reset.user_id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id);audit(reset.user_id,'password.reset',reset.user_id);});return response(res,{ok:true});
    }
    const cpf=String(data.cpf||'').replace(/\D/g,'');const password=data.password;
    if(typeof password!=='string'||password.length<12||password.length>128)fail(400,'A senha deve ter de 12 a 128 caracteres.');
    limit('cpf:'+digest(cpf),10);
    if(route.endsWith('/register')){
     if(!D.validCpf(cpf)||typeof data.name!=='string'||data.name.trim().length<3||data.name.trim().length>80)fail(400,'Nome ou CPF inválido.');
     if(db.prepare('SELECT id FROM users WHERE cpf=?').get(cpf))fail(409,'Não foi possível cadastrar. Confira os dados ou entre na conta.');
     const hash=await passwordHash(password);const personal=users().find(u=>u.role==='personal');const user={id:randomUUID(),name:data.name.trim(),cpf,role:'client',personalId:personal?.id||null,schedule:[1,3,5],subscription:null};
     try{db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(user.id,cpf,hash,JSON.stringify(user));}catch{fail(409,'Não foi possível cadastrar.');}audit(user.id,'user.register',user.id);return response(res,createSession(res,user),201);
    }
    const row=db.prepare('SELECT * FROM users WHERE cpf=?').get(cpf);const valid=await verifyPassword(password,row?.password_hash||dummyHash);if(!row||!valid)fail(401,'CPF ou senha incorretos.');const user=JSON.parse(row.payload);if(user.role!==data.role)fail(401,'CPF ou senha incorretos para este perfil.');audit(user.id,'auth.login',user.id);return response(res,createSession(res,user));
   }
   const s=sessionFor(req);if(!s?.user)fail(401,'Entre na sua conta para continuar.');const actor=s.user;
   if(req.method!=='GET')csrfCheck(req,s);
   if(route==='/api/auth/me'&&req.method==='GET')return response(res,{user:publicUser(actor),csrf:s.csrf,state:publicState(actor)});
   if(route==='/api/state'&&req.method==='GET')return response(res,{state:publicState(actor)});
   if(route==='/api/auth/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(s.token_hash);res.setHeader('Set-Cookie',`dryfit_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production?'; Secure':''}`);return response(res,{ok:true});}
   if(req.method!=='POST')fail(404,'Operação não encontrada.');
   limit('write:'+actor.id,200);const data=await body(req);
   if(route==='/api/profile'){
    const name=typeof data.name==='string'?data.name.trim():'';
    const email=typeof data.email==='string'?data.email.trim():'';
    const phone=typeof data.phone==='string'?data.phone.replace(/\D/g,''):'';
    if(name.length<3||name.length>80||email.length>120||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||(phone&&!/^\d{10,13}$/.test(phone)))fail(400,'Confira seu nome, e-mail e telefone.');
    actor.name=name;actor.email=email;actor.phone=phone;updateUser(actor);audit(actor.id,'profile.update',actor.id);
    return response(res,{user:publicUser(actor),state:publicState(actor)});
   }
   if(route==='/api/preferences'){
    if(!['pt-BR','en'].includes(data.language)||!['dark','light'].includes(data.theme)||typeof data.largeText!=='boolean'||typeof data.reducedMotion!=='boolean')fail(400,'Preferências inválidas.');
    actor.preferences={language:data.language,theme:data.theme,largeText:data.largeText,reducedMotion:data.reducedMotion};updateUser(actor);
    return response(res,{user:publicUser(actor),state:publicState(actor)});
   }
   if(route==='/api/auth/password'){
    limit('password:'+actor.id,5);
    if(typeof data.currentPassword!=='string'||data.currentPassword.length>128||typeof data.newPassword!=='string'||data.newPassword.length<12||data.newPassword.length>128)fail(400,'A nova senha deve ter de 12 a 128 caracteres.');
    if(data.currentPassword===data.newPassword)fail(400,'Escolha uma senha diferente da atual.');
    const row=db.prepare('SELECT password_hash FROM users WHERE id=?').get(actor.id);
    if(!await verifyPassword(data.currentPassword,row.password_hash))fail(400,'A senha atual está incorreta.');
    const hashed=await passwordHash(data.newPassword);
    transaction(()=>{
     const current=db.prepare('SELECT password_hash FROM users WHERE id=?').get(actor.id);
     const active=db.prepare('SELECT token_hash FROM sessions WHERE token_hash=? AND expires>?').get(s.token_hash,Date.now());
     if(!active||current.password_hash!==row.password_hash)fail(409,'A sessão foi alterada. Entre novamente.');
     db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashed,actor.id);
     db.prepare('DELETE FROM sessions WHERE user_id=?').run(actor.id);
     db.prepare('DELETE FROM resets WHERE user_id=?').run(actor.id);
     audit(actor.id,'password.change',actor.id);
    });
    return response(res,createSession(res,getUser(actor.id)));
   }
   if(route==='/api/chat'){
    const user=getUser(data.clientId);if(!clientAllowed(actor,user))fail(403,'Conversa não permitida.');if(actor.role==='client'&&!user.personalId)fail(409,'A administração precisa vincular um personal antes de iniciar a conversa.');if(typeof data.text!=='string'||!data.text.trim()||data.text.length>1000)fail(400,'Mensagem inválida.');
    const message={id:randomUUID(),clientId:user.id,from:actor.id,text:data.text.trim(),at:new Date().toISOString()};db.prepare('INSERT INTO messages VALUES(?,?,?,?)').run(message.id,user.id,actor.id,JSON.stringify(message));return response(res,{state:publicState(actor)},201);
   }
   if(route==='/api/schedule'){
    const user=getUser(data.userId);if(actor.role==='client'||!clientAllowed(actor,user))fail(403,'Alteração não permitida.');if(!Array.isArray(data.days)||data.days.some(d=>!Number.isInteger(d)||d<0||d>6))fail(400,'Rotina inválida.');user.schedule=[...new Set(data.days)];updateUser(user);audit(actor.id,'schedule.update',user.id);return response(res,{state:publicState(actor)});
   }
   if(route==='/api/assign'){
    if(actor.role!=='admin')fail(403,'Apenas administração.');const user=getUser(data.userId),personal=getUser(data.personalId);if(user?.role!=='client'||personal?.role!=='personal')fail(400,'Vínculo inválido.');user.personalId=personal.id;updateUser(user);audit(actor.id,'personal.assign',user.id);return response(res,{state:publicState(actor)});
   }
   if(route==='/api/orders'){
    if(actor.role!=='client')fail(403,'Operação exclusiva do aluno.');const plan=D.plans.find(p=>p.id===data.planId);if(!plan)fail(400,'Plano inválido.');
    const existing=db.prepare('SELECT payload FROM orders WHERE user_id=? AND status=?').all(actor.id,'pending').map(r=>JSON.parse(r.payload)).find(o=>o.planId===plan.id);if(existing)return response(res,{state:publicState(actor),order:existing});
    const order={id:randomUUID(),userId:actor.id,planId:plan.id,plan:plan.name,amount:plan.price,status:'pending',at:new Date().toISOString()};db.prepare('INSERT INTO orders VALUES(?,?,?,?)').run(order.id,actor.id,'pending',JSON.stringify(order));return response(res,{order,state:publicState(actor)},201);
   }
   if(route==='/api/orders/confirm'){
    if(actor.role!=='admin')fail(403,'Apenas administração pode registrar pagamento recebido.');if(typeof data.reference!=='string'||data.reference.trim().length<3||data.reference.length>100)fail(400,'Informe uma referência do recebimento.');
    transaction(()=>{const row=db.prepare('SELECT payload,status FROM orders WHERE id=?').get(data.orderId);if(!row)fail(404,'Pedido não encontrado.');if(row.status==='paid')return;const order=JSON.parse(row.payload);const user=getUser(order.userId);D.subscribe(user,order.planId,D.day(new Date()));updateUser(user);order.status='paid';order.reference=data.reference.trim();order.confirmedAt=new Date().toISOString();db.prepare('UPDATE orders SET status=?,payload=? WHERE id=?').run('paid',JSON.stringify(order),order.id);audit(actor.id,'payment.manual.confirm',order.id);});return response(res,{state:publicState(actor)});
   }
   if(route==='/api/attendance/manual'){
    if(actor.role!=='admin')fail(403,'Presença manual exige administração.');if(typeof data.reason!=='string'||data.reason.trim().length<3||data.reason.length>200)fail(400,'Informe o motivo do registro manual.');
    const user=getUser(data.userId);if(!clientAllowed(actor,user))fail(404,'Aluno não encontrado.');let result;
    transaction(()=>{const local={users:[user],attendance:db.prepare('SELECT payload FROM attendance WHERE user_id=?').all(user.id).map(r=>JSON.parse(r.payload))};result=D.checkIn(local,user.id,new Date().toISOString());if(result.ok){const visit=local.attendance.at(-1);visit.id=randomUUID();visit.source='manual';visit.reason=data.reason.trim();db.prepare('INSERT INTO attendance VALUES(?,?,?,?)').run(visit.id,user.id,visit.day,JSON.stringify(visit));audit(actor.id,'attendance.manual',user.id);}});return response(res,{...result,state:publicState(actor)});
   }
   if(route==='/api/gate'||route==='/api/checkout')fail(503,'Integração ainda não configurada. Solicite atendimento à administração.');
   fail(404,'Operação não encontrada.');
  }catch(error){const status=error.status||500;if(status===500)console.error('Falha interna:',error.name);if(!res.headersSent)response(res,{error:status===500?'Falha interna. Tente novamente.':error.message},status);else res.end();}
 });
 const dummySalt='00000000000000000000000000000000';
 // Hash somente para equalizar a verificação de contas inexistentes. Nunca cria conta.
 const dummyHash=dummySalt+':'+require('node:crypto').scryptSync('dummy-password-unusable',dummySalt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString('hex');
 server.requestTimeout=15000;server.headersTimeout=10000;
 return {server,store,close:()=>{clearInterval(cleanup);return new Promise(resolve=>server.close(()=>{db.close();resolve();}));}};
}
if(require.main===module){const app=createApp();const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';app.server.listen(port,host,()=>console.log(`DRY FIT: ${process.env.APP_ORIGIN||'http://localhost:'+port}\nDemo: /demo/`));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.close().then(()=>process.exit()));}
module.exports={createApp};

