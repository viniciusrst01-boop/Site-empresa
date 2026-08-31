# SGQ Online App

Primeira versão web do QualityPro Cloud a partir do HTML de esboço.

## Rodar localmente

```powershell
npm run dev
```

Acesse:

```text
http://127.0.0.1:4180
```

## Login e empresas

O usuário e a senha são definidos por variáveis de ambiente. Não deixe senhas reais salvas em tela, repositório ou documentação pública.

Cada usuário fica vinculado a uma empresa no banco local. Por padrão, quando um login não informa empresa, o app cria uma empresa própria para aquele usuário, mantendo os dados separados.

## Trocar credenciais

Configure variáveis de ambiente antes de iniciar:

```powershell
$env:SGQ_LOGIN_USER="seu-usuario"
$env:SGQ_USER_PASSWORD="sua-senha-forte"
$env:SGQ_COMPANY_NAME="Nome da empresa"
$env:SESSION_SECRET="uma-chave-secreta-longa"
npm run dev
```

Também é possível configurar logins extras:

```powershell
$env:SGQ_EXTRA_LOGINS="usuario2:senha2:Empresa 2,usuario3:senha3:Empresa 3"
```

## Banco de dados

Sem configuração extra, o app usa um banco local em arquivo JSON no servidor. Isso é útil para testar na sua máquina. O arquivo é criado automaticamente em:

```text
data/sgq-local.json
```

Esse arquivo fica ignorado pelo Git e pela Vercel para não publicar dados locais. A API salva os dados por empresa nas chaves:

- `state`: empresa, usuários, documentos, auditorias, não conformidades e configurações;
- `context`: SWOT, partes interessadas, escopo e processos;
- `risk`: riscos, objetivos e mudanças.

Esta versão já separa dados por usuário/empresa localmente. Para produção definitiva, a próxima evolução é trocar esse arquivo local por Postgres online, porque ambientes como Vercel podem limpar arquivos temporários em reinicializações.

## Banco online em produção

Para produção, configure um Postgres online e adicione a variável `DATABASE_URL` na hospedagem. Com essa variável definida, o app deixa de usar o JSON local/temporário e passa a salvar tudo no Postgres.

Variáveis principais para produção:

```text
DATABASE_URL=postgresql://usuario:senha@host:5432/banco?sslmode=require
SESSION_SECRET=uma-chave-secreta-longa
SESSION_TTL_HOURS=8
SGQ_ADMIN_USER=viniciusrst
SGQ_EXTRA_LOGINS=usuario:senha:Nome da Empresa
```

Ao iniciar com `DATABASE_URL`, o app cria automaticamente as tabelas:

- `companies`: empresas/clientes;
- `users`: acessos de cada empresa;
- `company_data`: dados dos módulos separados por empresa.
- `audit_logs`: acessos, falhas de login, backups, exportações e ações administrativas.
- `invitation_tokens`: convites de uso único para o primeiro acesso;
- `user_sessions`: dispositivos conectados e revogação individual de sessões.
- `billing_events`: eventos de assinatura, pagamento e faturas recebidos do Stripe;
- `backup_snapshots`: catálogo, integridade e resultado dos testes de restauração;
- `system_events`: falhas operacionais do navegador, API, banco, cobrança e backup.

As migrações também adicionam situação financeira e limite de acessos às empresas, além de último acesso e versão de sessão aos usuários. Ao bloquear um usuário ou resetar sua senha, sessões já abertas são invalidadas.

## Recuperação de senha

O login possui o link `Esqueci minha senha`. Cada solicitação gera um token de uso único com validade de 30 minutos, e a troca encerra as sessões anteriores da conta. Solicitações repetidas são limitadas a três por 15 minutos.

Para enviar o link automaticamente quando o login for um e-mail, configure:

```ini
PUBLIC_APP_URL=https://sgq-online-app.vercel.app
RESEND_API_KEY=re_...
EMAIL_FROM=QualityPro Cloud <acesso@seudominio.com.br>
```

Sem essas variáveis, a solicitação continua registrada em **Gerenciamento > Atividade e segurança**, onde o administrador pode usar a ação de reset já disponível para o usuário.

## Convites e primeiro acesso

Novos usuários são criados com status `Pendente` e recebem um convite de uso único, válido por 48 horas. O próprio usuário define sua senha na página de aceite e só então a conta fica ativa. Administradores da empresa e o administrador global podem reenviar o convite, invalidando o link anterior.

