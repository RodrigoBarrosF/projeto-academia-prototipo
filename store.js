'use strict';
const { DatabaseSync } = require('node:sqlite');
const { randomBytes, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const fs = require('node:fs');
const path = require('node:path');
const derive = promisify(scrypt);
async function passwordHash(password) {
 const salt=randomBytes(16).toString('hex');
 const hash=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 return salt+':'+hash.toString('hex');
}
async function verifyPassword(password,stored) {
 const [salt,hex]=stored.split(':');
 const hash=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 return timingSafeEqual(hash,Buffer.from(hex,'hex'));
}
const digest=value=>createHash('sha256').update(value).digest('hex');
function openDatabase(filename) {
 if(filename!==':memory:')fs.mkdirSync(path.dirname(path.resolve(filename)),{recursive:true});
 const db=new DatabaseSync(filename,{timeout:5000});
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,cpf TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS attendance(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),day TEXT NOT NULL,payload TEXT NOT NULL,UNIQUE(user_id,day));
 CREATE TABLE IF NOT EXISTS accesses(id INTEGER PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES users(id),sender_id TEXT NOT NULL REFERENCES users(id),payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,actor TEXT,action TEXT NOT NULL,target TEXT,at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS resets(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
 PRAGMA user_version=1;`);
 const getUser=id=>{const row=db.prepare('SELECT payload FROM users WHERE id=?').get(id);return row?JSON.parse(row.payload):null;};
 const users=()=>db.prepare('SELECT payload FROM users').all().map(r=>JSON.parse(r.payload));
 const updateUser=user=>db.prepare('UPDATE users SET payload=? WHERE id=?').run(JSON.stringify(user),user.id);
 const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const value=fn();db.exec('COMMIT');return value;}catch(error){db.exec('ROLLBACK');throw error;}};
 const audit=(actor,action,target)=>db.prepare('INSERT INTO audit(actor,action,target,at) VALUES(?,?,?,?)').run(actor,action,target,new Date().toISOString());
 return {db,getUser,users,updateUser,transaction,audit};
}
module.exports={openDatabase,passwordHash,verifyPassword,digest};
