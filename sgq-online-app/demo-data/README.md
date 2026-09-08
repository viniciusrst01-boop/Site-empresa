# Cenario local de demonstracao

Seed explicito para os bancos local e PostgreSQL online do SGQ Online. Nao roda durante o startup,
build ou deploy. Todos os registros
operacionais gerados sao ficticios. Nao cria usuarios, envia emails, simula pagamentos
ou altera senhas. As credenciais nunca ficam neste diretorio.

## Executar novamente

No diretorio `sgq-online-app`, pare o servidor local antes de aplicar:

```powershell
$env:SGQ_DATABASE_MODE = 'local'
npm run seed:demo -- --database data/sgq-local.json --date 2026-09-06
npm run seed:demo -- --database data/sgq-local.json --date 2026-09-06 --apply --offline
```

O primeiro comando apenas mostra o resultado previsto. Sem `--date`, usa a data
atual de Sao Paulo. Mesma data e mesmos usuarios produzem o mesmo cenario, sem
duplicacao. Reexecutar substitui as edicoes operacionais feitas apos o seed.
O servidor deve permanecer parado: o backend local mantem o JSON em memoria.
O lock do comando protege contra outro seed, nao contra o servidor em execucao.

Cada aplicacao cria `data/demo-backup-<timestamp>-<id>.json` antes da escrita atomica.
Os backups contem informacoes sensiveis e permanecem ignorados pelo Git, junto com
o banco. Nao publicar esses arquivos. Nao ha exclusao automatica dos backups.

```powershell
npm run seed:demo -- --database data/sgq-local.json --restore data/demo-backup-ARQUIVO.json --apply --offline
```

A restauracao recupera empresas e dados anteriores, mas preserva as credenciais,
status e tokens atuais dos usuarios. Recusa restauracao se o conjunto de IDs mudou.
As sessoes sao invalidadas: entre novamente com as mesmas credenciais.

## Executar no ambiente online

Os comandos abaixo usam as variaveis do projeto Vercel vinculado. A primeira chamada
e somente leitura; a segunda exige confirmacao explicita, executa em uma transacao e
invalida as sessoes para que todos entrem novamente com as mesmas credenciais.

```powershell
npx vercel env run -- npm run seed:demo:online -- --date 2026-09-07
npx vercel env run -- npm run seed:demo:online -- --date 2026-09-07 --apply --production-confirmed
```

Antes da escrita, e criado um backup AES-256-GCM em
`data/online-demo-backup-*.json.enc`, ignorado pelo Git. O arquivo nao armazena hashes
de senha, MFA ou tokens; a restauracao altera apenas empresas, associacoes/perfis dos
usuarios e `company_data`, preservando as credenciais existentes.

```powershell
npx vercel env run -- npm run seed:demo:online -- --restore data/online-demo-backup-ARQUIVO.json.enc --production-confirmed
```

## Fonte dos dados e disponibilidade

Nao foram criadas telas, endpoints ou tabelas para completar modulos pendentes.
Os modulos usam JSON persistido em `company_data` (PostgreSQL) ou `companyData`
(adaptador local). Cada linha e identificada por empresa + `data_key`.

