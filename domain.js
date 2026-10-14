/* Regras da demonstração. Nenhuma autorização de produção deve depender do navegador. */
(function (root) {
  const plans = [
    { id: 'essential', name: 'Essential', price: 99.9, days: 30, perks: ['Musculação', 'Acesso no horário de funcionamento', 'Histórico de presença'] },
    { id: 'performance', name: 'Performance', price: 149.9, days: 30, perks: ['Tudo do Essential', 'Aulas coletivas', 'Acompanhamento pelo personal'] },
    { id: 'complete', name: 'Complete', price: 199.9, days: 30, perks: ['Tudo do Performance', 'Avaliação física mensal', 'Revisão do treino'] }
  ];
  const day = date => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date(date));
  function addDays(date, count) { const d = new Date(date + 'T12:00:00-03:00'); d.setDate(d.getDate() + count); return day(d); }
  function validCpf(value) {
    const cpf = String(value).replace(/\D/g, '');
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
    return [9, 10].every(length => {
      const sum = cpf.slice(0, length).split('').reduce((total, digit, i) => total + Number(digit) * (length + 1 - i), 0);
      const digit = (sum * 10) % 11;
      return Number(cpf[length]) === (digit === 10 ? 0 : digit);
    });
  }
  function status(user, today) {
    if (!user.subscription) return 'Sem plano';
    if (user.subscription.end < today) return 'Vencido';
    return 'Ativo';
  }
  function checkIn(state, userId, now) {
    const user = state.users.find(u => u.id === userId && u.role === 'client');
    const today = day(now);
    if (!user || status(user, today) !== 'Ativo') return { ok: false, message: 'Entrada bloqueada: é necessário um plano ativo.' };
    if (state.attendance.some(a => a.userId === userId && a.day === today)) return { ok: false, message: 'A presença de hoje já foi registrada.' };
    state.attendance.push({ id: 'visit-' + Date.now(), userId, day: today, at: now });
    return { ok: true, message: 'Entrada liberada na simulação. Presença registrada!' };
  }
  function subscribe(user, planId, today) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error('Plano inválido');
    const active = status(user, today) === 'Ativo';
    const start = active ? addDays(user.subscription.end, 1) : today;
    user.subscription = { planId, start: active ? user.subscription.start : today, end: addDays(start, plan.days - 1) };
    return plan;
  }
  function absences(state, user, today, period = 7) {
    const days = [];
    for (let i = 1; i <= period; i++) {
      const date = addDays(today, -i);
      const weekday = new Date(date + 'T12:00:00-03:00').getDay();
      if (user.subscription && date >= user.subscription.start && date <= user.subscription.end && user.schedule.includes(weekday) && !state.attendance.some(a => a.userId === user.id && a.day === date)) days.push(date);
    }
    return days;
  }
  function seed(now) {
    const today = day(now);
    return {
      version: 1,
      users: [
        { id: 'ana', name: 'Ana Oliveira', cpf: '52998224725', role: 'client', personalId: 'rafael', schedule: [1, 3, 5], subscription: { planId: 'performance', start: addDays(today, -15), end: addDays(today, 14) }, demo: true },
        { id: 'bruno', name: 'Bruno Lima', cpf: '11144477735', role: 'client', personalId: 'rafael', schedule: [1, 2, 4], subscription: { planId: 'essential', start: addDays(today, -35), end: addDays(today, -6) }, demo: true },
        { id: 'carla', name: 'Carla Santos', cpf: '12345678909', role: 'client', personalId: 'rafael', schedule: [2, 4, 6], subscription: { planId: 'complete', start: addDays(today, -8), end: addDays(today, 21) }, demo: true },
        { id: 'rafael', name: 'Rafael Costa', cpf: '98765432100', role: 'personal', demo: true },
        { id: 'admin', name: 'Gestão DRY FIT', cpf: '01234567890', role: 'admin', demo: true }
      ],
      attendance: [{ id: 'v1', userId: 'ana', day: addDays(today, -2), at: addDays(today, -2) + 'T10:00:00-03:00' }, { id: 'v2', userId: 'carla', day: today, at: today + 'T08:00:00-03:00' }],
      accesses: [{ userId: 'ana', at: today + 'T09:00:00-03:00' }],
      messages: [{ id: 'm1', clientId: 'ana', from: 'rafael', text: 'Oi, Ana! Como foi o último treino? Me conta se precisar ajustar algum exercício.', at: now }],
      payments: []
    };
  }
  const api = { plans, day, addDays, validCpf, status, checkIn, subscribe, absences, seed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DryFit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
