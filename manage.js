'use strict';
const readline=require('node:readline/promises');
const {randomUUID,randomBytes}=require('node:crypto');
const {backup}=require('node:sqlite');
const path=require('node:path');
const fs=require('node:fs');
const {openDatabase,passwordHash,digest}=require('./store');
const D=require('../domain');
(async()=>{
 const store=openDatabase(process.env.DB_PATH||path.join(__dirname,'../data/dryfit.sqlite'));
 try{
 const command=process.argv[2];
 if(command==='backup'){
  const directory=path.join(__dirname,'../backups');fs.mkdirSync(directory,{recursive:true});const target=path.join(directory,'dryfit-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');await backup(store.db,target);console.log('Backup criado:',target);return;
 }
 const rl=readline.createInterface({input:process.stdin,output:process.stdout});
 try{
 if(command==='create-user'){
  const name=(await rl.question('Nome: ')).trim();const cpf=(await rl.question('CPF: ')).replace(/\D/g,'');const role=(await rl.question('Perfil (admin/personal): ')).trim();
  if(!D.validCpf(cpf)||name.length<3||name.length>80||!['admin','personal'].includes(role))throw Error('Dados inválidos.');
  const password=randomBytes(18).toString('base64url');const hashed=await passwordHash(password);const user={id:randomUUID(),name,cpf,role,schedule:[],subscription:null,personalId:null};store.db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(user.id,cpf,hashed,JSON.stringify(user));store.audit(user.id,'user.provision',user.id);console.log('Conta criada. Senha inicial gerada (entregue por canal privado):',password);
 }else if(command==='reset-password'){
  const cpf=(await rl.question('CPF da conta após verificar identidade: ')).replace(/\D/g,'');const row=store.db.prepare('SELECT id FROM users WHERE cpf=?').get(cpf);if(!row)throw Error('Conta não encontrada.');const token=randomBytes(32).toString('hex');store.db.prepare('DELETE FROM resets WHERE user_id=?').run(row.id);store.db.prepare('INSERT INTO resets VALUES(?,?,?)').run(digest(token),row.id,Date.now()+15*60000);store.audit('operator','password.recovery.issue',row.id);console.log('Token de uso único, válido por 15 minutos (entregue por canal privado):',token);
 }else throw Error('Use create-user, reset-password ou backup.');
 }finally{rl.close();}
 }finally{store.db.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