| Modulo / parte | Situacao no codigo | Seed / fluxo real |
| --- | --- | --- |
| Dados da empresa | Pronto | `renderEmpresa`, formulario/registro -> `/api/company` -> `companies` e `companyData.state.company` |
| Alta Direcao, setores, fornecedores homologados, clientes | Pronto | `renderCompanyRegistryTable` -> `/api/company` -> `state.company.registry` |
| Contexto: SWOT, partes, escopo e processos | Pronto | `renderContextModule` / `contextSet` -> `/api/data` -> `context`; leitura `/api/bootstrap` |
| Lideranca: acoes, calendario, posicionamento, plano, politica, comunicacao, cargos, RACI, delegacoes | Pronto | `renderLeadershipModule` / `leadershipSet` -> `/api/data` -> `leadership` |
| Lideranca: indicadores de aprovacoes e compromissos | Parcial | Consumem colecoes sem cadastro navegavel completo; colecoes vazias, nao inventadas |
| Riscos, objetivos, planejamento de mudancas | Pronto para cadastro | `renderRiskOpportunityModule` / `riskSet` -> `/api/data` -> `risk` |
| Historico mensal dos resultados dos objetivos | Nao implementado | O formulario so possui resultado atual manual; nenhuma serie artificial criada |
| Mudancas climaticas | Pronto | `renderClimateModule` / `climateSave` -> `/api/data` -> `state.climate` |
| Nao conformidades, causa, acoes, eficacia, historico | Pronto | `renderNonConformityModule` / `saveNcData` -> `/api/data` -> `state.ncs` |
| Dashboard/TV de NCs | Pronto | `nc-tv.js`, `refreshFromServer`, `aggregate` -> `/api/bootstrap` -> `state.ncs` |
| Saude do SGQ | Pronto; historico depende da fonte | `getSGQHealthHistory` -> `/api/dashboard/health-history` -> `sgqHealth:*`; calculo existente em `sgq-health-data.js` |
| Documentos | Pronto | Cadastro, Lista Mestra, documentos externos e indicadores usam `state.documents`; o seed inclui 9 internos e 5 externos com situacoes variadas |
| Auditorias | Parcial | Nao preenchido; o modulo ainda nao possui um fluxo especifico utilizavel no seed |
| Equipamentos | Placeholder | Nao preenchido |
| Satisfacao do Cliente e modulo independente de Fornecedores | Em desenvolvimento (`future: true`) | Nao alterados; cadastro de fornecedores da empresa e distinto |
| Financeiro operacional | Nao encontrado | Nao criado |
| Assinatura/Stripe | Integracao externa existente | Sem cobrancas, eventos ou transacoes ficticias; empresa em Teste |
| Portal externo RNC fornecedor, convites e anexos | Dependem de fluxo externo/upload | Nao enviados; nenhum token, arquivo inexistente ou comprovante inventado |
| Relatorios | Exportacao existente | Consomem os mesmos dados; nao foi criado outro conjunto de fixtures |

## Estrutura e quantidades previstas no banco local (06/09/2026)

- Empresa operacional unica: ID 3, nome fantasia Quality Pro Solutions.
- Razao social: Quality Pro Solutions Gestao da Qualidade Ltda. (acentuada no banco).
- Administrador da empresa: `hugo.melo`, ID 3, perfil Administrador.
- Administrador global: `Viniciusrst`, ID 1, `company_id: null`; identificacao global
  continua pelo login configurado, nao pelo nome do perfil.
- Usuarios operacionais existentes: IDs 2, 3, 10, 11, 12, todos na empresa 3.
- IDs 2 e 3 ativos; IDs 10, 11 e 12 permanecem Pendentes. Nenhum usuario novo.
- `companies`: 1 linha final; `users`: 6 preservados, somente associacoes e perfil
  administrativo de Hugo ajustados.
- `companyData`: 350 linhas finais: 7 configuracoes/colecoes + 343 observacoes.
- Cadastros: 2 membros da direcao, 6 setores (28 colaboradores), 8 fornecedores,
  10 clientes. Papeis de uma empresa pequena acumulados pelos usuarios ativos.
- Contexto: 8 SWOT, 6 partes interessadas, 1 escopo com 3 revisoes, 6 processos.
- Riscos: 12 riscos/oportunidades, 4 objetivos, 6 mudancas.
- Lideranca: 24 acoes, 1 posicionamento, 8 planos, 1 politica com 3 revisoes,
  12 comunicacoes, 5 cargos (incluindo 3 inativos), 4 RACI, 1 delegacao encerrada.
- NCs: 36 ocorrencias, 34 acoes corretivas, causas e eventos cronologicos.
- Clima: 1 determinacao, 6 questoes, responsaveis e prazos.
- Periodo historico: 01/10/2025 a 06/09/2026. Prazos/revisoes futuras sao
  planejamentos, nao registros historicos futuros.
- Historico de saude: 341 observacoes diarias de NCs calculadas a partir de abertura
  e encerramento; 2 observacoes atuais de Contexto/Riscos. Meses antigos dessas duas
  fontes ficam desconhecidos, pois os cadastros nao registram a cronologia necessaria.
- Sessoes antigas invalidadas; eventos de cobranca antigos removidos. Logs de seguranca
  preservados, com referencias a empresas removidas desvinculadas. Usuarios, hashes,
  MFA e tokens de autenticacao preservados. Backup completo anterior disponivel.
- CNPJ e CEP zero foram aceitos pelos controles existentes; nenhum dado de terceiros
  foi pesquisado. Emails e sites do cenario usam dominio reservado `.example`.

No ambiente online, os IDs e a quantidade de usuarios sao descobertos diretamente
do PostgreSQL. Todos os usuarios existentes sao preservados; apenas o administrador
global fica sem empresa. A empresa de Hugo e reutilizada como empresa operacional
unica, portanto os numeros locais acima nao devem ser usados como expectativa online.

