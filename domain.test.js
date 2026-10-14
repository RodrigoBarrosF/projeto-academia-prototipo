const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('./domain');
const now = '2026-10-14T15:00:00Z';
test('entrada ativa, duplicada e vencida', () => {
 const state=D.seed(now);
 assert.equal(D.checkIn(state,'ana',now).ok,true);
 assert.equal(D.checkIn(state,'ana',now).ok,false);
 assert.equal(D.checkIn(state,'bruno',now).ok,false);
 assert.equal(state.attendance.filter(a=>a.userId==='ana'&&a.day==='2026-10-14').length,1);
});
test('validade inclui o ultimo dia e bloqueia o seguinte',()=>{
 const user={subscription:{end:'2026-10-14'}};
 assert.equal(D.status(user,'2026-10-14'),'Ativo');
 assert.equal(D.status(user,'2026-10-15'),'Vencido');
});
test('assinatura inicial e renovacao preservam dias restantes',()=>{
 const user={subscription:null};
 D.subscribe(user,'essential','2026-10-14');
 assert.equal(user.subscription.end,'2026-11-12');
 D.subscribe(user,'performance','2026-10-15');
 assert.equal(user.subscription.end,'2026-12-12');
 assert.equal(user.subscription.start,'2026-10-14');
});
test('faltas excluem hoje e dias fora da vigencia',()=>{
 const state=D.seed(now);const user=state.users[0];
 user.schedule=[1,2,3,4,5,6,0];user.subscription.start='2026-10-12';
 assert.deepEqual(D.absences(state,user,'2026-10-14'),['2026-10-13']);
});
test('CPF valida digitos e rejeita valores repetidos',()=>{
 assert.equal(D.validCpf('529.982.247-25'),true);
 assert.equal(D.validCpf('52998224726'),false);
 assert.equal(D.validCpf('11111111111'),false);
});