O login de novos usuários precisa ser um e-mail válido. O envio usa as mesmas variáveis `RESEND_API_KEY` e `EMAIL_FROM` da recuperação de senha.

## Alertas automáticos

O projeto agenda uma verificação diária às 12h UTC pela Vercel. Empresas com **Alertas por e-mail** habilitados recebem um resumo de pendências vencidas ou com prazo nos próximos sete dias.

Configure uma chave aleatória na Vercel:

```ini
CRON_SECRET=uma-chave-aleatoria-longa
```

O endpoint `/api/cron/notifications` aceita somente chamadas autenticadas com essa chave e registra cada execução no histórico de segurança.

## Assinaturas e cobrança

A tela **Configurações** permite iniciar o período de teste, escolher ou trocar o plano e abrir o portal de cobrança. O Stripe atualiza automaticamente plano, vencimento, limite de acessos e situação financeira por webhook. Empresas inadimplentes ou canceladas têm o acesso bloqueado até a regularização; o administrador global permanece com acesso para suporte.

Configure no Stripe três preços recorrentes e cadastre as variáveis:

```ini
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ESSENTIAL=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_TRIAL_DAYS=14
```

O webhook deve apontar para `https://seu-app/api/billing/webhook` e receber eventos de checkout, assinatura e fatura. O histórico aparece no painel administrativo e na área de cobrança da empresa.

## Permissões por módulo

O administrador da empresa define para cada usuário três níveis por módulo: `Sem acesso`, `Visualizar` ou `Editar`. As regras são verificadas tanto na interface quanto na API. Permissão de edição em módulos não libera alteração dos dados cadastrais da empresa.

Os padrões por perfil são:

- Administrador, Gestor e Qualidade: edição dos módulos.
- Auditor: edição de Auditorias e visualização dos demais módulos.
- Colaborador e Consulta: visualização dos módulos.

Os padrões podem ser refinados individualmente no cadastro do usuário. Somente o administrador da empresa, ou alguém que tenha recebido a permissão `Gerenciar usuários`, pode cadastrar e alterar acessos.

## Relatórios e backup

A tela **Relatórios** gera arquivos diretamente a partir dos dados salvos no banco:

- PDF completo do SGQ;
- Excel com abas por módulo;
- backup JSON da empresa, sem hashes de senha.

O administrador global também pode baixar um backup geral ou o backup individual de uma empresa pela tela **Gerenciamento**.

## Backup automático e monitoramento

Além das exportações manuais, a Vercel executa diariamente `/api/cron/backups`. Cada cópia de recuperação contém todas as empresas e usuários, é compactada, criptografada com AES-256-GCM e armazenada de forma privada no Vercel Blob. O sistema confere o checksum e executa um teste de restauração sem substituir o banco ativo. Cópias anteriores ao período de retenção são removidas automaticamente.

```ini
BLOB_READ_WRITE_TOKEN=vercel_blob_...
BACKUP_ENCRYPTION_KEY=uma-chave-longa-exclusiva-para-backup
BACKUP_RETENTION_DAYS=30
ALERT_EMAIL=operacao@seudominio.com.br
```

O endpoint público `/api/health` verifica aplicação, banco, cobrança e armazenamento de backup. O painel **Gerenciamento > Operação do sistema** mostra esses serviços, backups, testes de restauração, eventos financeiros e incidentes. Erros críticos também são enviados ao `ALERT_EMAIL` quando o envio de e-mail está configurado.

Em desenvolvimento, os backups ficam em `data/backups`. `STRIPE_MOCK_MODE=true` existe somente para testes automatizados e não deve ser usado em produção.

## Segurança

- cookies de sessão `HttpOnly`, `SameSite=Strict` e `Secure` em HTTPS;
- validade de sessão configurável por `SESSION_TTL_HOURS` (padrão: 8 horas);
- bloqueio temporário após 5 falhas de login em 15 minutos;
- histórico das principais ações e tentativas de acesso no painel administrativo;
- token CSRF obrigatório em todas as alterações autenticadas;
- sessões registradas por dispositivo, com revogação individual ou das demais sessões;
- confirmação da senha atual para convites, exclusões e mudanças administrativas críticas;
- autenticação em duas etapas TOTP para o administrador global, com QR Code e códigos de recuperação;
- sessões revogadas ao bloquear usuário, aceitar convite ou resetar senha.

Para testes isolados com o banco JSON, mesmo quando existir uma `DATABASE_URL`, use:

```text
SGQ_DATABASE_MODE=local
```

Em bancos locais sem SSL, use:

```text
PGSSLMODE=disable
```
