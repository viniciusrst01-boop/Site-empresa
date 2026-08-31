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

As migrações também adicionam situação financeira e limite de acessos às empresas, além de último acesso e versão de sessão aos usuários. Ao bloquear um usuário ou resetar sua senha, sessões já abertas são invalidadas.

## Recuperação de senha

O login possui o link `Esqueci minha senha`. Cada solicitação gera um token de uso único com validade de 30 minutos, e a troca encerra as sessões anteriores da conta. Solicitações repetidas são limitadas a três por 15 minutos.

Para enviar o link automaticamente quando o login for um e-mail, configure:

```ini
PUBLIC_APP_URL=https://sgq-online-app.vercel.app
RESEND_API_KEY=re_...
PASSWORD_RESET_FROM=QualityPro Cloud <acesso@seudominio.com.br>
```

Sem essas variáveis, a solicitação continua registrada em **Gerenciamento > Atividade e segurança**, onde o administrador pode usar a ação de reset já disponível para o usuário.

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

## Segurança

- cookies de sessão `HttpOnly`, `SameSite=Strict` e `Secure` em HTTPS;
- validade de sessão configurável por `SESSION_TTL_HOURS` (padrão: 8 horas);
- bloqueio temporário após 5 falhas de login em 15 minutos;
- histórico das principais ações e tentativas de acesso no painel administrativo;
- sessões revogadas ao bloquear usuário ou resetar senha.

Para testes isolados com o banco JSON, mesmo quando existir uma `DATABASE_URL`, use:

```text
SGQ_DATABASE_MODE=local
```

Em bancos locais sem SSL, use:

```text
PGSSLMODE=disable
```
