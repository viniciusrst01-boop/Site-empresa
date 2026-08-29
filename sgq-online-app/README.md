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

## Login

O usuário e a senha são definidos por variáveis de ambiente. Não deixe senhas reais salvas em tela, repositório ou documentação pública.

## Trocar credenciais

Configure variáveis de ambiente antes de iniciar:

```powershell
$env:SGQ_LOGIN_USER="seu-usuario"
$env:SGQ_USER_PASSWORD="sua-senha-forte"
$env:SESSION_SECRET="uma-chave-secreta-longa"
npm run dev
```

Esta versão protege o acesso com cookie assinado, mas ainda usa o protótipo HTML como base visual. A próxima evolução natural é trocar os dados demonstrativos por banco de dados, usuários por empresa e permissões.
