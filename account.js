/* Menu de conta compartilhado entre a demonstração e a versão conectada. */
(() => {
 const connected = typeof api === 'function';
 const defaults = { language: 'pt-BR', theme: 'dark', largeText: false, reducedMotion: false };
 let preferences = {...defaults};
 let currentUserId = null;
 const translations = {
 'Planos':'Plans','Experiência':'Experience','Área do personal':'Trainer area','Área do aluno ↗':'Member area ↗','Administração':'Administration','Administração · demo':'Administration · demo','Demonstração':'Demo',
 'Meu perfil':'My profile','Configurações':'Settings','Idioma':'Language','Alterar senha':'Change password','Sair da conta':'Sign out','Sair da conta →':'Sign out →','ALUNO':'MEMBER','PERSONAL':'TRAINER','ADMINISTRADOR':'ADMINISTRATOR',
 'Dados da conta':'Account details','Nome completo':'Full name','E-mail de contato':'Contact email','Telefone de contato':'Contact phone','Seu CPF e perfil de acesso não podem ser alterados nesta tela.':'Your CPF and access role cannot be changed here.',
 'Salvar alterações':'Save changes','Salvar preferências':'Save preferences','Preferências da sua conta':'Your account preferences','Aparência':'Appearance','Escuro':'Dark','Claro':'Light','Português (Brasil)':'Portuguese (Brazil)','Inglês':'English','Texto ampliado':'Larger text','Reduzir animações':'Reduce animations','A preferência de movimento do seu sistema também é respeitada.':'Your system motion preference is also respected.',
 'Segurança da conta':'Account security','Senha atual':'Current password','Nova senha':'New password','Confirmar nova senha':'Confirm new password','Use de 12 a 128 caracteres. Após salvar, as outras sessões serão encerradas.':'Use 12 to 128 characters. Other sessions will be signed out after saving.', 'Atualizar senha':'Update password','Mostrar':'Show','Ocultar':'Hide','Fechar janela':'Close dialog',
 'Essas contas são fictícias e não possuem senha. Cadastre uma conta de teste para experimentar a troca de senha.':'These are fictional passwordless accounts. Create a test account to try changing a password.',
 'O e-mail e o telefone são apenas dados de contato. Recuperação automática por mensagem ainda não está integrada.':'Email and phone are contact details only. Automatic recovery messaging is not connected yet.',
 'VISÃO GERAL':'OVERVIEW','Visão geral':'Overview','Meu plano':'My plan','Alunos':'Members','Presenças':'Attendance','Conversas':'Messages','Controle de entrada':'Entry control','Entrada simulada':'Simulated entry','Recebimentos':'Payments',
 'ÁREA DO ALUNO':'MEMBER AREA','ÁREA DO PERSONAL':'TRAINER AREA','GESTÃO':'MANAGEMENT','Seu próximo passo.':'Your next step.','Seu plano, em dia.':'Your plan, up to date.','Pessoas antes de números.':'People before numbers.','Constância registrada.':'Consistency recorded.','Conversa que aproxima.':'A conversation that connects.','Entrada sob controle.':'Entry under control.','Recebimentos e pedidos.':'Payments and requests.',
 'Ativo':'Active','Vencido':'Expired','Sem plano':'No plan','Treinos registrados':'Workouts recorded','Seu plano':'Your plan','Vencimento':'Expiry date','Último dia de acesso':'Last access day','Registros no servidor':'Server records','Histórico demonstrativo':'Demo history','UM DIA DE CADA VEZ':'ONE DAY AT A TIME','SEU ACOMPANHAMENTO':'YOUR COACHING',
 'O treino de hoje':'Today’s workout','começa com você.':'starts with you.','Registre sua entrada e acompanhe sua constância.':'Track your attendance and consistency.','Consultar entrada ↗':'Check entry ↗','Simular entrada ↗':'Simulate entry ↗','Abrir conversa →':'Open conversation →','Próximos passos':'Next steps','Confira a validade do seu plano':'Check your plan expiry','Defina os dias da sua rotina':'Set your training days','Converse sobre seu próximo treino':'Discuss your next workout','Personal ainda não vinculado':'No trainer assigned yet','Seu profissional vinculado pela administração.':'Your trainer assigned by management.','Consulte a administração para confirmar seu personal.':'Contact management to confirm your trainer.',
 'Alunos vinculados':'Assigned members','Neste perfil':'In this account','Alunos no site hoje':'Members on the site today','Presenças hoje':'Attendance today','Registros de presença':'Attendance records','Alunos com faltas':'Members with absences','Dias previstos nos últimos 7 dias':'Scheduled days over the last 7 days','Presença da semana':'Weekly attendance','Últimos 7 dias · registros de entrada':'Last 7 days · entry records','Precisa de atenção':'Needs attention','Nenhuma pendência no momento.':'No pending items right now.','Ver →':'View →','Seus alunos':'Your members','Buscar por nome':'Search by name','Digite um nome':'Enter a name','Aluno':'Member','Plano':'Plan','Situação':'Status','Faltas / 7 dias':'Absences / 7 days','Detalhes':'Details','Abrir →':'Open →','Nenhum aluno encontrado.':'No members found.',
 'Faltas: dias de treino previstos, encerrados e sem presença, dentro da vigência do plano. Hoje não é contabilizado como falta.':'Absences are completed scheduled training days without attendance within the plan period. Today is not counted as an absence.',
 'Histórico de entradas':'Entry history','Exportar CSV ↓':'Export CSV ↓','Data':'Date','Horário':'Time','Origem':'Source','Registro administrativo':'Administrative record','Equipamento':'Equipment','Nenhuma entrada registrada.':'No entries recorded.',
 'Seu personal':'Your trainer','Conversa salva no servidor':'Conversation saved on the server','Conversa vinculada ao acompanhamento. As mensagens são atualizadas automaticamente.':'A coaching conversation. Messages update automatically.','Comece uma conversa sobre seu treino.':'Start a conversation about your workout.','Sua mensagem':'Your message','Escreva uma mensagem…':'Write a message…','Enviar ↗':'Send ↗','Nenhum aluno para conversar.':'No members to message.',
 'CONTROLE DE ENTRADA':'ENTRY CONTROL','Presença com validação.':'Verified attendance.','A catraca ainda não está integrada. Alunos não podem registrar presença remotamente. A administração pode registrar uma entrada verificada no balcão.':'The turnstile is not integrated yet. Members cannot mark attendance remotely. Management can record an entry verified at reception.',
 'Motivo / referência do registro':'Reason / record reference','Entrada conferida na recepção':'Entry verified at reception','Registrar presença verificada':'Record verified attendance','Procure a recepção para confirmar sua entrada.':'Visit reception to confirm your entry.','Integração com equipamento pendente.':'Equipment integration pending.',
 'Pedidos de assinatura':'Membership requests','Nenhum pedido nesta conta.':'No requests on this account.','Nenhum pedido.':'No requests.','Confirmado':'Confirmed','Aguardando confirmação':'Awaiting confirmation','Pendente':'Pending','Registrar recebimento':'Record payment','Registre o recebimento apenas após conferir o pagamento por um canal externo. A cobrança online ainda não está integrada.':'Record payments only after verifying them through an external channel. Online payment is not integrated yet.',
 'Registre o recebimento apenas após conferir o pagamento por um canal externo.':'Record payment only after verifying it through an external channel.','Confirmar recebimento':'Confirm payment','Referência do comprovante':'Receipt reference','Confirme apenas valores já recebidos. Esse registro ativa o plano e fica no histórico de auditoria.':'Confirm received funds only. This activates the plan and creates an audit record.',
 'ACOMPANHAMENTO':'COACHING','Faltas nos últimos 7 dias':'Absences in the last 7 days','Sem faltas nos dias previstos.':'No absences on scheduled days.','Dias de treino previstos':'Scheduled training days','Dom':'Sun','Seg':'Mon','Ter':'Tue','Qua':'Wed','Qui':'Thu','Sex':'Fri','Sáb':'Sat','Salvar rotina':'Save schedule','Conversar com aluno →':'Message member →','Personal responsável':'Assigned trainer','Salvar vínculo':'Save assignment',
 'A ativação depende da confirmação do recebimento pela administração.':'Activation depends on management confirming payment.','Uma renovação adiciona 30 dias após a validade atual. A ativação depende da confirmação do recebimento pela administração.':'Renewing adds 30 days after the current expiry. Activation requires payment confirmation by management.',
 'SEU RITMO':'YOUR PACE','MAIS POSSIBILIDADES':'MORE POSSIBILITIES','Selecionar plano ↗':'Select plan ↗','Começar agora ↗':'Start now ↗','Solicitação de plano. Ativação após confirmação.':'Plan request. Activation after confirmation.','Musculação':'Weight training','Acesso no horário de funcionamento':'Access during opening hours','Histórico de presença':'Attendance history','Tudo do Essential':'Everything in Essential','Aulas coletivas':'Group classes','Acompanhamento pelo personal':'Trainer support','Tudo do Performance':'Everything in Performance','Avaliação física mensal':'Monthly fitness assessment','Revisão do treino':'Workout review',
 'SOLICITAÇÃO DE PLANO':'MEMBERSHIP REQUEST','Solicitar plano →':'Request plan →','O plano será ativado após a academia confirmar o recebimento. A cobrança online ainda não está conectada.':'Your plan will activate after the gym confirms payment. Online payment is not connected yet.',
 'Bom ter você aqui.':'Good to have you here.','Comece sua jornada.':'Start your journey.','Sua conta é validada no servidor. Use uma senha de pelo menos 12 caracteres.':'Your account is verified by the server. Use a password of at least 12 characters.','CPF':'CPF (Brazilian ID)','Senha':'Password','Entrar →':'Sign in →','Criar conta →':'Create account →','Solicito meu cadastro na academia.':'I request a gym account.','Já tenho cadastro':'I already have an account','Ainda não tenho cadastro':'I do not have an account yet','Recuperar acesso →':'Recover access →','Recuperar acesso':'Recover access','Token de recuperação':'Recovery token','Definir nova senha':'Set new password',
 'Solicite à administração um token após a verificação da sua identidade. Ele é válido por 15 minutos e pode ser usado uma única vez.':'Ask management for a token after identity verification. It is valid for 15 minutes and can be used once.',
 'O próximo nível':'The next level','é':'is','o seu.':'yours.','Treine com propósito. Acompanhe sua evolução.':'Train with purpose. Track your progress.','Uma experiência conectada, dentro e fora da academia.':'A connected experience, inside and outside the gym.','Encontre seu plano ↗':'Find your plan ↗','Já sou aluno →':'I am a member →','01 / Constância':'01 / Consistency','02 / Movimento':'02 / Movement','03 / Evolução':'03 / Progress','MENOS DESCULPAS.':'FEWER EXCUSES.','MAIS MOVIMENTO.':'MORE MOVEMENT.',
 'UMA ROTINA QUE FAZ SENTIDO':'A ROUTINE THAT MAKES SENSE','O simples.':'The essentials.','Levado a sério.':'Taken seriously.','Seu treino, acompanhado.':'Your training, supported.','Converse com o personal e mantenha seu acompanhamento em um só lugar.':'Talk with your trainer and keep your coaching in one place.','Seu plano, sem dúvida.':'Your membership, clear.','Consulte validade, benefícios e histórico das assinaturas.':'Check expiry, benefits and membership history.','Sua presença conta.':'Your attendance matters.','Veja seus dias de treino e experimente a entrada digital simulada.':'See your training days and explore simulated digital entry.',
 'ESCOLHA SEU RITMO':'CHOOSE YOUR PACE','Um plano para':'A plan for','seu próximo passo.':'your next step.','Consulte condições e disponibilidade':'Check terms and availability','com a administração.':'with management.','SEU TREINO CONECTADO':'YOUR CONNECTED TRAINING','Uma rotina. Um lugar.':'One routine. One place.','Entre na sua conta para acompanhar seu plano e conversar com seu personal.':'Sign in to track your plan and talk with your trainer.','Entrar na conta →':'Sign in →','Seu próximo nível começa com constância.':'Your next level starts with consistency.',
 'Perfil atualizado.':'Profile updated.','Preferências salvas.':'Preferences saved.','Senha atualizada. As outras sessões foram encerradas.':'Password updated. Other sessions have been signed out.','A confirmação não corresponde à nova senha.':'Confirmation does not match the new password.','A senha atual está incorreta.':'The current password is incorrect.','Confira seu nome, e-mail e telefone.':'Check your name, email and phone.','Escolha uma senha diferente da atual.':'Choose a different password.','A nova senha deve ter de 12 a 128 caracteres.':'The new password must have 12 to 128 characters.','CPF ou senha incorretos.':'Incorrect CPF or password.','CPF ou senha incorretos para este perfil.':'Incorrect CPF or password for this role.',
 'Entre na sua conta para continuar.':'Sign in to continue.','Confira as informações e tente novamente.':'Check the information and try again.'
 };
 const t = text => preferences.language === 'en' ? (translations[text] || text) : text;
 function translateText(text) {
  const value=text.trim();if(!value)return text;
  let translated=t(value);
  if(translated===value&&preferences.language==='en'){
   translated=value.replace(/^Plano atual: /,'Current plan: ').replace(/ · Válido até /,' · Valid until ').replace(/Aguardando confirmação/g,'Awaiting confirmation').replace(/Confirmado/g,'Confirmed').replace(/Pendente/g,'Pending').replace(/ acessos registrados$/,' recorded sign-ins').replace(/ falta\(s\) nos dias previstos$/,' absence(s) on scheduled days').replace(/^Plano vencido$/,'Expired plan').replace(/^Plano sem plano$/,'No active plan').replace(/^\/ 30 dias$/,'/ 30 days').replace(/^\/ 30 dias$/,'/ 30 days').replace(/^DRY FIT \/ ALUNO$/,'DRY FIT / MEMBER').replace(/^DRY FIT \/ ADMINISTRADOR$/,'DRY FIT / ADMINISTRATOR');
  }
  return text.replace(value,translated);
 }
 function translate(root=document.body) {
  if(preferences.language!=='en')return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;while((node=walker.nextNode())){
   if(node.parentElement.closest('script,style,.message,.account-name,input,textarea'))continue;
   node.nodeValue=translateText(node.nodeValue);
  }
  root.querySelectorAll('[aria-label],[placeholder]').forEach(el=>{for(const attr of ['aria-label','placeholder'])if(el.hasAttribute(attr))el.setAttribute(attr,t(el.getAttribute(attr)));});
 }
 function applyPreferences() {
  document.documentElement.lang=preferences.language;
  document.documentElement.dataset.theme=preferences.theme;
  document.documentElement.classList.toggle('account-large-text',preferences.largeText);
  document.documentElement.classList.toggle('account-reduced-motion',preferences.reducedMotion);
  window.DryAccount.locale=preferences.language==='en'?'en-US':'pt-BR';
 }
 function loadPreferences() {
  if(session?.id===currentUserId)return;
  currentUserId=session?.id||null;
  if(session){preferences={...defaults,...session.preferences};}
  else {try{preferences={...defaults,...JSON.parse(localStorage.getItem('dryfit-appearance'))};}catch{preferences={...defaults};}}
  if(!['en','pt-BR'].includes(preferences.language))preferences.language='pt-BR';
 }
 const headerNav=document.querySelector('header nav');
 const originalNav=headerNav.innerHTML;
 function initials(name){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
 function accountHeader() {
  if(!session){headerNav.innerHTML=originalNav;return;}
  const role={client:'ALUNO',personal:'PERSONAL',admin:'ADMINISTRADOR'}[session.role];
  headerNav.innerHTML=`<span class="account-role">${role}</span><div class="account-control"><button class="account-trigger" id="accountTrigger" type="button" aria-expanded="false" aria-controls="accountDropdown" aria-label="Abrir menu da conta"><span class="avatar" aria-hidden="true">${escape(initials(session.name))}</span><span class="account-name">${escape(session.name)}</span><span class="chevron" aria-hidden="true">⌄</span></button><div id="accountDropdown" class="account-dropdown" hidden><div class="account-summary"><strong class="account-name">${escape(session.name)}</strong><small>${role} · DRY FIT</small></div><button data-account="profile">Meu perfil <span aria-hidden="true">↗</span></button><button data-account="settings">Configurações <span aria-hidden="true">⚙</span></button><button data-account="language">Idioma <span aria-hidden="true">◎</span></button><button data-account="password">Alterar senha <span aria-hidden="true">◈</span></button><button data-action="logout" class="account-logout">Sair da conta <span aria-hidden="true">→</span></button></div></div>`;
 }
 const originalRender=render;
 render=function(){loadPreferences();applyPreferences();originalRender();accountHeader();translate();};
 const originalOpenModal=openModal;
 openModal=function(html){originalOpenModal(html);translate(modal);};
 const originalNotify=notify;
 notify=function(message){originalNotify(t(message));};
 function closeAccount(focus=false){const menu=document.getElementById('accountDropdown'),button=document.getElementById('accountTrigger');if(menu)menu.hidden=true;if(button){button.setAttribute('aria-expanded','false');if(focus)button.focus();}}
 function profile(){
  openModal(`<p class="eyebrow">DRY FIT / ${t({client:'ALUNO',personal:'PERSONAL',admin:'ADMINISTRADOR'}[session.role])}</p><h2 id="modalTitle">Meu perfil</h2><p class="muted">Dados da conta</p><form id="accountProfileForm"><label>Nome completo<input name="name" value="${escape(session.name)}" autocomplete="name" required minlength="3" maxlength="80"></label><label>E-mail de contato<input name="email" type="email" value="${escape(session.email||'')}" autocomplete="email" maxlength="120"></label><label>Telefone de contato<input name="phone" type="tel" value="${escape(session.phone||'')}" autocomplete="tel" maxlength="20"></label><p class="muted small">CPF: ***.***.***-${escape(session.cpf.slice(-2))}</p><p class="muted small">Seu CPF e perfil de acesso não podem ser alterados nesta tela.</p><p class="muted small">O e-mail e o telefone são apenas dados de contato. Recuperação automática por mensagem ainda não está integrada.</p><p class="form-error" role="alert"></p><button class="button" type="submit">Salvar alterações</button></form>`);
 }
 function settings(languageOnly=false){
  openModal(`<p class="eyebrow">DRY FIT / ${languageOnly?'LANGUAGE':'PREFERENCES'}</p><h2 id="modalTitle">${languageOnly?'Idioma':'Configurações'}</h2><p class="muted">Preferências da sua conta</p><form id="accountPreferencesForm"><label>Idioma<select name="language"><option value="pt-BR" ${preferences.language==='pt-BR'?'selected':''}>Português (Brasil)</option><option value="en" ${preferences.language==='en'?'selected':''}>Inglês</option></select></label>${languageOnly?'':`<label>Aparência<select name="theme"><option value="dark" ${preferences.theme==='dark'?'selected':''}>Escuro</option><option value="light" ${preferences.theme==='light'?'selected':''}>Claro</option></select></label><label class="checkbox"><input type="checkbox" name="largeText" ${preferences.largeText?'checked':''}> Texto ampliado</label><label class="checkbox"><input type="checkbox" name="reducedMotion" ${preferences.reducedMotion?'checked':''}> Reduzir animações</label><p class="muted small">A preferência de movimento do seu sistema também é respeitada.</p>`}<p class="form-error" role="alert"></p><button class="button" type="submit">Salvar preferências</button></form>`);
 }
 function password(){
  openModal(`<p class="eyebrow">DRY FIT / SECURITY</p><h2 id="modalTitle">Alterar senha</h2><p class="muted">Segurança da conta</p>${!connected&&session.demo?'<p>Essas contas são fictícias e não possuem senha. Cadastre uma conta de teste para experimentar a troca de senha.</p>':`<form id="accountPasswordForm"><label>Senha atual<input name="currentPassword" type="password" required maxlength="128" autocomplete="current-password"></label><label>Nova senha<input name="newPassword" type="password" required minlength="${connected?12:8}" maxlength="128" autocomplete="new-password"></label><label>Confirmar nova senha<input name="confirmation" type="password" required minlength="${connected?12:8}" maxlength="128" autocomplete="new-password"></label><p class="muted small">${connected?'Use de 12 a 128 caracteres. Após salvar, as outras sessões serão encerradas.':'Demonstração local: use uma senha de teste de pelo menos 8 caracteres.'}</p><p class="form-error" role="alert"></p><button class="button" type="submit">Atualizar senha</button></form>`}`);
 }
 document.addEventListener('click',event=>{
  const trigger=event.target.closest('#accountTrigger');
  if(trigger){const menu=document.getElementById('accountDropdown');menu.hidden=!menu.hidden;trigger.setAttribute('aria-expanded',String(!menu.hidden));return;}
  const item=event.target.closest('[data-account]');
  if(item&&session){closeAccount();({profile,settings,language:()=>settings(true),password}[item.dataset.account])();return;}
  if(!event.target.closest('.account-control'))closeAccount();
 });
 document.addEventListener('keydown',event=>{
  const menu=document.getElementById('accountDropdown'),trigger=document.getElementById('accountTrigger');if(!menu||menu.hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeAccount(true);}
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)&&event.target.closest('.account-control')){
   event.preventDefault();const items=[...menu.querySelectorAll('button')];let index=items.indexOf(document.activeElement);
   index=event.key==='Home'?0:event.key==='End'?items.length-1:event.key==='ArrowDown'?(index+1)%items.length:(index-1+items.length)%items.length;items[index].focus();
  }
 });
 document.addEventListener('focusin',event=>{if(!event.target.closest('.account-control'))closeAccount();});
 // Impede que os manipuladores gerais de formulários executem estes fluxos duas vezes.
 document.addEventListener('submit',async event=>{
  const form=event.target;if(!form.id.startsWith('account'))return;
  event.preventDefault();event.stopImmediatePropagation();if(!session)return;
  const submit=form.querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;
  const data=new FormData(form);const userId=session.id;
  try{
   if(form.id==='accountProfileForm'){
    const payload={name:data.get('name').trim(),email:data.get('email').trim(),phone:data.get('phone').replace(/\D/g,'')};
    if(payload.name.length<3||payload.name.length>80||(payload.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))||(payload.phone&&!/^\d{10,13}$/.test(payload.phone)))throw Error('Confira seu nome, e-mail e telefone.');
    if(connected)await api('/profile',payload);else{Object.assign(session,payload);save();}
    closeModal();render();notify('Perfil atualizado.');
   }
   if(form.id==='accountPreferencesForm'){
    const next={...preferences,language:data.get('language')};
    if(data.has('theme'))Object.assign(next,{theme:data.get('theme'),largeText:data.has('largeText'),reducedMotion:data.has('reducedMotion')});
    if(connected)await api('/preferences',next);else{session.preferences=next;save();}
    preferences=next;try{localStorage.setItem('dryfit-appearance',JSON.stringify(next));}catch{}
    closeModal();render();notify('Preferências salvas.');
   }
   if(form.id==='accountPasswordForm'){
    const currentPassword=data.get('currentPassword'),newPassword=data.get('newPassword');
    if(newPassword!==data.get('confirmation'))throw Error('A confirmação não corresponde à nova senha.');
    if(newPassword===currentPassword)throw Error('Escolha uma senha diferente da atual.');
    if(connected){const result=await api('/auth/password',{currentPassword,newPassword});csrf=result.csrf;session=result.user;state=result.state;}
    else {if(await hash(currentPassword,session.salt)!==session.passwordHash)throw Error('A senha atual está incorreta.');const salt=crypto.randomUUID();const passwordHash=await hash(newPassword,salt);if(session?.id!==userId)throw Error('Entre na sua conta para continuar.');Object.assign(session,{salt,passwordHash});save();}
    closeModal();render();notify(connected?'Senha atualizada. As outras sessões foram encerradas.':'Senha de teste atualizada.');
   }
  }catch(error){const output=form.querySelector('.form-error');if(output)output.textContent=t(error.message);}finally{submit.disabled=false;}
 },true);
 window.DryAccount={locale:'pt-BR',translate,t};
 render();
})();
