# DRY FIT — base conectada + demonstração

Projeto independente do portfólio. Duas versões:

- **Conectada:** execute o servidor e abra http://localhost:3000/. Contas, sessões, mensagens, planos e presenças ficam em SQLite no servidor.
- **Demonstração:** http://localhost:3000/demo/. Dados fictícios no navegador, botões de perfil sem senha e nenhuma comunicação com a API. Também funciona como site estático para apresentações.

## Iniciar no Windows

Requer Node.js 24.15 ou mais recente da série 24 (testado em 24.21). Sem dependências externas para instalar.

Abra um terminal na pasta dry-fit:

```powershell
Copy-Item .env.example .env
npm.cmd start
```

Abra http://localhost:3000/. Não use Live Server para a versão conectada: ele não executa a API. GitHub Pages pode hospedar a demonstração, mas não este servidor.

## Primeiras contas

Em outro terminal, na pasta dry-fit:

```powershell
npm.cmd run create-user
```

O comando solicita nome, CPF e perfil (admin ou personal). A senha inicial é gerada aleatoriamente e mostrada uma única vez no terminal. Entregue por canal privado, nunca publique no repositório. Use dados fictícios durante desenvolvimento. Alunos se cadastram pela interface com senha de 12 a 128 caracteres.

Cadastre um personal antes dos alunos para receber o vínculo inicial. O administrador pode alterar o vínculo em Alunos → Abrir → Personal responsável. Contas profissionais não podem ser criadas pelo formulário público.

## O que já funciona no servidor

- Registro de aluno, CPF validado e unicidade no banco.
- Senhas com scrypt e salt aleatório; nenhum hash de senha enviado à interface.
- Sessões de 8 horas em cookie HttpOnly e SameSite=Strict; Secure em produção.
- Verificação de origem e token CSRF nas operações autenticadas.
- Limite de tentativas por IP/CPF, validação de entrada e consultas SQL parametrizadas.
- Permissões: aluno vê seus dados; personal vê alunos vinculados; administrador vê a academia.
- Chat persistente entre os perfis, atualização a cada 5 segundos, compartilhado entre dispositivos que acessem o mesmo servidor.
- Pedido de plano com preço determinado no servidor, não pelo navegador.
- Confirmação MANUAL de recebimento pelo administrador com referência e auditoria; repetição da confirmação não renova duas vezes.
- Presença manual conferida pela administração, bloqueio de plano vencido e uma entrada por dia. Aluno não pode simular presença remotamente na versão conectada.
- Dias previstos, faltas, acessos ao site separados de presenças e CSV.
- Recuperação assistida por operador, token de 15 minutos e uso único, com revogação das sessões.
- Backup consistente de SQLite, endpoint /api/health e contêiner de execução.

## Recuperação e troca da senha inicial

Depois de verificar a identidade do solicitante, um operador com acesso ao servidor executa:

```powershell
node --env-file-if-exists=.env server/manage.js reset-password
```

Entregue o token por canal privado. O usuário entra em Recuperar acesso e define sua senha. Não existe envio automático de e-mail/SMS configurado.

## Testes

```powershell
npm.cmd test
```

Os testes verificam validade, renovação, faltas, CPF, isolamento entre perfis, proteção CSRF, tentativa de adulterar preço, confirmação idempotente, chat entre sessões, presença duplicada e recuperação de senha. Testes da API utilizam banco em memória e contas fictícias.

## Backup

```powershell
npm.cmd run backup
```

Arquivos em backups/. Automatize esse comando no agendador do servidor, transfira cópias para armazenamento externo restrito e teste restauração. Para restaurar, pare o aplicativo e use o backup como DB_PATH em uma execução separada antes de substituir a base ativa. Não copie apenas o arquivo principal enquanto SQLite estiver em execução: pode haver dados no WAL.

## Preparar cada cliente

1. Definir valores/benefícios em domain.js, identidade da academia e política de faltas. Fazer orçamento e contrato com o escopo exato.
2. Escolher hospedagem com processo Node persistente e disco persistente, domínio e proxy HTTPS. Uma instância do servidor; esta base não foi projetada para múltiplas réplicas com SQLite.
3. Criar um .env do cliente. Em produção, NODE_ENV=production e APP_ORIGIN deve ser exatamente a origem HTTPS, sem barra final. O proxy encaminha para a porta interna; não publique a API diretamente em HTTP.
4. Usar base vazia e provisionar administrador/profissionais; não migrar cadastros da demonstração.
5. Configurar backups externos, restauração, logs operacionais e acompanhamento de /api/health. O limite de tentativas atual é por processo e usa o IP da conexão: atrás de proxy pode compartilhar limites. Ajustar rate limiting no proxy e sua política antes de publicar.
6. Implementar e testar os serviços abaixo. Fazer homologação com o cliente e revisão de segurança e privacidade antes de usar dados reais.