## Ajustes pequenos de integracao

- `db.js`: sessoes aceitam empresa nula exclusivamente para o login global; comparacao
  SQL null-safe; coluna de associacao de usuarios passa a aceitar NULL; backup de
  restauracao acompanha essa nulabilidade. Nenhuma tabela nova.
- `syncConfiguredUsers` nao recria empresas antigas de logins que ja existem.
- `server.js`: `userSettings._companyOwnerId` identifica Hugo explicitamente, sem trocar
  seu ID ou senha. Empresas sem essa chave mantem a regra anterior de menor ID.
- Administrador sem empresa mantem endpoints globais e seguranca; endpoints
  operacionais exigem empresa. Bootstrap nao exige onboarding do administrador global.
- `backup.js`: valida administrador global sem empresa; continua rejeitando usuarios
  operacionais orfaos.
- `public/app.js`: nao sincroniza uma empresa do localStorage quando a sessao global
  nao possui empresa; evita restaurar aba operacional ao trocar de login para admin.
- Preferencias visuais do administrador sem empresa ficam no navegador, na chave
  `qualitypro-platform-settings-<id>`, sem associar o administrador a um tenant.
  Assinaturas das empresas continuam gerenciadas pelo painel, nao por uma assinatura
  pessoal do administrador. Nao foi criado armazenamento global novo.
- Previas numericas locais de Saude/Minhas tarefas agora exigem parametro explicito;
  a porta 4180 deixou de substituir silenciosamente os dados reais por exemplos.
- `Tratado` passa a ser terminal na contagem de pendencias de riscos, tanto na home
  quanto no calculador compartilhado do historico.
- Clima incluido na autorizacao e na selecao de campos de `/api/data`; usuario com
  permissao de editar clima nao pode sobrescrever a empresa por esse endpoint.
  A mensagem de sucesso so aparece depois de confirmada a gravacao.
- Dashboard interno de NCs era bloqueado pelo proprio `X-Frame-Options: DENY`.
  Apenas `/nc-tv` permite incorporacao pela mesma origem (`SAMEORIGIN` e
  `frame-ancestors 'self'`); as demais paginas continuam protegidas por DENY.
- Card resumido de Clima agora conta `state.climate.issues`, em vez do fallback zero.
  Sino usa `state.notifications`, sem sobreposicao do badge fixo de previa +10.

## Validacao

```powershell
npm test
npm run test:demo
$env:SGQ_DEMO_BROWSER = '1'
npm run test:demo
node --env-file=.env demo-data/verify-local.js http://127.0.0.1:4180
npx vercel env run -- node demo-data/verify-local.js https://sgq-online-app.vercel.app --online-confirmed
```

Os testes usam banco temporario, credenciais aleatorias, servidor isolado e limpeza
apos execucao. Verificam idempotencia, backup/restauracao, protecao de credenciais,
enums reais, referencias, login, bloqueados/pendentes, permissoes, round-trip das
colecoes e periodos 1/3/6/12. O teste opcional Playwright cobre abas, filtros de risco
e NC, dashboards da Lideranca, Clima e NC/TV, periodos da Saude, mobile e painel global.
Capturas em `test-results/demo-*.png`, ignoradas pelo Git.

O verificador local usa somente credenciais ja configuradas no ambiente, nao as
imprime e nao edita registros operacionais. Logins e logout geram auditoria real.

Pontos para teste manual/adicional: recuperacao de senha,
MFA e convites de usuarios reais nao disparados; emails, Stripe e uploads nao exercitados
pelo seed. O grafico climatico de situacao ainda converte status para 100/60/35/10,
sem medicao percentual real; isso foi registrado, nao mascarado com outro dado.
Indicadores visuais de certificacao possuem numeros heuristicas preexistentes.
O total geral de registros possui formula legada que inclui usuarios e nao inclui
Lideranca/Clima; sua definicao requer revisao de regra de negocio, nao foi alterada.
Nao ha historico de resultado dos objetivos. Nenhuma dessas partes foi completada.

Arquivos desta implementacao: `demo-data/scenario.js`, `demo-data/seed.js`,
`demo-data/verify-local.js`, este README, `test/demo-data.test.js`, `package.json`,
`db.js`, `server.js`, `backup.js`, `public/app.js`, `public/climate-module.js`,
`public/sgq-health-data.js`. Sem alteracao de CSS, cores, fontes ou layout dos modulos.
