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

## Banco local

O app usa SQLite local através do Node.js. O arquivo é criado automaticamente em:

```text
data/sgq-local.sqlite
```

Esse arquivo fica ignorado pelo Git e pela Vercel para não publicar dados locais. A API salva os dados por empresa nas chaves:

- `state`: empresa, usuários, documentos, auditorias, não conformidades e configurações;
- `context`: SWOT, partes interessadas, escopo e processos;
- `risk`: riscos, objetivos e mudanças.

Esta versão já separa dados por usuário/empresa localmente. Para produção definitiva, a próxima evolução é trocar o SQLite local por Postgres online e adicionar gestão de usuários/permissões pela interface.