## Docker (opcional)

Dockerfile e compose.yaml são modelos de execução, não foram executados neste computador. Configure APP_ORIGIN para o domínio HTTPS, execute `docker compose up -d --build` e coloque um proxy HTTPS na frente de 127.0.0.1:3000. O banco e os backups têm volumes persistentes. Crie as contas com `docker compose exec app node server/manage.js create-user`. O serviço precisa acessar disco persistente e os backups precisam sair do servidor.

## Integrações que ainda dependem do cliente

**Pagamentos automáticos:** não há provedor conectado. /api/checkout responde 503. Escolher um provedor, criar cobrança com o ID do pedido, preço e cliente determinados no servidor. Validar assinatura/autenticidade do webhook e consultar a transação no provedor; confirmar moeda, valor, destinatário e ID do pedido. Usar chave única do evento para não ativar duas vezes. Também implementar falhas, estornos, cancelamentos e conciliação. Não ativar um plano por redirecionamento do navegador. O fluxo atual é exclusivamente recebimento manual verificado pela academia.

**Catraca:** /api/gate responde 503. Escolher fabricante/modelo, obter documentação e ambiente de teste. Implementar autenticação do equipamento, consulta da vigência no servidor, confirmação da passagem, idempotência e comportamento offline. Não conceder ao aluno permissão de registrar presença ou liberar equipamento pelo navegador.

**Notificações:** integrar e-mail/SMS e agendamentos apenas após definir serviço, consentimento e custos. Não há aviso automático de vencimento enviado nem recuperação automática de senha por mensagem.

## Limites antes de uma entrega comercial

É uma base funcional para evolução e homologação, não um produto certificado pronto para qualquer academia. Não foi feita auditoria independente nem revisão visual em navegador automatizado. Docker e publicação não foram testados. A rotina de faltas usa a agenda atual; alterações não preservam versões históricas da agenda. O plano é único por aluno; não há congelamento, reembolso ou cancelamento implementado. Datas de pagamentos e acessos ficam salvas no servidor; ajuste regras de retenção e acesso. Consultas de relatório e chat têm limites de volume; projetar paginação e índices para escala. As tentativas de autenticação são limitadas por processo e reiniciam com o servidor.

Antes de uso real, definir políticas de dados, retenção, termos de cadastro, recuperação e atendimento, revisar permissões, testar dispositivos e integrações reais e manter Node atualizado. O cadastro atual não coleta contato para recuperação automática. Profissionais são provisionados pelo operador, sem gerenciamento completo de equipe na interface.

## Organização

- app.js / index.html: demonstração estática original.
- live.js / live.html: interface conectada.
- domain.js: regras de negócio utilizadas pelo servidor e pela apresentação.
- server/index.js: API HTTP, autorização e servidor estático com lista de arquivos permitidos.
- server/store.js: SQLite, sessões e senhas.
- server/manage.js: provisionamento, recuperação assistida e backup.
- server/server.test.js e domain.test.js: testes.

A demonstração não é importada para o banco real. Nenhum arquivo do portfólio é alterado por estes comandos.

## Menu de conta

Depois de entrar, o canto superior direito mostra avatar com iniciais e nome. Funciona para aluno, personal e administrador, tanto na versão conectada quanto na demonstração.

- Meu perfil: editar nome, e-mail e telefone de contato; CPF e papel de acesso permanecem protegidos.
- Configurações: tema claro/escuro, texto ampliado e redução de animações.
- Idioma: português e inglês para a interface. Nomes e mensagens dos usuários não são traduzidos. Algumas mensagens de integração e descrições demonstrativas podem continuar em português.
- Alterar senha: exige a senha atual; na versão conectada revoga outras sessões e tokens de recuperação. A sessão atual é renovada. Contas fictícias de demonstração não possuem senha; cadastre uma conta de teste para testar esse fluxo.
- Sair da conta: encerra a sessão do servidor na versão conectada.

Preferências são persistidas por usuário no banco na versão conectada e por conta no navegador na demonstração. E-mail/telefone são contatos, sem verificação ou envio automático configurado. O menu fecha ao clicar fora ou pressionar Escape e pode ser percorrido com Tab e setas.
