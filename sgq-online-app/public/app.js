const STORAGE_KEY = "qualitypro-cloud-state-v1";

const modules = [
  {
    id: "contexto",
    title: "Contexto da Organização",
    accent: "#A78BFA",
    desc: "Partes interessadas, requisitos legais, escopo do SGQ e informações da organização.",
  },
  {
    id: "lideranca",
    title: "Liderança e Comprometimento",
    accent: "#F2B705",
    desc: "Política da qualidade, papéis, responsabilidades e comprometimento da Alta Direção.",
  },
  {
    id: "riscos",
    title: "Riscos e Oportunidades",
    accent: "#2f8ff0",
    desc: "Identificação, avaliação, tratamento e acompanhamento de riscos e oportunidades.",
  },
  {
    id: "documentos",
    title: "Documentos",
    accent: "#46D9F5",
    desc: "Controle de documentos e registros com versão, aprovação, distribuição e status.",
  },
  {
    id: "auditorias",
    title: "Auditorias",
    accent: "#34D399",
    desc: "Planejamento, execução, checklists e acompanhamento de auditorias internas.",
  },
  {
    id: "nao-conformidades",
    title: "Não Conformidades",
    accent: "#FBBF24",
    desc: "Registro, causa raiz, ação corretiva, responsáveis e verificação de eficácia.",
  },
  {
    id: "equipamentos",
    title: "Equipamentos de Medição",
    accent: "#2DD4BF",
    desc: "Controle de calibrações, manutenções e situação dos equipamentos de medição.",
  },
];

const seedState = {
  company: {
    name: "QualityPro Solutions LTDA",
    tradeName: "QualityPro Solutions",
    cnpj: "00.000.000/0001-00",
    segment: "Consultoria em Gestão da Qualidade",
    size: "pequena",
    cep: "",
    cityUf: "",
    address: "",
    district: "",
    phone: "",
    email: "",
    site: "",
    legalResponsibleName: "Hugo Melo",
    legalResponsibleRole: "Diretor Geral",
    logo: "",
    registry: null,
    scope: "Consultoria, implantação e suporte em Sistemas de Gestão da Qualidade.",
    certification: "ISO 9001:2015",
  },
  users: [
    { name: "Hugo Melo", email: "hugo@qualitypro.com.br", role: "Administrador", status: "Ativo" },
    { name: "Equipe Qualidade", email: "qualidade@qualitypro.com.br", role: "Qualidade", status: "Ativo" },
  ],
  documents: [
    { code: "MQ-001", title: "Manual da Qualidade", version: "01", status: "Aprovado", owner: "Qualidade" },
    { code: "PR-002", title: "Controle de Documentos", version: "03", status: "Em revisão", owner: "SGQ" },
    { code: "FR-014", title: "Lista Mestra de Documentos", version: "02", status: "Aprovado", owner: "SGQ" },
  ],
  audits: [
    { title: "Auditoria interna ISO 9001", date: "2026-09-15", status: "Planejada", owner: "Auditor líder" },
    { title: "Auditoria de documentos", date: "2026-08-30", status: "Em preparação", owner: "Qualidade" },
  ],
  ncs: [
    { code: "NC-001", title: "Documento obsoleto em uso", severity: "Média", status: "Aberta", owner: "SGQ" },
    { code: "NC-002", title: "Registro sem aprovação", severity: "Baixa", status: "Tratando", owner: "Qualidade" },
  ],
  ncCatalogs: {
    clientes: [
      { id: "CLI-1", nome: "Metalúrgica Andrade Ltda", codigo: "CLI-001" },
      { id: "CLI-2", nome: "Construtora Horizonte", codigo: "CLI-002" },
    ],
    fornecedores: [
      { id: "FOR-1", nome: "Aços & Cia Distribuidora", codigo: "FOR-001" },
      { id: "FOR-2", nome: "Calibra Metrologia", codigo: "FOR-002" },
    ],
    processos: ["Comercial", "Engenharia", "Compras", "Produção", "Inspeção", "Expedição"].map((nome, index) => ({ id: `PRO-${index + 1}`, nome })),
    setores: ["Qualidade", "Produção", "Comercial", "Financeiro", "Logística"].map((nome, index) => ({ id: `SET-${index + 1}`, nome })),
  },
  notifications: [
    "3 documentos aguardam aprovação.",
    "1 auditoria interna está próxima do prazo.",
    "2 ações corretivas precisam de atualização.",
  ],
  settings: {
    emailAlerts: true,
    weeklyReport: true,
    companyAccess: "Plano Professional",
    theme: "dark",
  },
};

const riskSeeds = {
  riscos: [
    { id: "RIS-0001", processo: "Produção", texto: "Atraso na entrega de matéria-prima crítica", tipo: "Risco", probabilidade: 4, impacto: 5, status: "Em Tratamento", causa: "Dependência de um único fornecedor e ausência de estoque de segurança.", consequencia: "Parada da produção, atraso nas entregas e insatisfação do cliente.", planoAcao: "Qualificar novo fornecedor e estabelecer estoque de segurança.", responsavel: "Hugo Melo", prazo: "2026-08-30", progresso: 65 },
    { id: "RIS-0002", processo: "Compras", texto: "Oscilação no preço de matéria-prima", tipo: "Risco", probabilidade: 3, impacto: 4, status: "Em Tratamento", causa: "Variação cambial e volatilidade do mercado de insumos.", consequencia: "Aumento do custo dos projetos e redução da margem operacional.", planoAcao: "Negociar contratos de fornecimento com preço fixo por período.", responsavel: "Marina Souza", prazo: "2026-09-15", progresso: 40 },
    { id: "RIS-0003", processo: "Clientes", texto: "Perda de clientes chave", tipo: "Risco", probabilidade: 3, impacto: 5, status: "Em Tratamento", causa: "Concorrência agressiva e falta de diferenciação percebida pelo cliente.", consequencia: "Redução significativa da receita recorrente.", planoAcao: "Implementar programa de relacionamento e fidelização de clientes estratégicos.", responsavel: "Beatriz Santos", prazo: "2026-10-31", progresso: 25 },
    { id: "RIS-0004", processo: "Processos", texto: "Falha em equipamentos críticos", tipo: "Risco", probabilidade: 2, impacto: 4, status: "Monitorando", causa: "Ausência de plano de manutenção preventiva estruturado.", consequencia: "Interrupção de atividades e atraso em entregas aos clientes.", planoAcao: "Implementar cronograma de manutenção preventiva mensal.", responsavel: "Eduardo Lima", prazo: "2026-08-20", progresso: 60 },
    { id: "RIS-0005", processo: "Pessoas", texto: "Falta de capacitação da equipe", tipo: "Risco", probabilidade: 3, impacto: 3, status: "Em Tratamento", causa: "Ausência de plano de treinamento contínuo.", consequencia: "Erros operacionais e queda na qualidade dos serviços prestados.", planoAcao: "Estruturar trilha de capacitação anual por função.", responsavel: "Marina Souza", prazo: "2026-11-30", progresso: 35 },
    { id: "RIS-0006", processo: "TI", texto: "Indisponibilidade do sistema QualityPro Cloud", tipo: "Risco", probabilidade: 2, impacto: 5, status: "Em Tratamento", causa: "Dependência de infraestrutura em nuvem de terceiros.", consequencia: "Interrupção do acesso dos clientes à plataforma.", planoAcao: "Implementar plano de contingência e backup redundante.", responsavel: "Eduardo Lima", prazo: "2026-08-15", progresso: 50 },
    { id: "RIS-0007", processo: "Financeiro", texto: "Inadimplência de clientes em contratos de longo prazo", tipo: "Risco", probabilidade: 2, impacto: 2, status: "Monitorando", causa: "Concentração de recebíveis em poucos clientes.", consequencia: "Impacto no fluxo de caixa da empresa.", planoAcao: "Revisar política de faturamento e adiantamento.", responsavel: "Rafael Costa", prazo: "2026-07-31", progresso: 70 },
    { id: "RIS-0008", processo: "Qualidade", texto: "Baixa adesão das áreas às iniciativas de melhoria", tipo: "Risco", probabilidade: 1, impacto: 3, status: "Identificado", causa: "Falta de priorização das ações de melhoria identificadas.", consequencia: "Baixo avanço em iniciativas de melhoria contínua.", planoAcao: "Criar comitê mensal de priorização de melhorias.", responsavel: "Carlos Andrade", prazo: "2026-10-10", progresso: 10 },
    { id: "RIS-0009", processo: "Vendas", texto: "Aumento da demanda acima da capacidade", tipo: "Oportunidade", probabilidade: 4, impacto: 4, status: "Explorando", causa: "Crescimento da carteira de clientes acima do projetado.", consequencia: "Oportunidade de aumentar receita e ampliar a equipe.", planoAcao: "Avaliar contratação de consultores associados para atender à demanda.", responsavel: "Beatriz Santos", prazo: "2026-09-30", progresso: 50 },
    { id: "RIS-0010", processo: "Processos", texto: "Automação do processo de inspeção", tipo: "Oportunidade", probabilidade: 3, impacto: 3, status: "Explorando", causa: "Disponibilidade de novas ferramentas digitais de inspeção.", consequencia: "Redução de tempo e custo nas auditorias internas.", planoAcao: "Avaliar e implementar ferramenta de checklist digital.", responsavel: "João Pereira", prazo: "2026-10-15", progresso: 20 },
    { id: "RIS-0011", processo: "Clientes", texto: "Expansão para novos mercados", tipo: "Oportunidade", probabilidade: 2, impacto: 4, status: "Identificada", causa: "Demanda identificada em outras regiões não atendidas.", consequencia: "Aumento da base de clientes e diversificação de receita.", planoAcao: "Realizar estudo de viabilidade para expansão regional.", responsavel: "Beatriz Santos", prazo: "2026-12-15", progresso: 10 },
    { id: "RIS-0012", processo: "Gestão de Pessoas", texto: "Programa de certificação Auditor Líder ISO 9001 para a equipe", tipo: "Oportunidade", probabilidade: 4, impacto: 5, status: "Explorando", causa: "Demanda crescente por auditores líderes certificados.", consequencia: "Maior credibilidade técnica da equipe perante clientes.", planoAcao: "Custear certificação de Auditor Líder para 2 consultores.", responsavel: "Marina Souza", prazo: "2026-11-15", progresso: 20 },
    { id: "RIS-0013", processo: "Compras", texto: "Homologação de novos fornecedores estratégicos", tipo: "Oportunidade", probabilidade: 2, impacto: 2, status: "Identificada", causa: "Necessidade de ampliar a base de fornecedores homologados.", consequencia: "Maior segurança de suprimento e poder de negociação.", planoAcao: "Conduzir processo de homologação de 2 novos fornecedores.", responsavel: "Marina Souza", prazo: "2026-10-01", progresso: 30 },
    { id: "RIS-0014", processo: "Financeiro", texto: "Renegociação de contratos para melhorar fluxo de caixa", tipo: "Oportunidade", probabilidade: 1, impacto: 2, status: "Explorando", causa: "Contratos com condições de pagamento desatualizadas.", consequencia: "Melhora no fluxo de caixa e previsibilidade financeira.", planoAcao: "Renegociar prazos e condições com principais clientes.", responsavel: "Rafael Costa", prazo: "2026-09-15", progresso: 35 },
  ],
  objetivos: [
    { id: "OBJ-0001", objetivo: "Aumentar a satisfação dos clientes", indicador: "Índice de Satisfação (%)", meta: ">= 95%", resultadoAtual: "92,4%", tendenciaDirecao: "up", status: "Em andamento", prazoRevisao: "2026-12-31", responsavel: "Beatriz Santos", responsavelCargo: "Coordenadora Comercial", planejamento: { oQue: "Implementar pesquisa de satisfação trimestral e plano de ação para itens críticos.", recursos: "Ferramenta de pesquisa e tempo da equipe comercial.", como: "Análise trimestral dos resultados da pesquisa de satisfação." } },
    { id: "OBJ-0002", objetivo: "Reduzir não conformidades internas", indicador: "NC internas por mês", meta: "<= 5", resultadoAtual: "4", tendenciaDirecao: "down", status: "Em andamento", prazoRevisao: "2026-12-31", responsavel: "Carlos Andrade", responsavelCargo: "Gerente da Qualidade", planejamento: { oQue: "Reforçar auditorias internas e tratamento de causa raiz das NCs.", recursos: "Horas de auditor interno e checklist atualizado.", como: "Acompanhamento mensal do número de NCs abertas." } },
    { id: "OBJ-0003", objetivo: "Entregas no prazo", indicador: "% de entregas no prazo", meta: ">= 98%", resultadoAtual: "96,8%", tendenciaDirecao: "up", status: "Em andamento", prazoRevisao: "2026-12-31", responsavel: "Hugo Melo", responsavelCargo: "Diretor Geral", planejamento: { oQue: "Padronizar cronograma de entrega e revisar capacidade da equipe.", recursos: "Ferramenta de gestão de projetos e reforço temporário de equipe.", como: "Monitoramento mensal do percentual de entregas no prazo." } },
    { id: "OBJ-0004", objetivo: "Reduzir retrabalho", indicador: "% de retrabalho", meta: "<= 3%", resultadoAtual: "2,6%", tendenciaDirecao: "up", status: "Atingido", prazoRevisao: "2026-12-31", responsavel: "Carlos Andrade", responsavelCargo: "Gerente da Qualidade", planejamento: { oQue: "Implementar checklist de revisão final antes da entrega ao cliente.", recursos: "Tempo da equipe de qualidade para revisão adicional.", como: "Acompanhamento do percentual de projetos que exigiram retrabalho após a entrega." } },
    { id: "OBJ-0005", objetivo: "Desenvolvimento de pessoas", indicador: "Horas de treinamento por colaborador/ano", meta: ">= 40h", resultadoAtual: "38h", tendenciaDirecao: "down", status: "Em andamento", prazoRevisao: "2026-12-31", responsavel: "Marina Souza", responsavelCargo: "Coordenadora de Pessoas e Compras", planejamento: { oQue: "Estruturar trilha de capacitação anual por função.", recursos: "Orçamento para treinamentos externos e horas dedicadas de estudo.", como: "Acompanhamento mensal das horas de treinamento realizadas por colaborador." } },
  ],
  mudancas: [
    { id: "MD-2026-012", mudanca: "Implantação de novo ERP/CRM comercial", proposito: "Integrar processos comerciais e melhorar a gestão de dados dos clientes.", areaImpactada: "TI / Todos os Processos", status: "Em execução", prioridade: "Alta", dataPrevista: "2026-09-30", responsavel: "Eduardo Lima", recursos: { descricao: "Licenciamento do sistema CRM e horas de implementação de TI.", valor: 18000 } },
    { id: "MD-2026-011", mudanca: "Alteração no processo de execução de projetos", proposito: "Aumentar eficiência e reduzir retrabalho nos projetos entregues.", areaImpactada: "Produção", status: "Em execução", prioridade: "Alta", dataPrevista: "2026-08-15", responsavel: "Hugo Melo", recursos: { descricao: "Revisão de templates e treinamento da equipe de consultoria.", valor: 4000 } },
    { id: "MD-2026-010", mudanca: "Inclusão de nova linha de serviços", proposito: "Aumentar a capacidade de atendimento e diversificar a receita.", areaImpactada: "Comercial / Consultoria", status: "Em planejamento", prioridade: "Média", dataPrevista: "2026-10-31", responsavel: "Beatriz Santos", recursos: { descricao: "Pesquisa de mercado e desenvolvimento de material comercial.", valor: 6000 } },
    { id: "MD-2026-009", mudanca: "Mudança de fornecedor crítico de auditoria externa", proposito: "Reduzir riscos de descontinuidade no processo de certificação.", areaImpactada: "Compras / Qualidade", status: "Em execução", prioridade: "Alta", dataPrevista: "2026-08-20", responsavel: "Marina Souza", recursos: { descricao: "Homologação e contratação de novo organismo certificador.", valor: 9000 } },
    { id: "MD-2026-008", mudanca: "Alteração na estrutura organizacional", proposito: "Adequar a estrutura organizacional à estratégia de crescimento.", areaImpactada: "Recursos Humanos", status: "Em planejamento", prioridade: "Média", dataPrevista: "2026-09-10", responsavel: "Marina Souza", recursos: { descricao: "Ajuste salarial e comunicação interna da nova estrutura.", valor: 5000 } },
    { id: "MD-2026-007", mudanca: "Implementação de novo requisito normativo", proposito: "Atender ao novo requisito publicado na revisão da norma.", areaImpactada: "Qualidade / SGQ", status: "Concluída", prioridade: "Alta", dataPrevista: "2026-05-05", responsavel: "Carlos Andrade", recursos: { descricao: "Gap analysis e atualização da documentação do SGQ.", valor: 3000 } },
    { id: "MD-2026-006", mudanca: "Migração da plataforma QualityPro Cloud", proposito: "Melhorar a disponibilidade e o desempenho do sistema.", areaImpactada: "TI", status: "Em planejamento", prioridade: "Alta", dataPrevista: "2026-11-30", responsavel: "Eduardo Lima", recursos: { descricao: "Contratação de novo provedor de nuvem e migração de dados.", valor: 12000 } },
    { id: "MD-2026-005", mudanca: "Revisão do processo de homologação de fornecedores", proposito: "Reduzir o tempo de homologação e padronizar critérios.", areaImpactada: "Compras", status: "Concluída", prioridade: "Média", dataPrevista: "2026-04-30", responsavel: "Marina Souza", recursos: { descricao: "Atualização do checklist de homologação.", valor: 1000 } },
    { id: "MD-2026-004", mudanca: "Reestruturação do processo comercial de propostas", proposito: "Reduzir divergências e aumentar a taxa de conversão.", areaImpactada: "Comercial", status: "Em execução", prioridade: "Média", dataPrevista: "2026-08-01", responsavel: "Beatriz Santos", recursos: { descricao: "Novo template de proposta e treinamento comercial.", valor: 2000 } },
    { id: "MD-2026-003", mudanca: "Implementação de novo módulo financeiro no sistema", proposito: "Melhorar o controle de faturamento e fluxo de caixa.", areaImpactada: "Financeiro", status: "Em planejamento", prioridade: "Baixa", dataPrevista: "2026-12-15", responsavel: "Rafael Costa", recursos: { descricao: "Licenciamento do módulo financeiro adicional.", valor: 4000 } },
    { id: "MD-2026-002", mudanca: "Alteração no processo de auditoria interna", proposito: "Aumentar a cobertura e a frequência das auditorias internas.", areaImpactada: "Qualidade", status: "Em execução", prioridade: "Alta", dataPrevista: "2026-07-25", responsavel: "João Pereira", recursos: { descricao: "Horas adicionais de auditor interno.", valor: 2500 } },
    { id: "MD-2026-001", mudanca: "Adequação da política de manutenção de equipamentos", proposito: "Padronizar a manutenção preventiva dos equipamentos críticos.", areaImpactada: "Manutenção", status: "Concluída", prioridade: "Média", dataPrevista: "2026-03-31", responsavel: "Eduardo Lima", recursos: { descricao: "Contrato de manutenção preventiva especializada.", valor: 3000 } },
  ],
};

const riskStorageKeys = {
  riscos: "qps_ro_riscos",
  objetivos: "qps_ro_objetivos",
  mudancas: "qps_ro_mudancas",
};

let currentRiskTab = "riscos";
let riskFilter = "todos";

const contextStorageKeys = {
  swot: "qps_ctx_swot",
  partes: "qps_ctx_partes",
  escopo: "qps_ctx_escopo",
  processos: "qps_ctx_processos",
};
const contextClearBackupKey = "qps_ctx_last_clear_backup";

const contextSeeds = {
  swot: [
    { id: "SWOT-0001", quadrante: "Força", descricao: "Equipe com auditores líderes certificados ISO 9001 e Lean Six Sigma.", prioridade: "Alta", planoNecessario: "Não", planoAcao: "", responsavel: "Hugo Melo", status: "Concluído" },
    { id: "SWOT-0002", quadrante: "Força", descricao: "Metodologia própria de diagnóstico validada em projetos reais.", prioridade: "Média", planoNecessario: "Não", planoAcao: "", responsavel: "Hugo Melo", status: "Concluído" },
    { id: "SWOT-0003", quadrante: "Fraqueza", descricao: "Dependência de poucos consultores-chave para projetos simultâneos.", prioridade: "Alta", planoNecessario: "Sim", planoAcao: "Contratar e capacitar consultor associado.", responsavel: "Hugo Melo", status: "Em andamento" },
    { id: "SWOT-0004", quadrante: "Fraqueza", descricao: "Controles internos ainda dependentes de planilhas manuais.", prioridade: "Média", planoNecessario: "Sim", planoAcao: "Migrar controles para o QualityPro Cloud.", responsavel: "Carlos Andrade", status: "Em andamento" },
    { id: "SWOT-0005", quadrante: "Oportunidade", descricao: "Crescimento da demanda por certificação ISO em empresas de médio porte.", prioridade: "Alta", planoNecessario: "Sim", planoAcao: "Criar pacote comercial voltado a PMEs.", responsavel: "Beatriz Santos", status: "Não iniciado" },
    { id: "SWOT-0006", quadrante: "Oportunidade", descricao: "Possibilidade de parcerias com organismos certificadores.", prioridade: "Média", planoNecessario: "Sim", planoAcao: "Mapear e abordar organismos certificadores.", responsavel: "Beatriz Santos", status: "Não iniciado" },
    { id: "SWOT-0007", quadrante: "Ameaça", descricao: "Aumento da concorrência de consultorias de baixo custo.", prioridade: "Alta", planoNecessario: "Sim", planoAcao: "Reforçar diferenciação técnica e cases de sucesso.", responsavel: "Hugo Melo", status: "Em andamento" },
    { id: "SWOT-0008", quadrante: "Ameaça", descricao: "Mudanças regulatórias podem exigir atualização contínua da equipe.", prioridade: "Média", planoNecessario: "Sim", planoAcao: "Plano anual de atualização técnica da equipe.", responsavel: "Marina Souza", status: "Não iniciado" },
  ],
  partes: [
    { id: "PI-0001", parte: "Clientes", necessidade: "Conformidade e prazos de entrega.", expectativa: "Serviço de consultoria confiável e resultados mensuráveis.", monitoramento: "Pesquisa de satisfação e reuniões de acompanhamento.", frequencia: "Trimestral" },
    { id: "PI-0002", parte: "Colaboradores", necessidade: "Ambiente de trabalho estruturado e capacitação contínua.", expectativa: "Desenvolvimento profissional e clareza de papéis.", monitoramento: "Pesquisa de clima e avaliação de desempenho.", frequencia: "Semestral" },
    { id: "PI-0003", parte: "Fornecedores/Parceiros", necessidade: "Critérios claros de contratação e pagamento em dia.", expectativa: "Relacionamento de longo prazo e volume recorrente.", monitoramento: "Avaliação periódica de fornecedores.", frequencia: "Anual" },
    { id: "PI-0004", parte: "Organismo Certificador", necessidade: "Conformidade documental e rastreabilidade.", expectativa: "Adequação contínua aos requisitos da norma.", monitoramento: "Auditorias externas de certificação/manutenção.", frequencia: "Anual" },
    { id: "PI-0005", parte: "Sócios/Direção", necessidade: "Sustentabilidade financeira e crescimento do negócio.", expectativa: "Retorno sobre investimento e mitigação de riscos.", monitoramento: "Análise crítica pela direção.", frequencia: "Semestral" },
  ],
  escopo: {
    unidades: "Sede em Rio de Janeiro/RJ, com atendimento remoto, presencial e híbrido em todo o território nacional.",
    produtos: "Materiais de apoio à gestão da qualidade, templates, checklists e guias práticos.",
    servicos: "Consultoria para implantação de ISO 9001, auditoria interna, auditoria de fornecedor, consultoria de manutenção, diagnóstico de SGQ, padronização de processos, projetos de melhoria contínua e treinamentos.",
    exclusoes: "Requisito 8.3 - Projeto e Desenvolvimento de Produtos e Serviços.",
    justificativas: "A QualityPro Solutions presta serviços de consultoria e não desenvolve produtos próprios; portanto, os controles de projeto e desenvolvimento não se aplicam ao escopo do SGQ.",
    dataAtualizacao: "2026-07-15",
    statusAprovacao: "Aprovado",
    aprovador: "Hugo Melo",
    dataAprovacao: "2026-07-16",
  },
  processos: [
    { id: "alta_direcao", nome: "Alta Direção", codigo: "E01", responsavel: "Hugo Melo", cargo: "Diretor Executivo", status: "Ativo", categoria: "Estratégico", objetivo: "Definir a política da qualidade, os objetivos estratégicos e garantir os recursos necessários ao SGQ.", indicadores: ["Reuniões de análise crítica no prazo", "Cumprimento dos objetivos estratégicos"], riscos: ["Objetivos desalinhados com o contexto"], entradas: ["Indicadores, riscos e satisfação de clientes"], saidas: ["Decisões estratégicas", "Objetivos atualizados"] },
    { id: "gmp", nome: "GMP - Grupo de Melhoria de Processos", codigo: "E02", responsavel: "Marina Souza", cargo: "Coordenadora de Melhoria Contínua", status: "Ativo", categoria: "Estratégico", objetivo: "Promover a melhoria contínua dos processos.", indicadores: ["Melhorias implementadas por trimestre"], riscos: ["Baixa adesão das áreas"], entradas: ["Oportunidades de melhoria"], saidas: ["Ações priorizadas"] },
    { id: "comercial", nome: "Comercial", codigo: "P01", responsavel: "Beatriz Santos", cargo: "Consultora Comercial", status: "Ativo", categoria: "Operacional", objetivo: "Converter oportunidades em contratos assinados.", indicadores: ["Taxa de conversão de propostas", "Prazo médio de resposta"], riscos: ["Proposta com escopo mal definido"], entradas: ["Briefing do cliente"], saidas: ["Proposta aprovada"] },
    { id: "engenharia", nome: "Engenharia", codigo: "P02", responsavel: "Carlos Andrade", cargo: "Engenheiro Responsável", status: "Ativo", categoria: "Operacional", objetivo: "Desenvolver soluções que atendam aos requisitos dos clientes e normas aplicáveis.", indicadores: ["Prazo de elaboração técnica"], riscos: ["Levantamento técnico incompleto"], entradas: ["Contrato assinado"], saidas: ["Plano de implementação"] },
    { id: "compras", nome: "Compras", codigo: "P03", responsavel: "Marina Souza", cargo: "Analista de Compras", status: "Ativo", categoria: "Operacional", objetivo: "Garantir disponibilidade de recursos qualificados.", indicadores: ["Prazo de contratação de especialistas"], riscos: ["Fornecedor não homologado"], entradas: ["Necessidade de recursos"], saidas: ["Fornecedor contratado"] },
    { id: "producao", nome: "Produção", codigo: "P04", responsavel: "Hugo Melo", cargo: "Gestor de Projetos", status: "Ativo", categoria: "Operacional", objetivo: "Entregar o SGQ estruturado dentro do prazo e escopo contratado.", indicadores: ["Aderência ao cronograma"], riscos: ["Mudança de escopo não formalizada"], entradas: ["Plano de implementação"], saidas: ["SGQ estruturado"] },
    { id: "inspecao", nome: "Inspeção", codigo: "P05", responsavel: "João Pereira", cargo: "Auditor Interno", status: "Ativo", categoria: "Operacional", objetivo: "Assegurar conformidade dos entregáveis antes da expedição.", indicadores: ["Conformidade na auditoria prévia"], riscos: ["NC não identificada"], entradas: ["Entregável preliminar"], saidas: ["Relatório de conformidade"] },
    { id: "expedicao", nome: "Expedição", codigo: "P06", responsavel: "Rafael Costa", cargo: "Analista Financeiro", status: "Ativo", categoria: "Operacional", objetivo: "Garantir entrega formal do projeto e coleta da satisfação.", indicadores: ["Satisfação do cliente"], riscos: ["Relatório final atrasado"], entradas: ["Relatório aprovado"], saidas: ["Projeto encerrado"] },
    { id: "gestao_pessoas", nome: "Gestão de Pessoas", codigo: "S01", responsavel: "Marina Souza", cargo: "Analista de RH", status: "Ativo", categoria: "Suporte", objetivo: "Garantir equipe qualificada para atender aos projetos.", indicadores: ["Horas de treinamento"], riscos: ["Capacitação técnica desatualizada"], entradas: ["Necessidade de talentos"], saidas: ["Equipe capacitada"] },
    { id: "manutencao", nome: "Manutenção", codigo: "S02", responsavel: "Eduardo Lima", cargo: "Técnico de Suporte Interno", status: "Ativo", categoria: "Suporte", objetivo: "Assegurar disponibilidade dos recursos físicos.", indicadores: ["Tempo de resposta a chamados"], riscos: ["Indisponibilidade de equipamentos"], entradas: ["Solicitação de manutenção"], saidas: ["Equipamentos disponíveis"] },
    { id: "ti", nome: "Tecnologia da Informação", codigo: "S03", responsavel: "João Pereira", cargo: "Analista de TI", status: "Ativo", categoria: "Suporte", objetivo: "Garantir disponibilidade, segurança e desempenho dos sistemas.", indicadores: ["Disponibilidade do sistema"], riscos: ["Indisponibilidade do sistema"], entradas: ["Necessidade de suporte"], saidas: ["Sistemas disponíveis"] },
    { id: "financeiro_sup", nome: "Financeiro", codigo: "S04", responsavel: "Rafael Costa", cargo: "Analista Financeiro", status: "Ativo", categoria: "Suporte", objetivo: "Garantir saúde financeira e faturamento correto.", indicadores: ["Prazo médio de faturamento"], riscos: ["Inadimplência"], entradas: ["Projeto encerrado"], saidas: ["Faturamento emitido"] },
    { id: "qualidade", nome: "Qualidade", codigo: "S05", responsavel: "Hugo Melo", cargo: "Gestor da Qualidade", status: "Ativo", categoria: "Suporte", objetivo: "Assegurar que o SGQ permaneça eficaz e conforme a ISO 9001.", indicadores: ["Não conformidades internas"], riscos: ["SGQ desatualizado"], entradas: ["Auditorias, NCs e riscos"], saidas: ["SGQ atualizado"] },
  ],
};

let currentContextTab = "swot";
const leadershipStorageKey = "qps_lc_data";
const leadershipSeeds = {
  acoes: [
    { id: "AD-0001", data: "2026-07-15", tipo: "Reunião Estratégica", descricao: "Reunião mensal com análise dos indicadores e resultados do SGQ.", participantes: "Hugo Melo, Marina Souza, Carlos Andrade", evidencia: "Ata_15072026.pdf", responsavel: "Hugo Melo", status: "Concluída" },
    { id: "AD-0002", data: "2026-06-30", tipo: "Análise de Indicadores", descricao: "Análise crítica dos indicadores do SGQ - Junho/2026.", participantes: "Hugo Melo, Rafael Costa", evidencia: "Relatorio_Indicadores_0626.pdf", responsavel: "Hugo Melo", status: "Concluída" },
    { id: "AD-0003", data: "2026-06-15", tipo: "Decisão Estratégica", descricao: "Aprovação do novo objetivo estratégico de satisfação do cliente.", participantes: "Hugo Melo", evidencia: "Ata_15062026.pdf", responsavel: "Hugo Melo", status: "Concluída" },
    { id: "AD-0004", data: "2026-05-20", tipo: "Alocação de Recursos", descricao: "Aprovação de investimento em equipamentos de medição.", participantes: "Hugo Melo, Rafael Costa", evidencia: "Aprovacao_Investimento.pdf", responsavel: "Hugo Melo", status: "Concluída" },
    { id: "AD-0005", data: "2026-05-05", tipo: "Reunião Estratégica", descricao: "Reunião estratégica para planejamento semestral.", participantes: "Hugo Melo, Marina Souza, Beatriz Santos, Carlos Andrade, João Pereira", evidencia: "Ata_05052026.pdf", responsavel: "Hugo Melo", status: "Concluída" },
    { id: "AD-0006", data: "2026-04-18", tipo: "Análise de Indicadores", descricao: "Análise crítica dos indicadores do SGQ - Abril/2026.", participantes: "Hugo Melo", evidencia: "Relatorio_Indicadores_0426.pdf", responsavel: "Hugo Melo", status: "Concluída" },
    { id: "AD-0007", data: "2026-04-02", tipo: "Decisão Estratégica", descricao: "Aprovação da expansão da carteira de clientes PME.", participantes: "Hugo Melo, Beatriz Santos", evidencia: "Ata_02042026.pdf", responsavel: "Hugo Melo", status: "Programada" },
    { id: "AD-0008", data: "2026-03-22", tipo: "Alocação de Recursos", descricao: "Aprovação de contratação de consultor associado.", participantes: "Hugo Melo, Marina Souza", evidencia: "Aprovacao_Contratacao.pdf", responsavel: "Hugo Melo", status: "Programada" },
    { id: "AD-0009", data: "2026-03-10", tipo: "Reunião Estratégica", descricao: "Reunião trimestral de análise crítica do SGQ.", participantes: "Hugo Melo, Marina Souza, Carlos Andrade, Rafael Costa", evidencia: "Ata_10032026.pdf", responsavel: "Hugo Melo", status: "Concluída" },
    { id: "AD-0010", data: "2026-02-14", tipo: "Análise de Indicadores", descricao: "Análise crítica dos indicadores do SGQ - Janeiro/2026.", participantes: "Hugo Melo", evidencia: "Relatorio_Indicadores_0126.pdf", responsavel: "Hugo Melo", status: "Não Realizada" },
    { id: "AD-0011", data: "2026-01-28", tipo: "Decisão Estratégica", descricao: "Definição da política de home office.", participantes: "Hugo Melo, Marina Souza", evidencia: "Ata_28012026.pdf", responsavel: "Hugo Melo", status: "Concluída" },
    { id: "AD-0012", data: "2026-01-10", tipo: "Reunião Estratégica", descricao: "Reunião de abertura do planejamento anual 2026.", participantes: "Hugo Melo, Marina Souza, Carlos Andrade, Beatriz Santos, Rafael Costa, João Pereira", evidencia: "Ata_10012026.pdf", responsavel: "Hugo Melo", status: "Concluída" },
  ],
  posicionamento: {
    missao: "Entregar soluções de qualidade que gerem valor e confiança para nossos clientes.",
    visao: "Ser referência em excelência e inovação em gestão da qualidade.",
    valores: ["Ética", "Comprometimento", "Foco no Cliente", "Melhoria Contínua", "Trabalho em Equipe"],
    dataAtualizacao: "2026-07-20",
    aprovadoPor: "Hugo Melo",
  },
  plano: [
    { id: "P5W2H-0001", oQue: "Implementar o QualityPro Cloud em 100% dos clientes ativos", porQue: "Padronizar e digitalizar o acompanhamento do SGQ dos clientes.", onde: "Clientes Ativos", quando: "2026-09-30", quem: "Hugo Melo", como: "Migração gradual dos dados de cada cliente para a plataforma.", quanto: 15000, status: "Em Andamento" },
    { id: "P5W2H-0002", oQue: "Expandir a carteira de clientes PME em 30%", porQue: "Aumentar a receita recorrente e diversificar a base de clientes.", onde: "Comercial", quando: "2026-12-31", quem: "Beatriz Santos", como: "Campanhas de marketing direcionadas e parcerias comerciais.", quanto: 8000, status: "Em Andamento" },
    { id: "P5W2H-0003", oQue: "Certificar processos críticos em conformidade com a ISO 9001", porQue: "Garantir credibilidade e diferenciação competitiva.", onde: "Processos Operacionais", quando: "2026-06-30", quem: "Carlos Andrade", como: "Auditorias internas e plano de ação corretiva.", quanto: 5000, status: "Concluído" },
  ],
  politica: {
    texto: "A QualityPro Solutions fornece soluções em consultoria e sistemas de gestão da qualidade, buscando a satisfação dos clientes, a melhoria contínua dos processos e o desenvolvimento das pessoas, atendendo aos requisitos legais e aplicáveis.",
    status: "Vigente",
    revisao: "03",
    dataAprovacao: "2026-01-02",
    aprovador: "Hugo Melo",
    aprovadorCargo: "Diretor",
    proximaRevisao: "2027-01-02",
    historico: [
      { revisao: "01", data: "2024-01-10", descricao: "Versão inicial da Política da Qualidade." },
      { revisao: "02", data: "2025-01-05", descricao: "Inclusão de referência à melhoria contínua." },
      { revisao: "03", data: "2026-01-02", descricao: "Atualização para incluir desenvolvimento das pessoas." },
    ],
  },
  comunicacao: [
    { id: "COMPOL-0001", data: "2026-07-10", forma: "Reunião de Equipe", setor: "Toda a organização", qtdPessoas: 7, evidencia: "Ata_reuniao_qualidade_0710.pdf" },
    { id: "COMPOL-0002", data: "2026-06-15", forma: "E-mail", setor: "Todos os Setores", qtdPessoas: 7, evidencia: "Comprovante_email_0615.pdf" },
    { id: "COMPOL-0003", data: "2026-05-20", forma: "Treinamento", setor: "Comercial", qtdPessoas: 2, evidencia: "Lista_presenca_treinamento_0520.pdf" },
    { id: "COMPOL-0004", data: "2026-04-10", forma: "Integração", setor: "Novo Colaborador", qtdPessoas: 1, evidencia: "Lista_presenca_integracao_0410.pdf" },
    { id: "COMPOL-0005", data: "2026-03-05", forma: "Mural/Comunicado Interno", setor: "Toda a organização", qtdPessoas: 7, evidencia: "Foto_mural_0305.jpg" },
    { id: "COMPOL-0006", data: "2026-01-10", forma: "Reunião de Equipe", setor: "Toda a organização", qtdPessoas: 7, evidencia: "Ata_reuniao_qualidade_0110.pdf" },
  ],
  cargos: [
    { id: "CARGO-0001", nome: "Hugo Melo", cargo: "Diretor Geral", departamento: "Direção", substituto: "-", status: "Ativo", descricao: "Responsável pelo direcionamento estratégico e liderança geral da organização.", responsabilidades: ["Definir a política e os objetivos da qualidade", "Garantir os recursos necessários ao SGQ"], autoridades: ["Aprovar documentos estratégicos", "Aprovar investimentos e contratações"] },
    { id: "CARGO-0002", nome: "Carlos Andrade", cargo: "Gerente da Qualidade", departamento: "Qualidade", substituto: "João Pereira", status: "Ativo", descricao: "Responsável por planejar, implementar e manter o SGQ.", responsabilidades: ["Garantir a conformidade do SGQ", "Reportar desempenho à Direção"], autoridades: ["Requisitar recursos para melhoria", "Emitir ações corretivas"] },
    { id: "CARGO-0003", nome: "Beatriz Santos", cargo: "Coordenadora Comercial", departamento: "Comercial", substituto: "Rafael Costa", status: "Ativo", descricao: "Responsável pela prospecção, propostas e relacionamento com clientes.", responsabilidades: ["Elaborar propostas comerciais", "Acompanhar a satisfação dos clientes"], autoridades: ["Aprovar condições comerciais dentro da política vigente"] },
    { id: "CARGO-0004", nome: "Marina Souza", cargo: "Coordenadora de Pessoas e Compras", departamento: "Gestão de Pessoas", substituto: "Beatriz Santos", status: "Ativo", descricao: "Responsável pela gestão de pessoas, treinamentos e homologação de fornecedores.", responsabilidades: ["Conduzir contratações e capacitações", "Homologar e avaliar fornecedores"], autoridades: ["Aprovar planos de treinamento", "Aprovar homologação de fornecedores"] },
    { id: "CARGO-0005", nome: "João Pereira", cargo: "Auditor Interno", departamento: "Qualidade", substituto: "Carlos Andrade", status: "Ativo", descricao: "Responsável pela execução das auditorias internas do SGQ.", responsabilidades: ["Executar o programa de auditorias internas", "Registrar e acompanhar não conformidades"], autoridades: ["Emitir relatórios de não conformidade"] },
    { id: "CARGO-0006", nome: "Eduardo Lima", cargo: "Técnico de Suporte Interno", departamento: "Manutenção/TI", substituto: "João Pereira", status: "Ativo", descricao: "Responsável pela manutenção de equipamentos e suporte de infraestrutura.", responsabilidades: ["Executar manutenções preventivas e corretivas", "Dar suporte à infraestrutura de TI"], autoridades: ["Solicitar substituição de equipamentos críticos"] },
    { id: "CARGO-0007", nome: "Rafael Costa", cargo: "Analista Financeiro", departamento: "Financeiro", substituto: "Marina Souza", status: "Ativo", descricao: "Responsável pelo controle financeiro e faturamento dos projetos.", responsabilidades: ["Controlar o faturamento e o fluxo de caixa", "Acompanhar a inadimplência de clientes"], autoridades: ["Aprovar pagamentos dentro do limite estabelecido"] },
  ],
  raci: [
    { id: "RACI-0001", atividade: "Definir Política da Qualidade", diretorGeral: "A", qualidade: "R", comercial: "I", financeiro: "I" },
    { id: "RACI-0002", atividade: "Gerenciar Não Conformidades", diretorGeral: "I", qualidade: "R", comercial: "C", financeiro: "I" },
  ],
  delegacoes: [
    { id: "DEL-0001", titular: "Hugo Melo", substituto: "Carlos Andrade", cargo: "Diretor Geral", periodoIni: "2026-08-01", periodoFim: "2026-08-08", motivo: "Férias", status: "Agendada" },
  ],
  aprovacoes: [
    { id: "APR-0001", tipo: "Procedimentos", aprovador: "Hugo Melo", substituto: "Carlos Andrade", revisao: "01" },
    { id: "APR-0002", tipo: "Objetivos da Qualidade", aprovador: "Hugo Melo", substituto: "Carlos Andrade", revisao: "01" },
  ],
  compromissos: [
    { id: "COMP-0001", compromisso: "Aprovar Política da Qualidade", responsavel: "Hugo Melo", status: "Concluído" },
    { id: "COMP-0002", compromisso: "Promover melhoria contínua", responsavel: "Hugo Melo", status: "Em Andamento" },
  ],
};
const leadershipTabs = {
  lideranca: [
    ["acoes", "Comprometimento da Direção"],
    ["posicionamento", "Posicionamento Estratégico"],
    ["plano", "Plano Estratégico"],
    ["indicadores", "Indicadores"],
  ],
  politica: [
    ["politica", "Política da Qualidade"],
    ["comunicacao", "Comunicação da Política"],
  ],
  papeis: [
    ["cargos", "Cargos e Funções"],
    ["raci", "Matriz RACI"],
    ["delegacoes", "Delegação de Autoridade"],
    ["aprovacoes", "Aprovações"],
    ["compromissos", "Compromissos da Direção"],
    ["indicadoresPapeis", "Indicadores da Liderança"],
  ],
};
let leadershipData = null;
let currentLeadershipMainTab = "lideranca";
let currentLeadershipSubTab = "acoes";
let currentCompanyTab = "dados";
let currentCompanyModalKey = "";
let currentCompanyEditId = null;
let companyUsersData = [];
let editingCompanyUserId = null;
let userMenuOutsideBound = false;

let state = loadState();
let riskData = null;
let contextData = null;
let currentUser = null;
let csrfToken = "";
let activeView = "inicio";
let lastClientErrorAt = 0;
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, options = {}) => {
  const url = typeof input === "string" ? new URL(input, window.location.href) : new URL(input.url, window.location.href);
  const method = String(options.method || (typeof input !== "string" && input.method) || "GET").toUpperCase();
  if (csrfToken && url.origin === window.location.origin && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    const headers = new Headers(options.headers || (typeof input !== "string" ? input.headers : undefined));
    headers.set("X-CSRF-Token", csrfToken);
    options = { ...options, headers };
  }
  return nativeFetch(input, options);
};

function reportClientError(message, source = "") {
  if (!csrfToken || Date.now() - lastClientErrorAt < 10_000) return;
  lastClientErrorAt = Date.now();
  window.fetch("/api/monitor/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: String(message || "Erro no navegador"), source, view: activeView }),
  }).catch(() => {});
}

window.addEventListener("error", (event) => {
  reportClientError(event.message, event.filename || "window.error");
});
window.addEventListener("unhandledrejection", (event) => {
  reportClientError(event.reason?.message || String(event.reason || "Promise rejeitada"), "unhandledrejection");
});
const pageContent = document.querySelector(".page-content");
const dashboardTemplate = pageContent ? pageContent.innerHTML : "";
applyTheme();

function loadState() {
  try {
    return { ...seedState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return JSON.parse(JSON.stringify(seedState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveRemoteData("state", state);
}

async function initializeApp() {
  const needsOnboarding = await loadRemoteData();
  if (currentUser?.isAdmin) {
    render("gerenciamento");
    return;
  }
  if (needsOnboarding) {
    renderOnboarding();
    return;
  }
  render("inicio");
}

async function loadRemoteData() {
  try {
    const response = await fetch("/api/bootstrap", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Falha ao carregar dados do servidor.");

    const payload = await response.json();
    csrfToken = payload.csrfToken || "";
    const localState = state;
    const localCompany = localState?.company || {};
    const localPlan = localState?.settings?.companyAccess;
    const hasLocalCompany =
      localCompany.name &&
      localCompany.name !== seedState.company.name &&
      localCompany.name !== payload.company?.name;

    if (!payload.state && hasLocalCompany) {
      const syncResponse = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: localCompany.name,
          cnpj: localCompany.cnpj || "",
          certification: localCompany.certification || "",
          scope: localCompany.scope || "",
          plan: localPlan || payload.company?.plan || "",
        }),
      });

      if (syncResponse.ok) {
        const synced = await syncResponse.json();
        payload.company = synced.company || payload.company;
        payload.state = synced.state || payload.state;
        payload.needsOnboarding = false;
      }
    }

    currentUser = payload.user || null;
    state = normalizeState(payload.state, payload.company, payload.user);
    if (!canViewModule("documentos")) state.documents = [];
    if (!canViewModule("auditorias")) state.audits = [];
    if (!canViewModule("nao-conformidades")) state.ncs = [];
    if (!canViewModule("equipamentos")) state.equipment = [];
    riskData = canViewModule("riscos")
      ? payload.risk || loadLocalRiskData()
      : { riscos: [], objetivos: [], mudancas: [] };
    contextData = canViewModule("contexto")
      ? payload.context || loadLocalContextData()
      : { swot: [], partes: [], escopo: {}, processos: [] };
    leadershipData = canViewModule("lideranca")
      ? payload.leadership || loadLocalLeadershipData()
      : { ...structuredClone(leadershipSeeds), acoes: [], plano: [], cargos: [], comunicacao: [], _seedVersion: 2 };

    applyTheme();
    applyUserProfile();
    return Boolean(payload.needsOnboarding);
  } catch (error) {
    console.warn(error);
    riskData = loadLocalRiskData();
    contextData = loadLocalContextData();
    return false;
  }
}

function normalizeState(savedState, company, user) {
  const sourceState = savedState || state || {};
  const nextState = {
    ...structuredClone(seedState),
    ...sourceState,
  };

  nextState.company = {
    ...structuredClone(seedState.company),
    ...(sourceState.company || {}),
  };

  nextState.settings = {
    ...structuredClone(seedState.settings),
    ...(sourceState.settings || {}),
  };

  if (company) {
    nextState.company = {
      ...nextState.company,
      name: company.name || nextState.company.name,
      cnpj: company.cnpj || nextState.company.cnpj,
      scope: company.scope || nextState.company.scope,
      certification: company.certification || nextState.company.certification,
    };
    nextState.settings.companyAccess = company.plan || nextState.settings.companyAccess;
  }

  if (user?.name) {
    const userExists = nextState.users.some((item) => item.name === user.name || item.email === user.username);
    if (!userExists) {
      nextState.users.unshift({
        name: user.name,
        email: user.username,
        role: user.role || "Administrador",
        status: "Ativo",
      });
    }
  }

  return nextState;
}

function applyUserProfile() {
  if (!currentUser) return;
  const name = currentUser.name || currentUser.username || "Usuário";
  const role = currentUser.role || "Usuário";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";

  const avatar = document.querySelector(".tb-avatar");
  const userName = document.querySelector(".tb-user-name");
  const userRole = document.querySelector(".tb-user-role");
  if (avatar) avatar.textContent = initials;
  if (userName) userName.textContent = name;
  if (userRole) userRole.textContent = role;
  document.body.classList.toggle("readonly-company-user", !canManageCompany());
  const logoutForm = document.querySelector('form[action="/logout"]');
  if (logoutForm) {
    let field = logoutForm.querySelector('input[name="csrfToken"]');
    if (!field) {
      field = document.createElement("input");
      field.type = "hidden";
      field.name = "csrfToken";
      logoutForm.appendChild(field);
    }
    field.value = csrfToken;
  }
  if (currentUser.permissions?.reports === false) {
    document.querySelector('[data-view="relatorios"]')?.remove();
  }
  if (!canManageUsers()) {
    document.querySelector('[data-view="usuarios"]')?.remove();
  }
  if (!accessibleModules().length) {
    document.querySelector('[data-view="modulos"]')?.remove();
  }
  updateAdminNav();
  renderUserMenu();
}

function updateAdminNav() {
  if (!currentUser?.isAdmin) {
    document.querySelector('[data-view="gerenciamento"]')?.remove();
    return;
  }

  document.querySelectorAll(".sb-nav .nav-item").forEach((item) => {
    if (item.dataset.view !== "gerenciamento") item.remove();
  });

  if (document.querySelector('[data-view="gerenciamento"]')) return;

  const nav = document.querySelector(".sb-nav");
  const item = document.createElement("div");
  item.className = "nav-item";
  item.dataset.view = "gerenciamento";
  item.innerHTML = `${moduleIcon("plano")} Gerenciamento`;
  item.addEventListener("click", () => render("gerenciamento"));
  nav?.appendChild(item);
}

function renderOnboarding() {
  setActiveNav("");
  setTopbar("Boas-vindas", "Primeiro acesso ao SGQ Online");
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.innerHTML = `
    ${pageDecorHtml()}
    <section class="onboarding-shell">
      <div class="onboarding-copy">
        <div class="welcome-eyebrow">PRIMEIRO ACESSO</div>
        <h1 class="welcome-title">Bem-vindo ao SGQ Online</h1>
        <p class="welcome-sub">Antes de entrar no painel, vamos preparar o ambiente da sua empresa e mostrar o caminho básico de uso.</p>

        <div class="onboarding-tour">
          <article>
            <span>1</span>
            <div>
              <strong>Cadastre a empresa</strong>
              <p>Informe razão social, escopo, certificação e plano para separar seus dados no banco.</p>
            </div>
          </article>
          <article>
            <span>2</span>
            <div>
              <strong>Acesse os módulos</strong>
              <p>Use “Meus módulos” para registrar contexto, riscos, oportunidades e demais rotinas do SGQ.</p>
            </div>
          </article>
          <article>
            <span>3</span>
            <div>
              <strong>Acompanhe o resumo</strong>
              <p>A página inicial consolida os registros cadastrados nos módulos da sua empresa.</p>
            </div>
          </article>
        </div>

      </div>

      <form class="qp-card qp-form onboarding-form" id="onboardingForm">
        <div class="onboarding-form-head full">
          <strong>Configuração inicial</strong>
          <span>Leva menos de um minuto e pode ser ajustado depois.</span>
        </div>
        <div class="form-section-title">Dados do usuário</div>
        <label>
          <span>Nome completo</span>
          <input name="userName" value="${escapeHtml(currentUser?.name || "")}" autocomplete="name" required />
        </label>
        <label>
          <span>Cargo/perfil</span>
          <input name="userRole" value="${escapeHtml(currentUser?.role || "Administrador")}" placeholder="Ex.: Gestor da qualidade" required />
        </label>

        <div class="form-section-title full">Dados da empresa</div>
        <label>
          <span>Razão social</span>
          <input name="companyName" value="${escapeHtml(state.company.name)}" autocomplete="organization" required />
        </label>
        <label>
          <span>Nome fantasia</span>
          <input name="companyTradeName" value="${escapeHtml(state.company.tradeName || "")}" placeholder="Ex.: QualityPro Solutions" />
        </label>
        <label>
          <span>CNPJ</span>
          <input name="companyCnpj" value="${escapeHtml(state.company.cnpj)}" inputmode="numeric" placeholder="00.000.000/0001-00" />
        </label>
        <label>
          <span>Setor / segmento</span>
          <input name="companySegment" value="${escapeHtml(state.company.segment || "")}" placeholder="Ex.: Consultoria em Gestão da Qualidade" />
        </label>
        <label>
          <span>Porte da empresa</span>
          <select name="companySize">
            ${companySizeOptions(state.company.size)}
          </select>
        </label>
        <label>
          <span>Certificação</span>
          <input name="companyCertification" value="${escapeHtml(state.company.certification)}" placeholder="Ex.: ISO 9001:2015" />
        </label>
        <label>
          <span>Plano</span>
          <input name="companyPlan" value="${escapeHtml(state.settings.companyAccess)}" placeholder="Ex.: Plano Profissional" />
        </label>
        <label>
          <span>E-mail corporativo</span>
          <input name="companyEmail" type="email" value="${escapeHtml(state.company.email || "")}" placeholder="contato@empresa.com.br" />
        </label>
        <label>
          <span>Telefone</span>
          <input name="companyPhone" value="${escapeHtml(state.company.phone || "")}" placeholder="(00) 0000-0000" />
        </label>
        <label>
          <span>Responsável legal</span>
          <input name="companyResponsibleName" value="${escapeHtml(state.company.legalResponsibleName || currentUser?.name || "")}" placeholder="Ex.: Hugo Melo" />
        </label>
        <label>
          <span>Cargo do responsável</span>
          <input name="companyResponsibleRole" value="${escapeHtml(state.company.legalResponsibleRole || "")}" placeholder="Ex.: Diretor Geral" />
        </label>
        <label class="full">
          <span>Escopo do SGQ</span>
          <textarea name="companyScope" rows="4" placeholder="Descreva o escopo do Sistema de Gestão da Qualidade">${escapeHtml(state.company.scope)}</textarea>
        </label>

        <div class="onboarding-actions full">
          <button class="btn-primary" type="submit">Salvar e entrar no sistema</button>
        </div>
      </form>
    </section>
  `;

  document.querySelector("#onboardingForm")?.addEventListener("submit", saveOnboarding);
}

async function saveOnboarding(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const user = {
    name: data.get("userName"),
    role: data.get("userRole"),
  };
  const company = {
    name: data.get("companyName"),
    tradeName: data.get("companyTradeName"),
    cnpj: data.get("companyCnpj"),
    segment: data.get("companySegment"),
    size: data.get("companySize"),
    certification: data.get("companyCertification"),
    plan: data.get("companyPlan"),
    email: data.get("companyEmail"),
    phone: data.get("companyPhone"),
    legalResponsibleName: data.get("companyResponsibleName"),
    legalResponsibleRole: data.get("companyResponsibleRole"),
    scope: data.get("companyScope"),
  };

  currentUser = {
    ...(currentUser || {}),
    name: user.name,
    role: user.role,
  };
  state.company = {
    ...state.company,
    name: company.name,
    tradeName: company.tradeName,
    cnpj: company.cnpj,
    segment: company.segment,
    size: company.size,
    certification: company.certification,
    email: company.email,
    phone: company.phone,
    legalResponsibleName: company.legalResponsibleName,
    legalResponsibleRole: company.legalResponsibleRole,
    scope: company.scope,
    registry: normalizeCompanyRegistry(state.company.registry),
  };
  state.settings = {
    ...state.settings,
    companyAccess: company.plan,
  };
  state.users = upsertCurrentUser(state.users, currentUser);

  const response = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user,
      company,
      state,
      context: contextData || loadLocalContextData(),
      risk: riskData || loadLocalRiskData(),
      leadership: leadershipData || loadLocalLeadershipData(),
    }),
  });

  if (!response.ok) {
    toast("Não foi possível salvar o cadastro inicial.");
    return;
  }

  const payload = await response.json();
  if (payload.user) {
    currentUser = {
      ...(currentUser || {}),
      id: payload.user.id,
      companyId: payload.user.companyId,
      username: payload.user.username,
      name: payload.user.displayName,
      role: payload.user.role,
    };
  }
  if (payload.company) {
    state.company.name = payload.company.name || state.company.name;
    state.company.cnpj = payload.company.cnpj || state.company.cnpj;
    state.company.certification = payload.company.certification || state.company.certification;
    state.company.scope = payload.company.scope || state.company.scope;
    state.settings.companyAccess = payload.company.plan || state.settings.companyAccess;
  }

  applyUserProfile();
  toast("Cadastro inicial salvo.");
  render("inicio");
}

function upsertCurrentUser(users, user) {
  const rows = Array.isArray(users) ? [...users] : [];
  const email = user?.username || "";
  const name = user?.name || user?.username || "Usuário";
  const role = user?.role || "Administrador";
  const index = rows.findIndex((item) => item.email === email || item.name === name);
  const record = { name, email, role, status: "Ativo" };

  if (index >= 0) rows[index] = { ...rows[index], ...record };
  else rows.unshift(record);

  return rows;
}

function canManageCompany() {
  return Boolean(currentUser?.canManageCompany || currentUser?.isAdmin);
}

function canManageUsers() {
  return Boolean(canManageCompany() || currentUser?.permissions?.manageUsers);
}

function moduleAccessLevel(moduleId) {
  if (canManageCompany()) return "edit";
  if (currentUser?.permissions?.modules === false) return "none";
  const configured = currentUser?.permissions?.moduleAccess?.[moduleId];
  if (["none", "view", "edit"].includes(configured)) return configured;
  return defaultUserPermissions(currentUser?.role || "Colaborador").moduleAccess[moduleId] || "none";
}

function canViewModule(moduleId) {
  return ["view", "edit"].includes(moduleAccessLevel(moduleId));
}

function canEditModule(moduleId) {
  return moduleAccessLevel(moduleId) === "edit";
}

function accessibleModules() {
  return modules.filter((module) => canViewModule(module.id));
}

function renderUserMenu() {
  const trigger = document.querySelector(".tb-user");
  if (!trigger || !currentUser) return;

  trigger.setAttribute("role", "button");
  trigger.setAttribute("tabindex", "0");
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  trigger.querySelector(".user-menu")?.remove();

  const items = currentUser.isAdmin
    ? [
        ["Painel de gerenciamento", "gerenciamento"],
        ["Clientes e planos", "gerenciamento"],
        ["Usuários do sistema", "gerenciamento"],
        ["Segurança da conta", "perfil"],
        ["Configurações globais", "configuracoes"],
      ]
    : [
        ["Página inicial", "inicio"],
        ...(accessibleModules().length ? [["Meus módulos", "modulos"]] : []),
        ...(currentUser.permissions?.reports === false ? [] : [["Relatórios", "relatorios"]]),
        ["Meu perfil", "perfil"],
        ["Minhas permissões", "permissoes"],
        ...(canManageUsers() ? [["Gerenciar usuários", "usuarios"]] : []),
        ["Dados da empresa", "empresa"],
        ["Preferências", "configuracoes"],
        ["Central de ajuda", "ajuda"],
      ];

  const menu = document.createElement("div");
  menu.className = "user-menu";
  menu.setAttribute("role", "menu");
  menu.hidden = true;
  menu.innerHTML = `
    <div class="user-menu-head">
      <strong>${escapeHtml(currentUser.name || currentUser.username || "Usuário")}</strong>
      <span>${escapeHtml(currentUser.role || "Usuário")}</span>
    </div>
    ${items.map(([label, view]) => `<button type="button" data-user-menu-view="${view}" role="menuitem">${escapeHtml(label)}</button>`).join("")}
    <button type="button" class="danger" data-user-menu-action="logout" role="menuitem">Sair</button>
  `;
  trigger.appendChild(menu);

  const closeMenu = () => {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  };
  const toggleMenu = (event) => {
    event.stopPropagation();
    menu.hidden = !menu.hidden;
    trigger.setAttribute("aria-expanded", String(!menu.hidden));
  };

  trigger.onclick = toggleMenu;
  trigger.onkeydown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMenu(event);
    }
    if (event.key === "Escape") closeMenu();
  };

  menu.querySelectorAll("[data-user-menu-view]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      closeMenu();
      render(button.dataset.userMenuView);
    });
  });
  menu.querySelector("[data-user-menu-action='logout']")?.addEventListener("click", (event) => {
    event.stopPropagation();
    document.querySelector('form[action="/logout"]')?.submit();
  });

  if (!userMenuOutsideBound) {
    document.addEventListener("click", () => {
      document.querySelectorAll(".user-menu").forEach((openMenu) => {
        openMenu.hidden = true;
        openMenu.closest(".tb-user")?.setAttribute("aria-expanded", "false");
      });
    });
    userMenuOutsideBound = true;
  }
}

function saveRemoteData(key, value, moduleId = "") {
  return fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value, moduleId }),
    keepalive: true,
  }).then((response) => {
    if (!response.ok && response.status !== 403) throw new Error("Falha ao salvar dados no servidor.");
    return response.ok;
  }).catch((error) => {
    console.warn(error);
    return false;
  });
}

function applyTheme() {
  const isLight = state.settings.theme === "light";
  document.body.classList.toggle("theme-light", isLight);
  document.querySelectorAll(".app-theme-logo").forEach((logo) => {
    logo.src = "/assets/qualitypro-cloud-logo-app.png";
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setTopbar(title, subtitle) {
  const titleEl = document.querySelector(".topbar-title");
  const subtitleEl = document.querySelector(".topbar-subtitle");
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
}

function setActiveNav(view) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });
}

function render(view = "inicio") {
  const adminAllowedViews = ["gerenciamento", "configuracoes", "perfil"];
  if (currentUser?.isAdmin && !adminAllowedViews.includes(view)) {
    view = "gerenciamento";
  }
  activeView = view;
  if (view === "relatorios" && currentUser?.permissions?.reports === false) {
    toast("Seu perfil não possui permissão para visualizar relatórios.");
    view = "inicio";
  }
  if (view === "usuarios" && !canManageUsers()) {
    toast("Seu perfil não possui permissão para gerenciar usuários.");
    view = "inicio";
  }
  if (view === "modulos" && !accessibleModules().length) {
    toast("Seu perfil não possui módulos liberados.");
    view = "inicio";
  }

  document.body.classList.toggle("home-dashboard", view === "inicio");
  setActiveNav(view);
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.classList.remove("leadership-page-content");
  pageContent.classList.remove("nc-page-content");
  pageContent.classList.remove("company-page-content");
  pageContent.classList.remove("users-page-content");
  pageContent.classList.remove("modules-page-content");

  const views = {
    inicio: renderInicio,
    modulos: renderModulos,
    empresa: renderEmpresa,
    usuarios: renderUsuarios,
    perfil: renderMeuPerfil,
    permissoes: renderMinhasPermissoes,
    notificacoes: renderNotificacoes,
    relatorios: renderRelatorios,
    gerenciamento: renderGerenciamento,
    configuracoes: renderConfiguracoes,
    ajuda: renderAjuda,
  };

  const renderView = views[view] || renderInicio;
  renderView();
  bindGlobalSearch(view);
  scrollPageToTop();
}

function scrollPageToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  pageContent.scrollTop = 0;
}

function renderInicio() {
  setTopbar("Página inicial", "Bem-vindo ao QualityPro Cloud");
  ensureRiskData();
  ensureContextData();
  pageContent.innerHTML = renderDashboardHtml();
  bindDashboardActions();
}

function renderDashboardHtml() {
  const summary = dashboardSummary();
  const moduleCards = accessibleModules()
    .slice(0, 6)
    .map((module) => dashboardCompactModuleCard(module, summary.modules[module.id]))
    .join("");
  const audits = state.audits || [];
  const ncs = state.ncs || [];
  const docs = state.documents || [];
  const openNcs = ncs.filter((item) => !isClosedStatus(item.status));
  const plannedAudits = audits.filter((item) => !isClosedStatus(item.status));
  const pendingDocs = docs.filter((item) => item.status !== "Aprovado");
  const certification = state.company.certification || "Não informada";
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const tasks = dashboardTaskItems(openNcs, plannedAudits, pendingDocs);
  const alerts = dashboardAlertItems(summary, openNcs, pendingDocs, certification);

  return `
    <div class="home-v2">
      <section class="home-v2-summary">
        <header class="home-v2-welcome">
          <div>
            <h1>Olá, ${escapeHtml(firstName(currentUser?.name || "Usuário"))}!</h1>
            <p>Aqui está um resumo do seu Sistema de Gestão.</p>
          </div>
          <time>${escapeHtml(dateLabel)}</time>
        </header>
        <div class="home-v2-kpis">
          ${dashboardCompanyKpi(state.company.name || "Sua empresa")}
          ${dashboardKpi("modulos", "Registros do SGQ", summary.totalRecords, `${summary.openActions} ações ou itens em acompanhamento`, "#43a7ff", Math.min(100, summary.totalRecords * 2))}
          ${dashboardKpi("auditorias", "Auditorias", audits.length, `${plannedAudits.length} em andamento ou planejamento`, "#9a75ff", audits.length ? Math.max(24, 100 - plannedAudits.length * 18) : 0)}
          ${dashboardKpi("nao-conformidades", "Não conformidades", openNcs.length, `${openNcs.length} abertas ou em tratamento`, "#ffad32", ncs.length ? Math.round(((ncs.length - openNcs.length) / ncs.length) * 100) : 100)}
          ${dashboardKpi("check-circle", "Certificação", certification, state.company.scope ? "Escopo definido no sistema" : "Complete os dados da empresa", "#27d8be", state.company.scope ? 82 : 30)}
        </div>
      </section>

      <div class="home-v2-layout">
        <main class="home-v2-main">
          <section class="home-v2-panel home-v2-modules">
            <div class="home-v2-heading">
              <div><h2>Meus módulos</h2><p>Acesse e gerencie os principais módulos do seu SGQ.</p></div>
              <button type="button" data-view-target="modulos">Ver todos os módulos ${moduleIcon("arrow")}</button>
            </div>
            <div class="home-v2-module-grid">${moduleCards}</div>
          </section>

          <div class="home-v2-bottom-grid">
            <section class="home-v2-panel home-v2-panorama">
              <div class="home-v2-heading"><div><h2>Panorama do SGQ</h2><p>Distribuição atual dos registros que exigem atenção.</p></div></div>
              ${dashboardPanoramaRow("Não conformidades", openNcs.length, Math.max(summary.openActions, 1), "#ffad32")}
              ${dashboardPanoramaRow("Ações em acompanhamento", summary.openActions, Math.max(summary.openActions, 1), "#42a8ff")}
              ${dashboardPanoramaRow("Auditorias planejadas", plannedAudits.length, Math.max(summary.openActions, 1), "#31d392")}
            </section>
            <section class="home-v2-panel home-v2-activity">
              <div class="home-v2-heading"><div><h2>Visão rápida</h2><p>Últimos dados disponíveis no sistema.</p></div></div>
              <div class="home-v2-activity-list">${dashboardActivityRows(docs, audits, ncs)}</div>
            </section>
          </div>
        </main>

        <aside class="home-v2-rail">
          <section class="home-v2-panel">
            <div class="home-v2-heading"><h2>Minhas tarefas</h2><button type="button" data-view-target="relatorios">Ver todas</button></div>
            <div class="home-v2-list">${tasks}</div>
          </section>
          <section class="home-v2-panel">
            <div class="home-v2-heading"><h2>Alertas importantes</h2><button type="button" data-view-target="notificacoes">Ver todos</button></div>
            <div class="home-v2-alerts">${alerts}</div>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function dashboardCompanyKpi(companyName) {
  return `<article class="home-v2-kpi home-v2-company-kpi" style="--home-accent:#43a7ff;">
    <div class="home-v2-kpi-top"><span>${moduleIcon("home")}</span><div><small>Empresa</small><strong>${escapeHtml(companyName)}</strong></div></div>
    <button class="home-v2-company-link" type="button" data-view-target="empresa">Ver dados da empresa ${moduleIcon("arrow")}</button>
  </article>`;
}

function dashboardKpi(icon, label, value, caption, accent, progress) {
  return `<article class="home-v2-kpi" style="--home-accent:${accent}; --home-progress:${Math.max(0, Math.min(100, progress))}%">
    <div class="home-v2-kpi-top"><span>${moduleIcon(icon)}</span><div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div></div>
    <p>${escapeHtml(caption)}</p><i><b></b></i>
  </article>`;
}

function dashboardCompactModuleCard(module, info) {
  const meta = info || { value: "0 registros", caption: "Aguardando dados cadastrados" };
  return `<article class="home-v2-module" data-module-card="${module.id}" role="button" tabindex="0" style="--home-accent:${module.accent};">
    <div class="home-v2-module-icon">${moduleIcon(module.id)}</div>
    <div class="home-v2-module-copy"><h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.desc)}</p></div>
    <div class="home-v2-module-foot"><span>${escapeHtml(meta.value)}</span>${moduleIcon("arrow")}</div>
  </article>`;
}

function dashboardTaskItems(openNcs, plannedAudits, pendingDocs) {
  const items = [
    ...openNcs.slice(0, 2).map((item) => ({ label: `Tratar ${item.id || item.code || "não conformidade"}`, meta: item.status || "Em aberto", color: "#ff646f", module: "nao-conformidades" })),
    ...plannedAudits.slice(0, 1).map((item) => ({ label: item.title || "Auditoria planejada", meta: item.date ? formatDate(item.date) : item.status, color: "#ffad32", module: "auditorias" })),
    ...pendingDocs.slice(0, 1).map((item) => ({ label: `Revisar ${item.code || item.title || "documento"}`, meta: item.status, color: "#43a7ff", module: "documentos" })),
  ].slice(0, 4);
  if (!items.length) return `<div class="home-v2-empty">Nenhuma tarefa pendente no momento.</div>`;
  return items.map((item) => `<button type="button" data-module="${item.module}" style="--item-color:${item.color}"><i></i><span>${escapeHtml(item.label)}</span><small>${escapeHtml(item.meta || "")}</small></button>`).join("");
}

function dashboardAlertItems(summary, openNcs, pendingDocs, certification) {
  const items = [
    { icon: "nao-conformidades", value: `${openNcs.length} não conformidades em aberto`, detail: "Acompanhe análise de causa, ações e eficácia.", color: "#ffad32", module: "nao-conformidades" },
    { icon: "info", value: `${summary.openActions} itens em acompanhamento`, detail: "Existem registros que precisam da sua atenção.", color: "#43a7ff", view: "relatorios" },
    { icon: "check-circle", value: certification, detail: pendingDocs.length ? `${pendingDocs.length} documento(s) ainda aguardam aprovação.` : "Documentação principal aprovada.", color: "#31d392", module: "documentos" },
  ];
  return items.map((item) => `<button type="button" ${item.module ? `data-module="${item.module}"` : `data-view-target="${item.view}"`} style="--item-color:${item.color}"><span>${moduleIcon(item.icon)}</span><div><strong>${escapeHtml(item.value)}</strong><p>${escapeHtml(item.detail)}</p></div></button>`).join("");
}

function dashboardPanoramaRow(label, value, max, color) {
  const width = value ? Math.max(8, Math.round((value / max) * 100)) : 0;
  return `<div class="home-v2-bar"><div><span>${escapeHtml(label)}</span><strong>${value}</strong></div><i><b style="width:${width}%; background:${color}"></b></i></div>`;
}

function dashboardActivityRows(docs, audits, ncs) {
  const rows = [
    docs[0] && { icon: "documentos", label: `Documento: ${docs[0].code || docs[0].title}`, detail: docs[0].status, color: "#43a7ff", module: "documentos" },
    audits[0] && { icon: "auditorias", label: audits[0].title || "Auditoria", detail: audits[0].status, color: "#31d392", module: "auditorias" },
    ncs[0] && { icon: "nao-conformidades", label: ncs[0].id || ncs[0].code || "Não conformidade", detail: ncs[0].status, color: "#ffad32", module: "nao-conformidades" },
  ].filter(Boolean);
  if (!rows.length) return `<div class="home-v2-empty">Os registros recentes aparecerão aqui.</div>`;
  return rows.map((row) => `<button type="button" data-module="${row.module}" style="--item-color:${row.color}"><span>${moduleIcon(row.icon)}</span><div><strong>${escapeHtml(row.label)}</strong><small>${escapeHtml(row.detail || "")}</small></div>${moduleIcon("arrow")}</button>`).join("");
}

function pageDecorHtml() {
  return `
    <div class="page-decor">
      <svg width="420" height="420" style="top:-140px; right:-120px;" viewBox="0 0 420 420">
        <defs><pattern id="dotgrid2" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#2f8ff0"/></pattern></defs>
        <rect width="420" height="420" fill="url(#dotgrid2)"/>
      </svg>
      <svg width="300" height="180" style="bottom:70px; right:6%;" viewBox="0 0 300 180" fill="none">
        <polyline points="10,140 60,110 110,125 160,70 210,90 260,30" stroke="#4fa3ff" stroke-width="3" fill="none"/>
        <circle cx="160" cy="70" r="5" fill="#4fa3ff"/><circle cx="260" cy="30" r="5" fill="#4fa3ff"/>
        <line x1="0" y1="160" x2="300" y2="160" stroke="#4fa3ff" stroke-width="1.5"/>
      </svg>
      <svg width="200" height="200" style="top:38%; right:26%;" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="90" r="62" stroke="#4fa3ff" stroke-width="2.5"/>
        <circle cx="100" cy="90" r="46" stroke="#4fa3ff" stroke-width="2"/>
        <path d="M76 90l16 16 34-34" stroke="#4fa3ff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg width="230" height="230" style="bottom:-60px; left:2%;" viewBox="0 0 230 230" fill="none">
        <circle cx="115" cy="115" r="16" stroke="#4fa3ff" stroke-width="3"/>
        <path d="M115 55v14M115 176v14M55 115h14M176 115h14M74 74l10 10M156 156l10 10M156 74l-10 10M74 156l10 10" stroke="#4fa3ff" stroke-width="3" stroke-linecap="round"/>
      </svg>
      <svg width="260" height="200" style="top:60%; left:32%;" viewBox="0 0 260 200" fill="none">
        <line x1="30" y1="30" x2="120" y2="80" stroke="#4fa3ff" stroke-width="1.5"/>
        <line x1="120" y1="80" x2="220" y2="50" stroke="#4fa3ff" stroke-width="1.5"/>
        <line x1="120" y1="80" x2="160" y2="160" stroke="#4fa3ff" stroke-width="1.5"/>
        <circle cx="30" cy="30" r="5" fill="#4fa3ff"/><circle cx="120" cy="80" r="7" fill="#4fa3ff"/>
        <circle cx="220" cy="50" r="5" fill="#4fa3ff"/><circle cx="160" cy="160" r="5" fill="#4fa3ff"/>
      </svg>
    </div>
  `;
}

function dashboardModuleCard(module, info) {
  const meta = info || { value: "0 registros", caption: "Aguardando dados cadastrados" };
  return `
    <article class="module-card" data-module-card="${module.id}" role="button" tabindex="0" style="--accent-line:${module.accent};">
      <div class="module-icon" style="border-color:${hexToRgba(module.accent, 0.4)}; color:${module.accent};">
        ${moduleIcon(module.id)}
      </div>
      <h3 class="module-title">${escapeHtml(module.title)}</h3>
      <p class="module-desc">${escapeHtml(module.desc)}</p>
      <div class="module-live">
        <strong>${escapeHtml(meta.value)}</strong>
        <span>${escapeHtml(meta.caption)}</span>
      </div>
      <button class="module-cta" data-module="${module.id}" type="button">Acessar módulo ${moduleIcon("arrow")}</button>
    </article>
  `;
}

function dashboardSummary() {
  const swot = contextGet("swot");
  const partes = contextGet("partes");
  const escopo = contextGet("escopo");
  const processos = contextGet("processos");
  const riscos = riskGet("riscos");
  const objetivos = riskGet("objetivos");
  const mudancas = riskGet("mudancas");
  const docs = state.documents || [];
  const audits = state.audits || [];
  const ncs = state.ncs || [];
  const users = state.users || [];
  const leadership = leadershipGetAll();
  const leadershipOpenPlans = leadership.plano.filter((item) => !isClosedStatus(item.status)).length;
  const leadershipActiveRoles = leadership.cargos.filter((item) => item.status === "Ativo").length;
  const openSwotPlans = swot.filter((item) => item.planoNecessario === "Sim" && item.status !== "Concluído").length;
  const highRisks = riscos.filter((item) => riskLevel(item.probabilidade, item.impacto).value >= 10).length;
  const activeRisks = riscos.filter((item) => !isClosedStatus(item.status)).length;
  const activeGoals = objetivos.filter((item) => item.status !== "Atingido").length;
  const activeChanges = mudancas.filter((item) => !isClosedStatus(item.status)).length;
  const openNcs = ncs.filter((item) => !isClosedStatus(item.status)).length;
  const pendingDocs = docs.filter((item) => item.status !== "Aprovado").length;
  const plannedAudits = audits.filter((item) => !isClosedStatus(item.status)).length;
  const totalRecords = swot.length + partes.length + processos.length + riscos.length + objetivos.length + mudancas.length + docs.length + audits.length + ncs.length + users.length;
  const escopoStatus = hasEscopoData(escopo) ? escopo.statusAprovacao || "sem status" : "sem escopo";

  return {
    totalRecords,
    openActions: openSwotPlans + activeRisks + activeGoals + activeChanges + openNcs + pendingDocs + plannedAudits,
    modules: {
      contexto: {
        value: `${swot.length + partes.length + processos.length} registros`,
        caption: `${swot.length} SWOT · ${partes.length} partes · ${processos.length} processos · ${escopoStatus}`,
      },
      lideranca: {
        value: `${leadership.acoes.length + leadership.plano.length + leadership.cargos.length} registros`,
        caption: `${leadershipOpenPlans} planos abertos · ${leadershipActiveRoles} cargos ativos · ${leadership.politica.status}`,
      },
      riscos: {
        value: `${riscos.length} itens`,
        caption: `${highRisks} críticos/altos · ${objetivos.length} objetivos · ${activeChanges} mudanças abertas`,
      },
      documentos: {
        value: `${docs.length} documentos`,
        caption: `${pendingDocs} em revisão/pendentes · ${docs.length - pendingDocs} aprovados`,
      },
      auditorias: {
        value: `${audits.length} auditorias`,
        caption: `${plannedAudits} planejadas/em preparação`,
      },
      "nao-conformidades": {
        value: `${ncs.length} registros`,
        caption: `${openNcs} abertas/em tratamento`,
      },
      equipamentos: {
        value: "Disponível",
        caption: "Pronto para receber calibrações e manutenções",
      },
    },
  };
}

function isClosedStatus(status) {
  return ["Aprovado", "Atingido", "Concluído", "Concluída", "Fechado", "Fechada", "Resolvido", "Resolvida", "Encerrado", "Encerrada"].includes(status);
}

function shortText(value, maxLength) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "Usuário";
}

function renderModulos() {
  setTopbar("Meus módulos", "Módulos do QualityPro Cloud contratados pela sua empresa");
  pageContent.classList.add("modules-page-content");
  const moduleOrder = ["contexto", "lideranca", "riscos", "documentos", "auditorias", "nao-conformidades", "equipamentos"];
  const hasAllModules = /premium/i.test(state.settings.companyAccess || "");
  const contractedModuleIds = hasAllModules ? moduleOrder : moduleOrder.filter((id) => id !== "equipamentos");
  const activeModules = contractedModuleIds
    .map((id) => modules.find((module) => module.id === id))
    .filter((module) => module && canViewModule(module.id));
  const availableModules = modules.length - activeModules.length;
  const nextRenewal = "15/09/2026";
  pageContent.innerHTML = `
    <div class="mymods-toolbar">
      <div>
        <div class="welcome-eyebrow">MEUS MÓDULOS · ASSINATURAS</div>
        <h1 class="welcome-title">Módulos contratados</h1>
        <p class="welcome-sub">Acompanhe o status, a modalidade e a vigência de cada módulo contratado pela sua empresa.</p>
      </div>
    </div>

    <div class="mymods-kpi-row">
      <article class="kpi-card" style="--accent-line:#2f8ff0;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(47,143,240,0.4); color:#4fa3ff;">
            ${moduleIcon("modulos")}
          </div>
          <div>
            <div class="kpi-label">Módulos contratados</div>
            <div class="kpi-value big">${activeModules.length}<span> / ${modules.length}</span></div>
          </div>
        </div>
        <div class="kpi-caption muted">${availableModules} ${availableModules === 1 ? "módulo disponível" : "módulos disponíveis"} para contratação</div>
      </article>

      <article class="kpi-card" style="--accent-line:#F2B705;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(242,183,5,0.4); color:#F2B705;">
            ${moduleIcon("plano")}
          </div>
          <div>
            <div class="kpi-label">Plano contratado</div>
            <div class="kpi-value">${escapeHtml(state.settings.companyAccess)}</div>
          </div>
        </div>
        <button class="kpi-link" type="button" data-view-target="configuracoes">Ver detalhes do plano ${moduleIcon("arrow")}</button>
      </article>

      <article class="kpi-card" style="--accent-line:#FBBF24;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(251,191,36,0.4); color:#FBBF24;">
            ${moduleIcon("calendar")}
          </div>
          <div>
            <div class="kpi-label">Próxima renovação</div>
            <div class="kpi-value">${nextRenewal}</div>
          </div>
        </div>
        <div class="kpi-caption amber">Auditorias · renovação mensal</div>
      </article>
    </div>

    <section class="mymods-section">
      <div class="section-hd">
        <h2 class="section-title">Módulos ativos</h2>
        <p class="section-sub">Estes são os módulos atualmente contratados e disponíveis para uso pela sua empresa.</p>
      </div>

      <div class="mymods-grid ${activeModules.length === 7 ? "has-seven" : ""}">
        ${activeModules
        .map(
          (module) => {
            const isAudit = module.id === "auditorias";
            return `
            <article class="mymod-card" data-module-card="${module.id}" role="button" tabindex="0" style="--accent-line:${module.accent}">
              <div class="mymod-top">
                <div class="mymod-id">
                  <div class="mymod-icon" style="border-color:${hexToRgba(module.accent, 0.4)}; color:${module.accent};">
                    ${moduleIcon(module.id)}
                  </div>
                  <div>
                    <h3 class="mymod-title">${module.title}</h3>
                    <div class="mymod-plan">${isAudit ? "Módulo adicional contratado à parte" : `Incluído no ${escapeHtml(state.settings.companyAccess)}`}</div>
                  </div>
                </div>
                <span class="status-pill ${isAudit ? "st-pending" : "st-active"}"><span class="status-dot2"></span>${isAudit ? "Renovação próxima" : "Ativo"}</span>
              </div>
              <p class="mymod-desc">${module.desc}</p>
              <div class="mymod-meta">
                <div class="mymod-meta-item">
                  <div class="lbl">Modalidade</div>
                  <div class="val">${isAudit ? "Mensal" : "Anual"}</div>
                </div>
                <div class="mymod-meta-item">
                  <div class="lbl">Período de acesso</div>
                  <div class="val mono">${isAudit ? "Desde 15/06/2026" : "01/01/2026 - 31/12/2026"}</div>
                </div>
                <div class="mymod-meta-item">
                  <div class="lbl">Renovação</div>
                  <div class="val mono ${isAudit ? "renewal-alert" : ""}">${isAudit ? nextRenewal : "31/12/2026"}</div>
                </div>
              </div>
              <div class="mymod-foot">
                <button class="module-cta" data-module="${module.id}" type="button">Acessar módulo ${moduleIcon("arrow")}</button>
              </div>
            </article>
          `;
          },
        )
        .join("")}
      </div>

      ${availableModules ? `<div class="section-hd mymods-available-hd">
        <h2 class="section-title">Módulos disponíveis para contratação</h2>
        <p class="section-sub">Módulos não contratados que podem ser adicionados ao seu plano.</p>
      </div>

      <div class="mymods-banner">
        <div class="mymods-banner-text">
          <div class="mymods-banner-icon">${moduleIcon("modulos")}</div>
          <div>
            <p class="mymods-banner-title">${availableModules} ${availableModules === 1 ? "módulo disponível" : "módulos disponíveis"} para contratação</p>
            <p class="mymods-banner-sub">Entre em contato com o suporte para adicionar novos módulos ao seu plano.</p>
          </div>
        </div>
        <button class="btn-ghost-cta" data-module="equipamentos" type="button">Falar com o suporte ${moduleIcon("arrow")}</button>
      </div>` : ""}
    </section>
  `;
  bindModuleButtons();
  bindViewTargetButtons();
}

function moduleIcon(name) {
  const icons = {
    modulos: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    plano: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',
    calendar: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    home: '<svg class="icon" viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    contexto: '<svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    lideranca: '<svg class="icon" viewBox="0 0 24 24"><path d="M2 20h20"/><path d="M5 20V10l-2-2 4-3 5 4 5-4 4 3-2 2v10"/><circle cx="12" cy="6" r="2"/></svg>',
    riscos: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>',
    documentos: '<svg class="icon" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14 3 14 8 19 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
    auditorias: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    "nao-conformidades": '<svg class="icon" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="17" x2="12" y2="17"/></svg>',
    equipamentos: '<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></svg>',
    info: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg>',
    arrow: '<svg class="icon" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    plus: '<svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    minus: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8"/></svg>',
    "check-circle": '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>',
    edit: '<svg class="icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
    eye: '<svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    trash: '<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    shield: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
    key: '<svg class="icon" viewBox="0 0 24 24"><circle cx="7.5" cy="14.5" r="3.5"/><path d="M10 12l9-9"/><path d="M15 4l5 5"/><path d="M14 8l2 2"/></svg>',
    mail: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>',
    download: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 21h14"/></svg>',
    external: '<svg class="icon" viewBox="0 0 24 24"><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/></svg>',
    search: '<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    notificacoes: '<svg class="icon" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    close: '<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    "trend-up": '<svg class="trend-icon" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="8 7 17 7 17 16"/></svg>',
    "trend-down": '<svg class="trend-icon" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 8 17 17 8 17"/></svg>',
  };
  return icons[name] || icons.modulos;
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const number = Number.parseInt(value, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  return `rgba(${red},${green},${blue},${alpha})`;
}

function renderModuleDetail(moduleId) {
  document.body.classList.remove("home-dashboard");
  activeView = "modulos";
  setActiveNav("modulos");
  pageContent.classList.remove("company-page-content");
  pageContent.classList.remove("users-page-content");
  pageContent.classList.remove("modules-page-content");
  if (!canViewModule(moduleId)) {
    toast("Seu perfil não possui acesso a este módulo.");
    render("modulos");
    return;
  }

  if (moduleId === "contexto") {
    renderContextModule();
    return;
  }

  if (moduleId === "lideranca") {
    renderLeadershipModule();
    return;
  }

  if (moduleId === "riscos") {
    renderRiskOpportunityModule();
    return;
  }

  if (moduleId === "nao-conformidades") {
    renderNonConformityModule();
    return;
  }

  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.classList.remove("nc-page-content");
  const module = modules.find((item) => item.id === moduleId) || modules[0];
  setTopbar(module.title, "Rotina operacional do módulo");
  pageContent.innerHTML = `
    ${viewHeader(module.title, module.desc)}
    <div class="qp-layout">
      <article class="qp-card">
        <h3>Fluxo do módulo</h3>
        <div class="qp-steps">
          <span>Cadastro</span>
          <span>Análise</span>
          <span>Aprovação</span>
          <span>Acompanhamento</span>
        </div>
      </article>
      <article class="qp-card">
        <h3>Próximas entregas</h3>
        <ul class="qp-list">
          <li>Cadastro de registros com anexos</li>
          <li>Histórico de alterações</li>
          <li>Permissões por usuário</li>
          <li>Relatórios exportáveis</li>
        </ul>
      </article>
    </div>
    ${renderOperationalTable(moduleId)}
  `;
  scrollPageToTop();
}

function ensureLeadershipData() {
  if (!leadershipData) leadershipData = loadLocalLeadershipData();
  Object.keys(leadershipSeeds).forEach((key) => {
    if (leadershipData[key] === undefined || leadershipData[key] === null) {
      leadershipData[key] = structuredClone(leadershipSeeds[key]);
    }
  });
  if (leadershipData._seedVersion !== 2) {
    ["acoes", "comunicacao", "cargos"].forEach((key) => {
      leadershipData[key] = mergeSeedRows(leadershipData[key], leadershipSeeds[key]);
    });
    leadershipData._seedVersion = 2;
    localStorage.setItem(leadershipStorageKey, JSON.stringify(leadershipData));
    saveRemoteData("leadership", leadershipData);
  }
}

function mergeSeedRows(currentRows, seedRows) {
  const rows = Array.isArray(currentRows) ? structuredClone(currentRows) : [];
  const seedById = new Map(seedRows.map((item) => [item.id, item]));
  const hasOnlySeedRows = rows.every((item) => seedById.has(item.id));
  if (!hasOnlySeedRows || rows.length >= seedRows.length) return rows;

  const ids = new Set(rows.map((item) => item.id));
  return [...rows, ...seedRows.filter((item) => !ids.has(item.id)).map((item) => structuredClone(item))];
}

function leadershipGetAll() {
  ensureLeadershipData();
  return structuredClone(leadershipData);
}

function leadershipGet(key) {
  ensureLeadershipData();
  return structuredClone(leadershipData[key] ?? leadershipSeeds[key]);
}

function leadershipSet(key, value) {
  ensureLeadershipData();
  leadershipData[key] = structuredClone(value);
  localStorage.setItem(leadershipStorageKey, JSON.stringify(leadershipData));
  saveRemoteData("leadership", leadershipData);
}

function loadLocalLeadershipData() {
  try {
    return {
      ...structuredClone(leadershipSeeds),
      ...JSON.parse(localStorage.getItem(leadershipStorageKey) || "{}"),
    };
  } catch {
    return structuredClone(leadershipSeeds);
  }
}

function renderLeadershipModule() {
  ensureLeadershipData();
  setActiveNav("modulos");
  setTopbar("Liderança e Comprometimento", "Módulo do QualityPro Cloud · ISO 9001:2015, cláusula 5");
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.classList.add("leadership-page-content");
  pageContent.innerHTML = `
    <div class="breadcrumb">
      <button type="button" data-view-target="modulos">Meus módulos</button>
      <span class="sep">›</span>
      <span class="cur">Liderança e Comprometimento</span>
    </div>

    <div class="page-toolbar context-toolbar">
      <div>
        <div class="welcome-eyebrow">LIDERANÇA</div>
        <h1 class="welcome-title">Liderança e Comprometimento</h1>
        <p class="welcome-sub">Comprometimento da Alta Direção, política da qualidade e papéis, responsabilidades e autoridades do SGQ.</p>
      </div>
    </div>

    <div class="context-kpi-row" id="leadershipKpis"></div>

    <div class="ctx-tabs" id="leadershipMainTabs">
      <button class="ctx-tab active" data-leadership-main="lideranca" type="button">Liderança e Comprometimento</button>
      <button class="ctx-tab" data-leadership-main="politica" type="button">Política da Qualidade</button>
      <button class="ctx-tab" data-leadership-main="papeis" type="button">Papéis e Responsabilidades</button>
    </div>
    <div class="subfilter-row" id="leadershipSubTabs"></div>
    <div id="leadershipTabContent"></div>
    <div id="leadershipModalMount"></div>
  `;
  bindViewTargetButtons();
  bindLeadershipStaticActions();
  renderLeadershipTabs();
  renderLeadershipKpis();
  scrollPageToTop();
}

function bindLeadershipStaticActions() {
  document.querySelectorAll("[data-leadership-main]").forEach((button) => {
    button.addEventListener("click", () => {
      currentLeadershipMainTab = button.dataset.leadershipMain;
      currentLeadershipSubTab = leadershipTabs[currentLeadershipMainTab][0][0];
      renderLeadershipTabs();
    });
  });

  if (document.body.dataset.leadershipActionsBound === "true") return;
  document.body.dataset.leadershipActionsBound = "true";
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lc-action]");
    if (!button) return;
    event.preventDefault();
    handleLeadershipAction(button.dataset.lcAction, button.dataset.id);
  });
}

function renderLeadershipTabs() {
  document.querySelectorAll("[data-leadership-main]").forEach((button) => {
    button.classList.toggle("active", button.dataset.leadershipMain === currentLeadershipMainTab);
  });
  const subTabs = document.querySelector("#leadershipSubTabs");
  if (subTabs) {
    subTabs.innerHTML = leadershipTabs[currentLeadershipMainTab]
      .map(([key, label]) => `<button class="subfilter-pill ${currentLeadershipSubTab === key ? "active" : ""}" data-lc-action="switch-tab" data-id="${key}" type="button">${escapeHtml(label)}</button>`)
      .join("");
  }
  renderLeadershipTabContent();
  renderLeadershipKpis();
}

function renderLeadershipKpis() {
  const data = leadershipGetAll();
  const completeActions = data.acoes.filter((item) => item.status === "Concluída").length;
  const reachedPeople = data.comunicacao.reduce((sum, item) => sum + (Number(item.qtdPessoas) || 0), 0);
  const activeRoles = data.cargos.filter((item) => item.status === "Ativo").length;
  const target = document.querySelector("#leadershipKpis");
  if (!target) return;
  target.innerHTML = `
    ${leadershipKpi("Comprometimento da direção", data.acoes.length, `${completeActions} concluídas`, "#F2B705", "lideranca")}
    ${leadershipKpi("Política da qualidade", `Rev. ${data.politica.revisao || "-"}`, data.politica.status || "-", "#46D9F5", "documentos")}
    ${leadershipKpi("Comunicações da política", data.comunicacao.length, `${reachedPeople} pessoas alcançadas`, "#34D399", "contexto")}
    ${leadershipKpi("Cargos mapeados", data.cargos.length, `${activeRoles} ativos`, "#A78BFA", "modulos")}
  `;
}

function leadershipKpi(label, value, caption, color, icon) {
  return `
    <article class="kpi-card" style="--accent-line:${color};">
      <div class="kpi-top">
        <div class="kpi-icon" style="border-color:${hexToRgba(color, 0.4)}; color:${color};">${moduleIcon(icon)}</div>
        <div><div class="kpi-label">${escapeHtml(label)}</div><div class="kpi-value big">${escapeHtml(value)}</div></div>
      </div>
      <div class="kpi-caption">${escapeHtml(caption)}</div>
    </article>`;
}

function renderLeadershipTabContent() {
  const target = document.querySelector("#leadershipTabContent");
  if (!target) return;
  const renderers = {
    acoes: leadershipActionsHtml,
    posicionamento: leadershipPositionHtml,
    plano: leadershipPlanHtml,
    indicadores: leadershipIndicatorsHtml,
    politica: leadershipPolicyHtml,
    comunicacao: leadershipCommunicationHtml,
    cargos: leadershipRolesHtml,
    raci: leadershipRaciHtml,
    delegacoes: leadershipDelegationsHtml,
    aprovacoes: leadershipApprovalsHtml,
    compromissos: leadershipCommitmentsHtml,
    indicadoresPapeis: leadershipRoleIndicatorsHtml,
  };
  target.innerHTML = (renderers[currentLeadershipSubTab] || leadershipActionsHtml)();
}

function leadershipCard(title, subtitle, buttonLabel, action, table) {
  return `
    <section class="dcc">
      <div class="dcc-hd">
        <div><div class="dcc-title">${escapeHtml(title)}</div><div class="dcc-sub">${escapeHtml(subtitle)}</div></div>
        ${buttonLabel && canEditModule("lideranca") ? `<button class="btn-grad" data-lc-action="${action}" type="button">${moduleIcon("plus")}${escapeHtml(buttonLabel)}</button>` : ""}
      </div>
      <div class="risk-table-wrap">${table}</div>
    </section>`;
}

function leadershipActionsHtml() {
  const rows = leadershipGet("acoes").sort((a, b) => new Date(b.data) - new Date(a.data));
  const body = rows.length ? rows.map((item) => `
    <tr>
      <td class="mono">${formatDate(item.data)}</td><td>${leadershipActionTypeChip(item.tipo)}</td>
      <td class="desc-cell">${escapeHtml(item.descricao)}</td><td class="desc-cell">${escapeHtml(item.participantes)}</td>
      <td>${escapeHtml(item.evidencia || "-")}</td><td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td>
      <td>${leadershipActions("acao", item.id)}</td>
    </tr>`).join("") : `<tr><td colspan="7"><div class="empty-state">Nenhuma ação registrada.</div></td></tr>`;
  return leadershipCard("Ações da Direção", "Evidências do comprometimento da Alta Direção com o SGQ · 5.1", "Nova ação", "new-acao", `
    <table class="ctxtbl"><colgroup><col style="width:10%"><col style="width:14%"><col style="width:25%"><col style="width:18%"><col style="width:13%"><col style="width:10%"><col style="width:10%"></colgroup>
    <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Participantes</th><th>Evidência</th><th>Status</th><th>Ações</th></tr></thead><tbody>${body}</tbody></table>`);
}

function leadershipActionTypeChip(type) {
  const classes = {
    "Reunião Estratégica": "mchip-blue",
    "Análise de Indicadores": "mchip-cyan",
    "Decisão Estratégica": "mchip-purple",
    "Alocação de Recursos": "mchip-gold",
  };
  return chip(type, classes[type] || "mchip-blue");
}

function leadershipPositionHtml() {
  const item = leadershipGet("posicionamento");
  const readonly = canEditModule("lideranca") ? "" : " readonly";
  return `
    <section class="doc-card">
      <div class="dcc-hd plain-head">
        <div><div class="dcc-title">Posicionamento Estratégico</div><div class="dcc-sub">Missão, visão e valores da organização · 5.1</div></div>
        ${canEditModule("lideranca") ? `<button class="btn-grad" data-lc-action="save-position" type="button">${moduleIcon("check-circle")}Salvar alterações</button>` : ""}
      </div>
      <div class="field"><label>Missão</label><textarea class="input-basic" id="lcPosMissao"${readonly}>${escapeHtml(item.missao)}</textarea></div>
      <div class="field"><label>Visão</label><textarea class="input-basic" id="lcPosVisao"${readonly}>${escapeHtml(item.visao)}</textarea></div>
      <div class="field"><label>Valores, um por linha</label><textarea class="input-basic" id="lcPosValores"${readonly}>${escapeHtml((item.valores || []).join("\n"))}</textarea></div>
      <div class="valores-chips">${(item.valores || []).map((value) => chip(value, "mchip-gold")).join("")}</div>
    </section>`;
}

function leadershipPlanHtml() {
  const rows = leadershipGet("plano");
  const body = rows.length ? rows.map((item) => `
    <tr>
      <td class="desc-cell strong-cell">${escapeHtml(item.oQue)}</td><td class="mono">${formatDate(item.quando)}</td><td>${personCell(item.quem)}</td>
      <td class="mono strong-cell">${formatMoney(item.quanto)}</td><td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td>
      <td>${leadershipActions("plano", item.id, true)}</td>
    </tr>`).join("") : `<tr><td colspan="6"><div class="empty-state">Nenhum item cadastrado.</div></td></tr>`;
  return leadershipCard("Plano Estratégico (5W2H)", "O quê, por quê, onde, quando, quem, como, quanto e status · 5.1", "Novo item", "new-plano", `
    <table class="ctxtbl"><colgroup><col style="width:34%"><col style="width:12%"><col style="width:18%"><col style="width:13%"><col style="width:13%"><col style="width:10%"></colgroup>
    <thead><tr><th>O quê</th><th>Quando</th><th>Quem</th><th>Quanto</th><th>Status</th><th>Ações</th></tr></thead><tbody>${body}</tbody></table>`);
}

function leadershipPolicyHtml() {
  const item = leadershipGet("politica");
  return `
    <section class="doc-card">
      <div class="dcc-hd plain-head">
        <div><div class="dcc-title">Política da Qualidade</div><div class="dcc-sub">Compromisso da Alta Direção com o SGQ · 5.2</div></div>
        ${canEditModule("lideranca") ? `<button class="btn-grad" data-lc-action="edit-politica" type="button">${moduleIcon("edit")}Editar</button>` : ""}
      </div>
      <div class="doc-meta-row">
        <div class="doc-pill approved">Status: <strong>${escapeHtml(item.status)}</strong></div>
        <div class="doc-pill">Revisão <strong>${escapeHtml(item.revisao)}</strong></div>
        <div class="doc-pill">Aprovada em <strong>${formatDate(item.dataAprovacao)}</strong></div>
        <div class="doc-pill">Próxima revisão <strong>${formatDate(item.proximaRevisao)}</strong></div>
      </div>
      <div class="doc-text-box">${escapeHtml(item.texto)}</div>
      <div class="detail-item"><div class="l">Aprovador</div><div class="v">${escapeHtml(item.aprovador)} · ${escapeHtml(item.aprovadorCargo)}</div></div>
      <div class="detail-block"><h5>Histórico de revisões</h5>${(item.historico || []).map((row) => `<p><strong>Rev. ${escapeHtml(row.revisao)}</strong> - ${formatDate(row.data)} · ${escapeHtml(row.descricao)}</p>`).join("")}</div>
    </section>`;
}

function leadershipCommunicationHtml() {
  const rows = leadershipGet("comunicacao").sort((a, b) => new Date(b.data) - new Date(a.data));
  const body = rows.length ? rows.map((item) => `
    <tr><td class="mono">${formatDate(item.data)}</td><td>${chip(item.forma, "mchip-blue")}</td><td class="desc-cell">${escapeHtml(item.setor)}</td><td class="mono strong-cell">${escapeHtml(item.qtdPessoas)}</td><td>${escapeHtml(item.evidencia || "-")}</td><td>${leadershipActions("comunicacao", item.id)}</td></tr>
  `).join("") : `<tr><td colspan="6"><div class="empty-state">Nenhum registro de comunicação.</div></td></tr>`;
  return leadershipCard("Comunicação da Política", "Registro de como a política foi comunicada · 5.2", "Novo registro", "new-comunicacao", `
    <table class="ctxtbl"><thead><tr><th>Data</th><th>Forma</th><th>Setor</th><th>Qtd. pessoas</th><th>Evidência</th><th>Ações</th></tr></thead><tbody>${body}</tbody></table>`);
}

function leadershipRolesHtml() {
  const rows = leadershipGet("cargos");
  const body = rows.length ? rows.map((item) => `
    <tr><td>${personCell(item.nome, item.cargo)}</td><td>${chip(item.departamento, "mchip-purple")}</td><td class="desc-cell">${escapeHtml(item.descricao)}</td><td>${escapeHtml(item.substituto || "-")}</td><td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td><td>${leadershipActions("cargo", item.id, true)}</td></tr>
  `).join("") : `<tr><td colspan="6"><div class="empty-state">Nenhum cargo cadastrado.</div></td></tr>`;
  return leadershipCard("Cargos e Funções", "Papéis, responsabilidades e autoridades · 5.3", "Novo cargo", "new-cargo", `
    <table class="ctxtbl"><colgroup><col style="width:18%"><col style="width:13%"><col style="width:31%"><col style="width:14%"><col style="width:12%"><col style="width:12%"></colgroup><thead><tr><th>Nome/Cargo</th><th>Departamento</th><th>Descrição</th><th>Substituto</th><th>Status</th><th>Ações</th></tr></thead><tbody>${body}</tbody></table>`);
}

function leadershipRaciHtml() {
  const rows = leadershipGet("raci");
  const body = rows.length ? rows.map((item) => `
    <tr><td class="desc-cell strong-cell">${escapeHtml(item.atividade)}</td><td>${raciChip(item.diretorGeral)}</td><td>${raciChip(item.qualidade)}</td><td>${raciChip(item.comercial)}</td><td>${raciChip(item.financeiro)}</td><td>${leadershipActions("raci", item.id)}</td></tr>
  `).join("") : `<tr><td colspan="6"><div class="empty-state">Nenhuma atividade cadastrada.</div></td></tr>`;
  return leadershipCard("Matriz RACI", "Responsável, Aprovador, Consultado e Informado · 5.3", "Nova atividade", "new-raci", `
    <table class="ctxtbl"><thead><tr><th>Atividade</th><th>Diretor Geral</th><th>Qualidade</th><th>Comercial</th><th>Financeiro</th><th>Ações</th></tr></thead><tbody>${body}</tbody></table>`);
}

function leadershipDelegationsHtml() {
  const rows = leadershipGet("delegacoes");
  const body = rows.length ? rows.map((item) => `
    <tr><td>${personCell(item.titular, item.cargo)}</td><td>${personCell(item.substituto)}</td><td class="mono">${formatDate(item.periodoIni)} - ${formatDate(item.periodoFim)}</td><td class="desc-cell">${escapeHtml(item.motivo)}</td><td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td><td>${leadershipActions("delegacao", item.id)}</td></tr>
  `).join("") : `<tr><td colspan="6"><div class="empty-state">Nenhuma delegação cadastrada.</div></td></tr>`;
  return leadershipCard("Delegação de Autoridade", "Substituições temporárias e autoridades delegadas · 5.3", "Nova delegação", "new-delegacao", `
    <table class="ctxtbl"><thead><tr><th>Titular</th><th>Substituto</th><th>Período</th><th>Motivo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${body}</tbody></table>`);
}

function leadershipApprovalsHtml() {
  const rows = leadershipGet("aprovacoes");
  const body = rows.length ? rows.map((item) => `
    <tr><td class="strong-cell">${escapeHtml(item.tipo)}</td><td>${personCell(item.aprovador)}</td><td>${escapeHtml(item.substituto || "-")}</td><td class="mono">${escapeHtml(item.revisao)}</td><td>${leadershipActions("aprovacao", item.id)}</td></tr>
  `).join("") : `<tr><td colspan="5"><div class="empty-state">Nenhuma aprovação cadastrada.</div></td></tr>`;
  return leadershipCard("Aprovações", "Responsáveis pela aprovação de cada tipo de documento · 5.3", "Nova aprovação", "new-aprovacao", `
    <table class="ctxtbl"><thead><tr><th>Tipo</th><th>Aprovador</th><th>Substituto</th><th>Revisão</th><th>Ações</th></tr></thead><tbody>${body}</tbody></table>`);
}

function leadershipCommitmentsHtml() {
  const rows = leadershipGet("compromissos");
  const body = rows.length ? rows.map((item) => `
    <tr><td class="strong-cell">${escapeHtml(item.compromisso)}</td><td>${personCell(item.responsavel)}</td><td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td><td>${leadershipActions("compromisso", item.id)}</td></tr>
  `).join("") : `<tr><td colspan="4"><div class="empty-state">Nenhum compromisso cadastrado.</div></td></tr>`;
  return leadershipCard("Compromissos da Direção", "Evidências do papel ativo da Alta Direção no SGQ · 5.3", "Novo compromisso", "new-compromisso", `
    <table class="ctxtbl"><thead><tr><th>Compromisso</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead><tbody>${body}</tbody></table>`);
}

function leadershipIndicatorsHtml() {
  const data = leadershipGetAll();
  const completeActions = data.acoes.filter((item) => item.status === "Concluída").length;
  const completePlan = data.plano.filter((item) => item.status === "Concluído").length;
  const totalInvestment = data.plano.reduce((sum, item) => sum + (Number(item.quanto) || 0), 0);
  return `
    <section class="dcc indicator-panel">
      <div class="dcc-title">Indicadores de Liderança e Comprometimento</div>
      <div class="dcc-sub">Resumo calculado a partir das ações da direção e plano estratégico</div>
      <div class="context-kpi-row">
        ${leadershipKpi("Ações concluídas", `${percent(completeActions, data.acoes.length)}%`, `${completeActions} de ${data.acoes.length} ações`, "#F2B705", "check-circle")}
        ${leadershipKpi("Plano concluído", `${percent(completePlan, data.plano.length)}%`, `${completePlan} de ${data.plano.length} itens`, "#4fa3ff", "plano")}
        ${leadershipKpi("Investimento planejado", formatMoney(totalInvestment), "soma do campo Quanto", "#34D399", "documentos")}
      </div>
    </section>`;
}

function leadershipRoleIndicatorsHtml() {
  const data = leadershipGetAll();
  const activeRoles = data.cargos.filter((item) => item.status === "Ativo").length;
  const activeDelegations = data.delegacoes.filter((item) => item.status === "Ativa" || item.status === "Agendada").length;
  const departments = new Set(data.cargos.map((item) => item.departamento).filter(Boolean));
  return `
    <section class="dcc indicator-panel">
      <div class="dcc-title">Indicadores de Papéis e Responsabilidades</div>
      <div class="dcc-sub">Resumo calculado a partir de cargos, delegações e aprovações</div>
      <div class="context-kpi-row">
        ${leadershipKpi("Cargos ativos", activeRoles, `${data.cargos.length} cargos mapeados`, "#34D399", "contexto")}
        ${leadershipKpi("Departamentos", departments.size, "com responsáveis definidos", "#A78BFA", "modulos")}
        ${leadershipKpi("Delegações ativas/agendadas", activeDelegations, `${data.delegacoes.length} delegações cadastradas`, "#F2B705", "calendar")}
        ${leadershipKpi("Aprovações", data.aprovacoes.length, "tipos documentais definidos", "#46D9F5", "check-circle")}
      </div>
    </section>`;
}

function leadershipActions(type, id, canView = false) {
  if (!canEditModule("lideranca")) {
    return canView
      ? `<div class="row-actions"><button class="abtn" data-lc-action="view-${type}" data-id="${id}" type="button" title="Ver detalhes">${moduleIcon("eye")}</button></div>`
      : "-";
  }

  return `
    <div class="row-actions">
      ${canView ? `<button class="abtn" data-lc-action="view-${type}" data-id="${id}" type="button" title="Ver detalhes">${moduleIcon("eye")}</button>` : ""}
      <button class="abtn" data-lc-action="edit-${type}" data-id="${id}" type="button" title="Editar">${moduleIcon("edit")}</button>
      <button class="abtn danger" data-lc-action="delete-${type}" data-id="${id}" type="button" title="Excluir">${moduleIcon("trash")}</button>
    </div>`;
}

function raciChip(value) {
  const classes = { R: "mchip-blue", A: "mchip-gold", C: "mchip-cyan", I: "mchip-gray" };
  return chip(value, classes[value] || "mchip-gray");
}

function percent(value, total) {
  return total ? Math.round((Number(value) / Number(total)) * 100) : 0;
}

function handleLeadershipAction(action, id) {
  if (action === "close-modal") {
    closeLeadershipModal();
    return;
  }
  if (!canEditModule("lideranca") && !action.startsWith("view-") && action !== "switch-tab") {
    toast("Você tem acesso somente para visualizar.");
    return;
  }
  if (action === "save-record") {
    saveLeadershipRecord();
    return;
  }
  if (action === "switch-tab") {
    currentLeadershipSubTab = id;
    renderLeadershipTabs();
    return;
  }
  if (action === "save-position") {
    leadershipSet("posicionamento", {
      missao: inputValue("lcPosMissao"),
      visao: inputValue("lcPosVisao"),
      valores: linesToArray(inputValue("lcPosValores")),
      dataAtualizacao: new Date().toISOString().slice(0, 10),
      aprovadoPor: currentUser?.name || "Hugo Melo",
    });
    refreshLeadershipScreen("Posicionamento salvo.");
    return;
  }
  if (action.startsWith("new-")) openLeadershipForm(action.replace("new-", ""));
  if (action.startsWith("edit-")) openLeadershipForm(action.replace("edit-", ""), id);
  if (action.startsWith("delete-")) deleteLeadershipRecord(action.replace("delete-", ""), id);
  if (action.startsWith("view-")) viewLeadershipRecord(action.replace("view-", ""), id);
}

const leadershipCollections = {
  acao: { key: "acoes", prefix: "AD", fields: [["data", "Data", "date"], ["tipo", "Tipo", "select", ["Reunião Estratégica", "Análise de Indicadores", "Decisão Estratégica", "Alocação de Recursos"]], ["descricao", "Descrição", "textarea"], ["participantes", "Participantes", "textarea"], ["evidencia", "Evidência"], ["responsavel", "Responsável", "people"], ["status", "Status", "select", ["Programada", "Concluída", "Não Realizada"]]] },
  plano: { key: "plano", prefix: "P5W2H", fields: [["oQue", "O quê", "textarea"], ["porQue", "Por quê", "textarea"], ["onde", "Onde"], ["quando", "Quando", "date"], ["quem", "Quem", "people"], ["como", "Como", "textarea"], ["quanto", "Quanto", "number"], ["status", "Status", "select", ["Não Iniciado", "Em Andamento", "Atrasado", "Concluído"]]] },
  comunicacao: { key: "comunicacao", prefix: "COMPOL", fields: [["data", "Data", "date"], ["forma", "Forma", "select", ["Reunião de Equipe", "E-mail", "Treinamento", "Integração", "Mural/Comunicado Interno"]], ["setor", "Setor"], ["qtdPessoas", "Qtd. pessoas", "number"], ["evidencia", "Evidência"]] },
  cargo: { key: "cargos", prefix: "CARGO", fields: [["nome", "Nome"], ["cargo", "Cargo"], ["departamento", "Departamento"], ["substituto", "Substituto"], ["status", "Status", "select", ["Ativo", "Inativo"]], ["descricao", "Descrição", "textarea"], ["responsabilidades", "Responsabilidades, uma por linha", "lines"], ["autoridades", "Autoridades, uma por linha", "lines"]] },
  raci: { key: "raci", prefix: "RACI", fields: [["atividade", "Atividade"], ["diretorGeral", "Diretor Geral", "select", ["R", "A", "C", "I"]], ["qualidade", "Qualidade", "select", ["R", "A", "C", "I"]], ["comercial", "Comercial", "select", ["R", "A", "C", "I"]], ["financeiro", "Financeiro", "select", ["R", "A", "C", "I"]]] },
  delegacao: { key: "delegacoes", prefix: "DEL", fields: [["titular", "Titular", "people"], ["substituto", "Substituto", "people"], ["cargo", "Cargo"], ["periodoIni", "Início", "date"], ["periodoFim", "Fim", "date"], ["motivo", "Motivo"], ["status", "Status", "select", ["Agendada", "Ativa", "Encerrada"]]] },
  aprovacao: { key: "aprovacoes", prefix: "APR", fields: [["tipo", "Tipo"], ["aprovador", "Aprovador", "people"], ["substituto", "Substituto", "people"], ["revisao", "Revisão"]] },
  compromisso: { key: "compromissos", prefix: "COMP", fields: [["compromisso", "Compromisso"], ["responsavel", "Responsável", "people"], ["status", "Status", "select", ["Concluído", "Em Andamento", "Pendente"]]] },
  politica: { key: "politica", singleton: true, fields: [["texto", "Texto da política", "textarea"], ["revisao", "Revisão"], ["status", "Status", "select", ["Vigente", "Em revisão"]], ["dataAprovacao", "Data de aprovação", "date"], ["proximaRevisao", "Próxima revisão", "date"], ["aprovador", "Aprovador", "people"], ["aprovadorCargo", "Cargo do aprovador"]] },
};

function openLeadershipForm(type, id = "") {
  const config = leadershipCollections[type];
  if (!config) return;
  const rows = config.singleton ? [] : leadershipGet(config.key);
  const item = config.singleton ? leadershipGet(config.key) : rows.find((row) => row.id === id);
  const title = `${id || config.singleton ? "Editar" : "Novo"} ${leadershipTypeLabel(type)}`;
  document.querySelector("#leadershipModalMount").innerHTML = `
    <div class="modal-overlay show" id="leadershipRecordModal">
      <div class="modal-box wide">
        <div class="modal-hd">
          <div><h3>${escapeHtml(title)}</h3><p>Liderança e Comprometimento · cláusula 5</p></div>
          <button class="modal-close" data-lc-action="close-modal" type="button">${moduleIcon("close")}</button>
        </div>
        <input type="hidden" id="lcRecordType" value="${type}">
        <input type="hidden" id="lcRecordId" value="${escapeHtml(id)}">
        <div class="field-row2">${config.fields.map(([key, label, fieldType, options]) => leadershipFieldHtml(key, label, fieldType, options, item?.[key])).join("")}</div>
        <div class="modal-actions">
          <button class="btn-ghost" data-lc-action="close-modal" type="button">Cancelar</button>
          <button class="btn-primary" data-lc-action="save-record" type="button">Salvar</button>
        </div>
      </div>
    </div>`;
  document.querySelector("#leadershipRecordModal")?.addEventListener("click", (event) => {
    if (event.target.id === "leadershipRecordModal") closeLeadershipModal();
  });
}

function leadershipFieldHtml(key, label, fieldType = "text", options = [], value = "") {
  const displayValue = Array.isArray(value) ? value.join("\n") : value || "";
  if (fieldType === "textarea" || fieldType === "lines") {
    return `<div class="field full"><label>${escapeHtml(label)}</label><textarea class="input-basic" data-lc-field="${key}" data-lc-field-type="${fieldType}">${escapeHtml(displayValue)}</textarea></div>`;
  }
  if (fieldType === "select" || fieldType === "people") {
    const choices = fieldType === "people" ? ["Hugo Melo", "Marina Souza", "Carlos Andrade", "Beatriz Santos", "Rafael Costa", "João Pereira", "Eduardo Lima"] : options;
    return `<div class="field"><label>${escapeHtml(label)}</label><select class="input-basic" data-lc-field="${key}">${choices.map((option) => `<option ${option === displayValue ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div>`;
  }
  return `<div class="field"><label>${escapeHtml(label)}</label><input class="input-basic" data-lc-field="${key}" type="${fieldType}" value="${escapeHtml(displayValue)}"></div>`;
}

function saveLeadershipRecord() {
  const type = inputValue("lcRecordType");
  const id = inputValue("lcRecordId");
  const config = leadershipCollections[type];
  if (!config) return;
  const record = {};
  document.querySelectorAll("[data-lc-field]").forEach((field) => {
    const key = field.dataset.lcField;
    const value = field.dataset.lcFieldType === "lines" ? linesToArray(field.value) : field.value;
    record[key] = field.type === "number" ? Number(value) || 0 : value;
  });
  if (config.singleton) {
    const previous = leadershipGet(config.key);
    leadershipSet(config.key, { ...previous, ...record });
  } else {
    const rows = leadershipGet(config.key);
    const nextRecord = { ...record, id: id || nextId(config.prefix, rows) };
    const index = rows.findIndex((item) => item.id === id);
    if (index >= 0) rows[index] = nextRecord;
    else rows.push(nextRecord);
    leadershipSet(config.key, rows);
  }
  closeLeadershipModal();
  refreshLeadershipScreen(`${leadershipTypeLabel(type)} salvo.`);
}

function deleteLeadershipRecord(type, id) {
  const config = leadershipCollections[type];
  if (!config || config.singleton) return;
  if (!window.confirm("Excluir este registro?")) return;
  leadershipSet(config.key, leadershipGet(config.key).filter((item) => item.id !== id));
  refreshLeadershipScreen("Registro excluído.");
}

function viewLeadershipRecord(type, id) {
  const config = leadershipCollections[type];
  const item = leadershipGet(config.key).find((row) => row.id === id);
  if (!item) return;
  document.querySelector("#leadershipModalMount").innerHTML = `
    <div class="modal-overlay show" id="leadershipRecordModal">
      <div class="modal-box wide">
        <div class="modal-hd">
          <div><h3>${escapeHtml(leadershipTypeLabel(type))}</h3><p>Detalhes do registro</p></div>
          <button class="modal-close" data-lc-action="close-modal" type="button">${moduleIcon("close")}</button>
        </div>
        <div class="detail-block">${Object.entries(item).map(([key, value]) => `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(Array.isArray(value) ? value.join(", ") : value)}</p>`).join("")}</div>
        <div class="modal-actions"><button class="btn-ghost" data-lc-action="close-modal" type="button">Fechar</button></div>
      </div>
    </div>`;
}

function closeLeadershipModal() {
  const mount = document.querySelector("#leadershipModalMount");
  if (mount) mount.innerHTML = "";
}

function leadershipTypeLabel(type) {
  const labels = {
    acao: "ação",
    plano: "item do plano",
    politica: "política",
    comunicacao: "comunicação",
    cargo: "cargo",
    raci: "atividade RACI",
    delegacao: "delegação",
    aprovacao: "aprovação",
    compromisso: "compromisso",
  };
  return labels[type] || "registro";
}

function refreshLeadershipScreen(message) {
  renderLeadershipTabs();
  toast(message);
}

function renderRiskOpportunityModule() {
  ensureRiskData();
  setActiveNav("modulos");
  setTopbar("Riscos e Oportunidades", "Módulo do QualityPro Cloud · ISO 9001:2015, cláusula 6");
  pageContent.classList.remove("context-page-content");
  pageContent.classList.add("risk-page-content");
  pageContent.innerHTML = `
    <div class="breadcrumb">
      <button type="button" data-view-target="modulos">Meus módulos</button>
      <span class="sep">›</span>
      <span class="cur">Riscos e Oportunidades</span>
    </div>

    <div class="page-toolbar risk-toolbar">
      <div>
        <div class="welcome-eyebrow">PLANEJAMENTO</div>
        <h1 class="welcome-title">Riscos e Oportunidades</h1>
        <p class="welcome-sub">Identificação e tratamento de riscos e oportunidades, objetivos da qualidade e planejamento de mudanças.</p>
      </div>
    </div>

    <div class="risk-kpi-row">
      <article class="kpi-card" style="--accent-line:#F87171;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(248,113,113,0.4); color:#F87171;">${moduleIcon("nao-conformidades")}</div>
          <div><div class="kpi-label">Riscos e oportunidades</div><div class="kpi-value big" id="riskKpiTotal">-</div></div>
        </div>
        <div class="kpi-caption" id="riskKpiTotalCaption">carregando...</div>
      </article>
      <article class="kpi-card" style="--accent-line:#fb923c;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(251,146,60,0.4); color:#fb923c;">${moduleIcon("minus")}</div>
          <div><div class="kpi-label">Críticos/Altos</div><div class="kpi-value big" id="riskKpiHigh">-</div></div>
        </div>
        <div class="kpi-caption">nível >= 10 (probabilidade x impacto)</div>
      </article>
      <article class="kpi-card" style="--accent-line:#34D399;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(52,211,153,0.4); color:#34D399;">${moduleIcon("check-circle")}</div>
          <div><div class="kpi-label">Objetivos da qualidade</div><div class="kpi-value big" id="riskKpiGoals">-</div></div>
        </div>
        <div class="kpi-caption" id="riskKpiGoalsCaption">carregando...</div>
      </article>
      <article class="kpi-card" style="--accent-line:#4fa3ff;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(47,143,240,0.4); color:#4fa3ff;">${moduleIcon("edit")}</div>
          <div><div class="kpi-label">Mudanças em execução</div><div class="kpi-value big" id="riskKpiChanges">-</div></div>
        </div>
        <div class="kpi-caption">planejamento de mudanças · 6.3</div>
      </article>
    </div>

    <div class="ctx-tabs" id="riskTabs">
      <button class="ctx-tab active" data-risk-tab="riscos" type="button">Riscos e Oportunidades</button>
      <button class="ctx-tab" data-risk-tab="objetivos" type="button">Objetivos da Qualidade</button>
      <button class="ctx-tab" data-risk-tab="mudancas" type="button">Planejamento de Mudanças</button>
    </div>

    <div id="riskTabContent"></div>
    ${riskModalsHtml()}
  `;
  bindViewTargetButtons();
  bindRiskTabs();
  bindRiskStaticActions();
  renderRiskTab();
  renderRiskKpis();
  bindRiskOverlayClose();
  scrollPageToTop();
}

function ensureRiskData() {
  if (!riskData) riskData = loadLocalRiskData();
  Object.keys(riskStorageKeys).forEach((key) => {
    if (!Array.isArray(riskData[key])) riskData[key] = structuredClone(riskSeeds[key]);
  });
}

function riskGet(key) {
  ensureRiskData();
  return structuredClone(riskData[key] || []);
}

function riskSet(key, value) {
  ensureRiskData();
  riskData[key] = structuredClone(value);
  localStorage.setItem(riskStorageKeys[key], JSON.stringify(value));
  saveRemoteData("risk", riskData);
}

function loadLocalRiskData() {
  const data = structuredClone(riskSeeds);
  Object.entries(riskStorageKeys).forEach(([key, storageKey]) => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (Array.isArray(stored)) data[key] = stored;
    } catch {
      data[key] = structuredClone(riskSeeds[key]);
    }
  });
  return data;
}

function bindRiskTabs() {
  document.querySelectorAll("[data-risk-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      currentRiskTab = tab.dataset.riskTab;
      document.querySelectorAll("[data-risk-tab]").forEach((item) => {
        item.classList.toggle("active", item.dataset.riskTab === currentRiskTab);
      });
      renderRiskTab();
    });
  });
}

function renderRiskTab() {
  const target = document.querySelector("#riskTabContent");
  if (!target) return;
  if (currentRiskTab === "objetivos") target.innerHTML = riskGoalsHtml();
  else if (currentRiskTab === "mudancas") target.innerHTML = riskChangesHtml();
  else target.innerHTML = riskItemsHtml();
  bindRiskActions();
}

function renderRiskKpis() {
  const riscos = riskGet("riscos");
  const objetivos = riskGet("objetivos");
  const mudancas = riskGet("mudancas");
  const high = riscos.filter((item) => Number(item.probabilidade) * Number(item.impacto) >= 10).length;
  const riskCount = riscos.filter((item) => item.tipo === "Risco").length;
  const opportunityCount = riscos.filter((item) => item.tipo === "Oportunidade").length;
  const goalsDone = objetivos.filter((item) => item.status === "Atingido").length;
  const changesRunning = mudancas.filter((item) => item.status === "Em execução").length;

  setText("#riskKpiTotal", riscos.length);
  setText("#riskKpiTotalCaption", `${riskCount} riscos · ${opportunityCount} oportunidades`);
  setText("#riskKpiHigh", high);
  setText("#riskKpiGoals", objetivos.length);
  setText("#riskKpiGoalsCaption", `${goalsDone} atingidos, ${objetivos.length - goalsDone} em andamento`);
  setText("#riskKpiChanges", changesRunning);
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function riskLevel(probability, impact) {
  const value = Number(probability) * Number(impact);
  if (value >= 17) return { value, cls: "risk-nivel-critico", label: "Crítico" };
  if (value >= 10) return { value, cls: "risk-nivel-alto", label: "Alto" };
  if (value >= 5) return { value, cls: "risk-nivel-medio", label: "Médio" };
  return { value, cls: "risk-nivel-baixo", label: "Baixo" };
}

function chip(text, cls) {
  return `<span class="mchip ${cls}">${escapeHtml(text)}</span>`;
}

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("não iniciado") || normalized.includes("nao iniciado")) return "s-late";
  if (normalized.includes("inativo") || normalized.includes("não realizada") || normalized.includes("nao realizada")) return "s-late";
  if (normalized.includes("programada")) return "s-prog";
  if (normalized.includes("conclu") || normalized.includes("atingid") || normalized.includes("tratado") || normalized.includes("ativo")) return "s-done";
  if (normalized.includes("tratamento") || normalized.includes("execu") || normalized.includes("andamento") || normalized.includes("planejamento") || normalized.includes("atrasado")) return "s-prog";
  if (normalized.includes("monitorando") || normalized.includes("explorando")) return "s-info";
  return "s-pend";
}

function initials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = String(isoDate).split("-");
  return day && month && year ? `${day}/${month}/${year}` : isoDate;
}

function formatMoney(value) {
  return `R$ ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

function nextId(prefix, rows, pad = 4) {
  const next = rows.length
    ? Math.max(...rows.map((item) => Number(String(item.id || "").split("-").pop()) || 0)) + 1
    : 1;
  return `${prefix}-${String(next).padStart(pad, "0")}`;
}

function peopleOptions(selected = "Hugo Melo") {
  return ["Hugo Melo", "Marina Souza", "Carlos Andrade", "Beatriz Santos", "Rafael Costa", "João Pereira", "Eduardo Lima"]
    .map((name) => `<option ${name === selected ? "selected" : ""}>${name}</option>`)
    .join("");
}

function riskItemsHtml() {
  let rows = riskGet("riscos");
  if (riskFilter === "riscos") rows = rows.filter((item) => item.tipo === "Risco");
  if (riskFilter === "oportunidades") rows = rows.filter((item) => item.tipo === "Oportunidade");
  rows = [...rows].sort((a, b) => Number(b.probabilidade) * Number(b.impacto) - Number(a.probabilidade) * Number(a.impacto));

  const body = rows.length
    ? rows
        .map((item) => {
          const level = riskLevel(item.probabilidade, item.impacto);
          return `
            <tr>
              <td><span class="risk-pill ${level.cls}">${level.value} · ${level.label}</span></td>
              <td>${chip(item.tipo, item.tipo === "Risco" ? "mchip-red" : "mchip-blue")}</td>
              <td class="strong-cell">${escapeHtml(item.processo)}</td>
              <td class="desc-cell">${escapeHtml(item.texto)}</td>
              <td>${personCell(item.responsavel)}</td>
              <td class="mono">${formatDate(item.prazo)}</td>
              <td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td>
              <td>${rowActions("risk", item.id, true)}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="8"><div class="empty-state">Nenhum item encontrado para este filtro.</div></td></tr>`;

  return `
    <section class="dcc">
      <div class="dcc-hd">
        <div><div class="dcc-title">Riscos e Oportunidades</div><div class="dcc-sub">Nível = probabilidade x impacto · cláusula 6.1</div></div>
        ${canEditModule("riscos") ? `<button class="btn-grad" data-risk-action="new-risk" type="button">${moduleIcon("plus")}Novo item</button>` : ""}
      </div>
      <div class="subfilter-row">
        <button class="subfilter-pill ${riskFilter === "todos" ? "active" : ""}" data-risk-filter="todos" type="button">Todos</button>
        <button class="subfilter-pill ${riskFilter === "riscos" ? "active" : ""}" data-risk-filter="riscos" type="button">Riscos</button>
        <button class="subfilter-pill ${riskFilter === "oportunidades" ? "active" : ""}" data-risk-filter="oportunidades" type="button">Oportunidades</button>
      </div>
      <div class="risk-table-wrap">
        <table class="ctxtbl risk-table">
          <colgroup><col style="width:10%"><col style="width:9%"><col style="width:11%"><col style="width:26%"><col style="width:14%"><col style="width:9%"><col style="width:12%"><col style="width:9%"></colgroup>
          <thead><tr><th>Nível</th><th>Tipo</th><th>Processo</th><th>Descrição</th><th>Responsável</th><th>Prazo</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderContextModule() {
  ensureContextData();
  setActiveNav("modulos");
  setTopbar("Contexto da Organização", "Módulo do QualityPro Cloud · ISO 9001:2015, cláusula 4");
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.add("context-page-content");
  pageContent.innerHTML = `
    <div class="breadcrumb">
      <button type="button" data-view-target="modulos">Meus módulos</button>
      <span class="sep">›</span>
      <span class="cur">Contexto da Organização</span>
    </div>

    <div class="page-toolbar context-toolbar">
      <div>
        <div class="welcome-eyebrow">CONTEXTO DA ORGANIZAÇÃO</div>
        <h1 class="welcome-title">Contexto da Organização</h1>
        <p class="welcome-sub">Compreensão da organização, das partes interessadas, do escopo do SGQ e do mapeamento de processos.</p>
      </div>
      <div class="toolbar-actions" ${canEditModule("riscos") ? "" : "hidden"}>
        <button class="btn-ghost" data-context-action="undo-clear-context" type="button">Desfazer</button>
        <button class="btn-ghost danger-text" data-context-action="clear-context" type="button">Limpar módulo</button>
      </div>
    </div>

    <div class="context-kpi-row">
      <article class="kpi-card" style="--accent-line:#A78BFA;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(167,139,250,0.4); color:#A78BFA;">${moduleIcon("modulos")}</div>
          <div><div class="kpi-label">Itens SWOT</div><div class="kpi-value big" id="ctxKpiSwot">-</div></div>
        </div>
        <div class="kpi-caption" id="ctxKpiSwotCaption">carregando...</div>
      </article>
      <article class="kpi-card" style="--accent-line:#4fa3ff;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(47,143,240,0.4); color:#4fa3ff;">${moduleIcon("contexto")}</div>
          <div><div class="kpi-label">Partes interessadas</div><div class="kpi-value big" id="ctxKpiPartes">-</div></div>
        </div>
        <div class="kpi-caption" id="ctxKpiPartesCaption">mapeadas e monitoradas</div>
      </article>
      <article class="kpi-card" style="--accent-line:#34D399;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(52,211,153,0.4); color:#34D399;">${moduleIcon("check-circle")}</div>
          <div><div class="kpi-label">Escopo do SGQ</div><div class="kpi-value" id="ctxKpiEscopo">-</div></div>
        </div>
        <div class="kpi-caption" id="ctxKpiEscopoCaption">-</div>
      </article>
      <article class="kpi-card" style="--accent-line:#F2B705;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(242,183,5,0.4); color:#F2B705;">${moduleIcon("home")}</div>
          <div><div class="kpi-label">Processos mapeados</div><div class="kpi-value big" id="ctxKpiProcessos">-</div></div>
        </div>
        <div class="kpi-caption" id="ctxKpiProcessosCaption">estratégicos, operacionais e de suporte</div>
      </article>
    </div>

    <div class="ctx-tabs" id="contextTabs">
      <button class="ctx-tab active" data-context-tab="swot" type="button">SWOT</button>
      <button class="ctx-tab" data-context-tab="partes" type="button">Partes Interessadas</button>
      <button class="ctx-tab" data-context-tab="escopo" type="button">Escopo</button>
      <button class="ctx-tab" data-context-tab="processos" type="button">Processos</button>
    </div>

    <div id="contextTabContent"></div>
    ${contextModalsHtml()}
  `;
  bindViewTargetButtons();
  bindContextTabs();
  bindContextStaticActions();
  renderContextTab();
  renderContextKpis();
  bindContextOverlayClose();
  scrollPageToTop();
}

function ensureContextData() {
  if (!contextData) contextData = loadLocalContextData();
  Object.keys(contextStorageKeys).forEach((key) => {
    if (contextData[key] === undefined || contextData[key] === null) {
      contextData[key] = structuredClone(contextSeeds[key]);
    }
  });
}

function contextGet(key) {
  ensureContextData();
  return structuredClone(contextData[key] ?? contextSeeds[key]);
}

function contextSet(key, value) {
  ensureContextData();
  contextData[key] = structuredClone(value);
  localStorage.setItem(contextStorageKeys[key], JSON.stringify(value));
  saveRemoteData("context", contextData);
}

function loadLocalContextData() {
  const data = structuredClone(contextSeeds);
  Object.entries(contextStorageKeys).forEach(([key, storageKey]) => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (stored !== null) data[key] = stored;
    } catch {
      data[key] = structuredClone(contextSeeds[key]);
    }
  });
  return data;
}

function bindContextTabs() {
  document.querySelectorAll("[data-context-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      currentContextTab = tab.dataset.contextTab;
      document.querySelectorAll("[data-context-tab]").forEach((item) => item.classList.toggle("active", item.dataset.contextTab === currentContextTab));
      renderContextTab();
    });
  });
}

function renderContextTab() {
  const target = document.querySelector("#contextTabContent");
  if (!target) return;
  if (currentContextTab === "partes") target.innerHTML = contextPartesHtml();
  else if (currentContextTab === "escopo") target.innerHTML = contextEscopoHtml();
  else if (currentContextTab === "processos") target.innerHTML = contextProcessosHtml();
  else target.innerHTML = contextSwotHtml();
  bindContextActions();
}

function renderContextKpis() {
  const swot = contextGet("swot");
  const partes = contextGet("partes");
  const escopo = contextGet("escopo");
  const processos = contextGet("processos");
  const pendingPlans = swot.filter((item) => item.planoNecessario === "Sim" && item.status !== "Concluído").length;
  const highPriority = swot.filter((item) => item.prioridade === "Alta").length;
  const monitoredPartes = partes.filter((item) => item.monitoramento && item.monitoramento.trim()).length;
  const strategicProcesses = processos.filter((item) => item.categoria === "Estratégico").length;
  const operationalProcesses = processos.filter((item) => item.categoria === "Operacional").length;
  const supportProcesses = processos.filter((item) => item.categoria === "Suporte").length;
  const escopoFilled = hasEscopoData(escopo);
  setText("#ctxKpiSwot", swot.length);
  setText("#ctxKpiSwotCaption", `${pendingPlans} planos abertos · ${highPriority} alta prioridade`);
  setText("#ctxKpiPartes", partes.length);
  setText("#ctxKpiPartesCaption", `${monitoredPartes} com monitoramento definido`);
  setText("#ctxKpiEscopo", escopoFilled ? escopo.statusAprovacao || "-" : "-");
  setText("#ctxKpiEscopoCaption", escopoFilled ? `atualizado em ${formatDate(escopo.dataAtualizacao)}` : "sem escopo cadastrado");
  setText("#ctxKpiProcessos", processos.length);
  setText("#ctxKpiProcessosCaption", `${strategicProcesses} estratégicos · ${operationalProcesses} operacionais · ${supportProcesses} suporte`);
}

function blankContextEscopo() {
  return {
    unidades: "",
    produtos: "",
    servicos: "",
    exclusoes: "",
    justificativas: "",
    dataAtualizacao: "",
    statusAprovacao: "",
    aprovador: "",
    dataAprovacao: "",
  };
}

function hasEscopoData(data) {
  return Boolean(
    data &&
    [
      "unidades",
      "produtos",
      "servicos",
      "exclusoes",
      "justificativas",
      "statusAprovacao",
      "aprovador",
      "dataAprovacao",
    ].some((key) => String(data[key] || "").trim()),
  );
}

function contextSwotHtml() {
  const rows = contextGet("swot");
  const body = rows.length ? rows.map((item) => `
    <tr>
      <td>${quadranteChip(item.quadrante)}</td>
      <td class="desc-cell">${escapeHtml(item.descricao)}</td>
      <td>${priorityChip(item.prioridade)}</td>
      <td class="desc-cell">${escapeHtml(item.planoAcao || "-")}</td>
      <td>${escapeHtml(item.responsavel)}</td>
      <td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td>
      <td>${contextRowActions("swot", item.id, false)}</td>
    </tr>`).join("") : `<tr><td colspan="7"><div class="empty-state">Nenhum item cadastrado.</div></td></tr>`;
  return `
    <section class="dcc">
      <div class="dcc-hd">
        <div><div class="dcc-title">SWOT - Forças, Fraquezas, Oportunidades e Ameaças</div><div class="dcc-sub">Análise estratégica do contexto interno e externo · cláusula 4.1</div></div>
        ${canEditModule("contexto") ? `<button class="btn-grad" data-context-action="new-swot" type="button">${moduleIcon("plus")}Novo item</button>` : ""}
      </div>
      <div class="risk-table-wrap">
        <table class="ctxtbl">
          <colgroup><col style="width:9%"><col style="width:27%"><col style="width:8%"><col style="width:22%"><col style="width:12%"><col style="width:12%"><col style="width:10%"></colgroup>
          <thead><tr><th>Quadrante</th><th>Descrição</th><th>Prioridade</th><th>Plano de ação</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>`;
}

function contextPartesHtml() {
  const rows = contextGet("partes");
  const body = rows.length ? rows.map((item) => `
    <tr>
      <td>${personCell(item.parte)}</td>
      <td class="desc-cell">${escapeHtml(item.necessidade)}</td>
      <td class="desc-cell">${escapeHtml(item.expectativa)}</td>
      <td class="desc-cell">${escapeHtml(item.monitoramento)}</td>
      <td>${chip(item.frequencia, "mchip-cyan")}</td>
      <td>${contextRowActions("parte", item.id, false)}</td>
    </tr>`).join("") : `<tr><td colspan="6"><div class="empty-state">Nenhuma parte interessada cadastrada.</div></td></tr>`;
  return `
    <section class="dcc">
      <div class="dcc-hd">
        <div><div class="dcc-title">Partes Interessadas</div><div class="dcc-sub">Necessidades, expectativas e forma de monitoramento · cláusula 4.2</div></div>
        ${canEditModule("contexto") ? `<button class="btn-grad" data-context-action="new-parte" type="button">${moduleIcon("plus")}Nova parte interessada</button>` : ""}
      </div>
      <div class="risk-table-wrap">
        <table class="ctxtbl">
          <colgroup><col style="width:15%"><col style="width:23%"><col style="width:23%"><col style="width:20%"><col style="width:9%"><col style="width:10%"></colgroup>
          <thead><tr><th>Parte interessada</th><th>Necessidade</th><th>Expectativa</th><th>Monitoramento</th><th>Frequência</th><th>Ações</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>`;
}

function contextEscopoHtml() {
  const data = contextGet("escopo");
  const readonly = canEditModule("contexto") ? "" : " readonly";
  const disabled = canEditModule("contexto") ? "" : " disabled";
  const escopoFilled = hasEscopoData(data);
  const statusText = !escopoFilled
    ? "Sem escopo cadastrado"
    : data.statusAprovacao === "Aprovado"
    ? `Aprovado pela Alta Direção - ${formatDate(data.dataAprovacao)}`
    : data.statusAprovacao === "Reprovado" ? `Reprovado pela Alta Direção - ${formatDate(data.dataAprovacao)}` : "Pendente de aprovação";
  const fields = [
    ["unidades", "Unidades"],
    ["produtos", "Produtos"],
    ["servicos", "Serviços"],
    ["exclusoes", "Exclusões"],
    ["justificativas", "Justificativas"],
  ];
  return `
    <section class="dcc context-scope-card">
      <div class="context-scope-head">
        <div><div class="dcc-title">Escopo do Sistema de Gestão da Qualidade</div><div class="dcc-sub">Abrangência do SGQ · cláusula 4.3</div></div>
        <div class="escopo-topbar">
          <div class="escopo-pill">Última atualização: <strong>${data.dataAtualizacao ? formatDate(data.dataAtualizacao) : "-"}</strong></div>
          <div class="escopo-pill ${data.statusAprovacao === "Aprovado" ? "approved" : ""}">${escapeHtml(statusText)}</div>
        </div>
      </div>
      <div class="escopo-grid">
        ${fields.map(([key, label]) => `
          <div class="escopo-card ${key === "servicos" || key === "justificativas" ? "full" : ""}">
            <h4>${escapeHtml(label)}</h4>
            <textarea id="ctxEscopo-${key}"${readonly}>${escapeHtml(data[key] || "")}</textarea>
          </div>`).join("")}
        <div class="escopo-card full">
          <h4>Aprovação pela Alta Direção</h4>
          <div class="field-row3">
            <div class="field"><label>Status de aprovação</label><select class="input-basic" id="ctxEscopo-statusAprovacao"${disabled}>${["Pendente", "Aprovado", "Reprovado"].map((status) => `<option value="${status}" ${data.statusAprovacao === status ? "selected" : ""}>${status}</option>`).join("")}</select></div>
            <div class="field"><label>Aprovador</label><input class="input-basic" id="ctxEscopo-aprovador" type="text" value="${escapeHtml(data.aprovador || "")}"${readonly}></div>
            <div class="field"><label>Data de aprovação</label><input class="input-basic" id="ctxEscopo-dataAprovacao" type="date" value="${escapeHtml(data.dataAprovacao || "")}"${readonly}></div>
          </div>
        </div>
      </div>
      <div class="escopo-save-row" ${canEditModule("contexto") ? "" : "hidden"}>
        <div class="escopo-saved-msg" id="ctxEscopoSavedMsg">Alterações salvas</div>
        <button class="btn-ghost danger-text" data-context-action="clear-escopo" type="button">Limpar escopo</button>
        <button class="btn-primary" data-context-action="save-escopo" type="button">Salvar alterações</button>
      </div>
    </section>`;
}

function contextProcessosHtml() {
  const rows = contextGet("processos");
  const body = rows.length ? rows.map((item) => `
    <tr>
      <td class="mono muted-cell">${escapeHtml(item.codigo)}</td>
      <td class="strong-cell">${escapeHtml(item.nome)}</td>
      <td>${chip(item.categoria, contextCategoryClass(item.categoria))}</td>
      <td>${personCell(item.responsavel, item.cargo)}</td>
      <td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td>
      <td>${contextRowActions("processo", item.id, true)}</td>
    </tr>`).join("") : `<tr><td colspan="6"><div class="empty-state">Nenhum processo mapeado.</div></td></tr>`;
  return `
    <section class="dcc">
      <div class="proc-summary">
        ${contextProcessBadge(rows, "Estratégico", "Processos estratégicos", "Planejar e direcionar")}
        ${contextProcessBadge(rows, "Operacional", "Processos operacionais", "Gerar valor para o cliente")}
        ${contextProcessBadge(rows, "Suporte", "Processos de suporte", "Apoiar e sustentar")}
      </div>
      <div class="dcc-hd">
        <div><div class="dcc-title">Mapa de Processos</div><div class="dcc-sub">Processos estratégicos, operacionais e de suporte · cláusula 4.4</div></div>
        ${canEditModule("contexto") ? `<button class="btn-grad" data-context-action="new-processo" type="button">${moduleIcon("plus")}Novo processo</button>` : ""}
      </div>
      <div class="risk-table-wrap">
        <table class="ctxtbl">
          <colgroup><col style="width:8%"><col style="width:23%"><col style="width:13%"><col style="width:24%"><col style="width:12%"><col style="width:20%"></colgroup>
          <thead><tr><th>Código</th><th>Processo</th><th>Categoria</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>`;
}

function quadranteChip(quadrante) {
  const classes = { Força: "mchip-green", Fraqueza: "mchip-red", Oportunidade: "mchip-blue", Ameaça: "mchip-amber" };
  return chip(quadrante, classes[quadrante] || "mchip-blue");
}

function contextCategoryClass(category) {
  if (category === "Estratégico") return "mchip-purple";
  if (category === "Operacional") return "mchip-blue";
  return "mchip-green";
}

function contextProcessBadge(rows, category, label, description) {
  const count = rows.filter((item) => item.categoria === category).length;
  return `
    <div class="proc-cat-badge ${category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}">
      <div class="n">${count}</div>
      <div class="l">${escapeHtml(label)}</div>
      <div class="d">${escapeHtml(description)}</div>
    </div>`;
}

function contextRowActions(type, id, canView) {
  if (!canEditModule("contexto")) {
    return canView
      ? `<div class="row-actions"><button class="abtn" data-context-action="view-${type}" data-id="${id}" type="button" title="Ver detalhes">${moduleIcon("eye")}</button></div>`
      : "-";
  }

  return `
    <div class="row-actions">
      ${canView ? `<button class="abtn" data-context-action="view-${type}" data-id="${id}" type="button" title="Ver detalhes">${moduleIcon("eye")}</button>` : ""}
      <button class="abtn" data-context-action="edit-${type}" data-id="${id}" type="button" title="Editar">${moduleIcon("edit")}</button>
      <button class="abtn danger" data-context-action="delete-${type}" data-id="${id}" type="button" title="Excluir">${moduleIcon("trash")}</button>
    </div>`;
}

function contextModalsHtml() {
  return `
    <div class="modal-overlay" id="contextSwotModal">
      <div class="modal-box">
        <div class="modal-hd">
          <div><h3 id="contextSwotTitle">Novo item SWOT</h3><p>Análise de Forças, Fraquezas, Oportunidades e Ameaças</p></div>
          <button class="modal-close" data-context-close="contextSwotModal" type="button">${moduleIcon("close")}</button>
        </div>
        <input type="hidden" id="contextSwotId">
        <div class="field-row2">
          <div class="field"><label>Quadrante</label><select class="input-basic" id="contextSwotQuadrante"><option>Força</option><option>Fraqueza</option><option>Oportunidade</option><option>Ameaça</option></select></div>
          <div class="field"><label>Prioridade</label><select class="input-basic" id="contextSwotPrioridade"><option>Alta</option><option>Média</option><option>Baixa</option></select></div>
        </div>
        <div class="field"><label>Descrição</label><textarea class="input-basic" id="contextSwotDescricao"></textarea></div>
        <div class="field-row2">
          <div class="field"><label>Precisa de plano de ação?</label><select class="input-basic" id="contextSwotPlanoNecessario"><option>Não</option><option>Sim</option></select></div>
          <div class="field"><label>Responsável</label><select class="input-basic" id="contextSwotResponsavel">${peopleOptions()}</select></div>
        </div>
        <div class="field"><label>Plano de ação</label><textarea class="input-basic" id="contextSwotPlanoAcao"></textarea></div>
        <div class="field"><label>Status do plano</label><select class="input-basic" id="contextSwotStatus"><option>Não iniciado</option><option>Em andamento</option><option>Concluído</option></select></div>
        <div class="modal-actions">
          <button class="btn-ghost" data-context-close="contextSwotModal" type="button">Cancelar</button>
          <button class="btn-primary" data-context-action="save-swot" type="button">Salvar</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="contextParteModal">
      <div class="modal-box">
        <div class="modal-hd">
          <div><h3 id="contextParteTitle">Nova parte interessada</h3><p>Necessidades, expectativas e monitoramento</p></div>
          <button class="modal-close" data-context-close="contextParteModal" type="button">${moduleIcon("close")}</button>
        </div>
        <input type="hidden" id="contextParteId">
        <div class="field"><label>Parte interessada</label><input class="input-basic" id="contextParteNome"></div>
        <div class="field"><label>Necessidade</label><textarea class="input-basic" id="contextParteNecessidade"></textarea></div>
        <div class="field"><label>Expectativa</label><textarea class="input-basic" id="contextParteExpectativa"></textarea></div>
        <div class="field"><label>Forma de monitoramento</label><input class="input-basic" id="contextParteMonitoramento"></div>
        <div class="field"><label>Frequência de monitoramento</label><select class="input-basic" id="contextParteFrequencia"><option>Mensal</option><option>Trimestral</option><option>Semestral</option><option>Anual</option></select></div>
        <div class="modal-actions">
          <button class="btn-ghost" data-context-close="contextParteModal" type="button">Cancelar</button>
          <button class="btn-primary" data-context-action="save-parte" type="button">Salvar</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="contextProcessoViewModal">
      <div class="modal-box wide">
        <div class="modal-hd">
          <div><h3 id="contextProcessoViewTitle">Processo</h3><p id="contextProcessoViewSub">Detalhes do processo</p></div>
          <button class="modal-close" data-context-close="contextProcessoViewModal" type="button">${moduleIcon("close")}</button>
        </div>
        <div id="contextProcessoViewBody"></div>
        <div class="modal-actions"><button class="btn-ghost" data-context-close="contextProcessoViewModal" type="button">Fechar</button></div>
      </div>
    </div>

    <div class="modal-overlay" id="contextProcessoModal">
      <div class="modal-box wide">
        <div class="modal-hd">
          <div><h3 id="contextProcessoTitle">Novo processo</h3><p>Mapa de Processos · cláusula 4.4</p></div>
          <button class="modal-close" data-context-close="contextProcessoModal" type="button">${moduleIcon("close")}</button>
        </div>
        <input type="hidden" id="contextProcessoId">
        <div class="field-row2">
          <div class="field"><label>Código</label><input class="input-basic" id="contextProcessoCodigo"></div>
          <div class="field"><label>Categoria</label><select class="input-basic" id="contextProcessoCategoria"><option>Estratégico</option><option>Operacional</option><option>Suporte</option></select></div>
        </div>
        <div class="field"><label>Nome do processo</label><input class="input-basic" id="contextProcessoNome"></div>
        <div class="field-row2">
          <div class="field"><label>Responsável</label><select class="input-basic" id="contextProcessoResponsavel">${peopleOptions()}</select></div>
          <div class="field"><label>Cargo</label><input class="input-basic" id="contextProcessoCargo"></div>
        </div>
        <div class="field"><label>Status</label><select class="input-basic" id="contextProcessoStatus"><option>Ativo</option><option>Inativo</option></select></div>
        <div class="field"><label>Objetivo</label><textarea class="input-basic" id="contextProcessoObjetivo"></textarea></div>
        <div class="field-row2">
          <div class="field"><label>Indicadores</label><textarea class="input-basic" id="contextProcessoIndicadores"></textarea></div>
          <div class="field"><label>Riscos associados</label><textarea class="input-basic" id="contextProcessoRiscos"></textarea></div>
        </div>
        <div class="field-row2">
          <div class="field"><label>Entradas</label><textarea class="input-basic" id="contextProcessoEntradas"></textarea></div>
          <div class="field"><label>Saídas</label><textarea class="input-basic" id="contextProcessoSaidas"></textarea></div>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" data-context-close="contextProcessoModal" type="button">Cancelar</button>
          <button class="btn-primary" data-context-action="save-processo" type="button">Salvar</button>
        </div>
      </div>
    </div>`;
}

function bindContextActions() {
  if (document.body.dataset.contextActionsBound === "true") return;
  document.body.dataset.contextActionsBound = "true";

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-context-action]");
    if (!button) return;
    event.preventDefault();
    handleContextAction(button.dataset.contextAction, button.dataset.id);
  });
}

function bindContextStaticActions() {
  document.querySelectorAll("[data-context-close]").forEach((button) => {
    button.addEventListener("click", () => closeContextModal(button.dataset.contextClose));
  });
}

function bindContextOverlayClose() {
  document.querySelectorAll("#contextSwotModal, #contextParteModal, #contextProcessoViewModal, #contextProcessoModal").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.classList.remove("show");
    });
  });
}

function handleContextAction(action, id) {
  if (!canEditModule("contexto") && !action.startsWith("view-")) {
    toast("Você tem acesso somente para visualizar.");
    return;
  }

  const actions = {
    "new-swot": () => openContextSwot(),
    "edit-swot": () => openContextSwot(id),
    "delete-swot": () => deleteContextSwot(id),
    "save-swot": () => saveContextSwot(),
    "new-parte": () => openContextParte(),
    "edit-parte": () => openContextParte(id),
    "delete-parte": () => deleteContextParte(id),
    "save-parte": () => saveContextParte(),
    "save-escopo": () => saveContextEscopo(),
    "clear-escopo": () => clearContextEscopo(),
    "clear-context": () => clearContextModule(),
    "undo-clear-context": () => undoClearContextModule(),
    "view-processo": () => viewContextProcesso(id),
    "new-processo": () => openContextProcesso(),
    "edit-processo": () => openContextProcesso(id),
    "delete-processo": () => deleteContextProcesso(id),
    "save-processo": () => saveContextProcesso(),
  };
  actions[action]?.();
}

function clearContextModule() {
  if (!window.confirm("Limpar todos os dados do módulo Contexto da Organização?")) return;
  saveContextClearBackup();
  contextSet("swot", []);
  contextSet("partes", []);
  contextSet("escopo", blankContextEscopo());
  contextSet("processos", []);
  refreshContextScreen("Módulo Contexto limpo.");
}

function saveContextClearBackup() {
  const backup = {
    swot: contextGet("swot"),
    partes: contextGet("partes"),
    escopo: contextGet("escopo"),
    processos: contextGet("processos"),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(contextClearBackupKey, JSON.stringify(backup));
}

function undoClearContextModule() {
  const backup = readContextClearBackup();
  if (!backup) {
    toast("Nenhum backup para desfazer.");
    return;
  }

  contextSet("swot", backup.swot || []);
  contextSet("partes", backup.partes || []);
  contextSet("escopo", backup.escopo || blankContextEscopo());
  contextSet("processos", backup.processos || []);
  localStorage.removeItem(contextClearBackupKey);
  refreshContextScreen("Limpeza desfeita.");
}

function readContextClearBackup() {
  try {
    return JSON.parse(localStorage.getItem(contextClearBackupKey) || "null");
  } catch {
    return null;
  }
}

function openContextModal(id) {
  document.querySelector(`#${id}`)?.classList.add("show");
}

function closeContextModal(id) {
  document.querySelector(`#${id}`)?.classList.remove("show");
}

function openContextSwot(id = "") {
  const rows = contextGet("swot");
  const item = rows.find((row) => row.id === id);
  setText("#contextSwotTitle", item ? "Editar item SWOT" : "Novo item SWOT");
  setInputValue("contextSwotId", item?.id || "");
  setInputValue("contextSwotQuadrante", item?.quadrante || "Força");
  setInputValue("contextSwotPrioridade", item?.prioridade || "Média");
  setInputValue("contextSwotDescricao", item?.descricao || "");
  setInputValue("contextSwotPlanoNecessario", item?.planoNecessario || "Não");
  setInputValue("contextSwotResponsavel", item?.responsavel || "Hugo Melo");
  setInputValue("contextSwotPlanoAcao", item?.planoAcao || "");
  setInputValue("contextSwotStatus", item?.status || "Não iniciado");
  openContextModal("contextSwotModal");
}

function saveContextSwot() {
  const rows = contextGet("swot");
  const id = inputValue("contextSwotId");
  const record = {
    id: id || nextId("SWOT", rows),
    quadrante: inputValue("contextSwotQuadrante"),
    prioridade: inputValue("contextSwotPrioridade"),
    descricao: inputValue("contextSwotDescricao"),
    planoNecessario: inputValue("contextSwotPlanoNecessario"),
    responsavel: inputValue("contextSwotResponsavel"),
    planoAcao: inputValue("contextSwotPlanoAcao"),
    status: inputValue("contextSwotStatus"),
  };
  const index = rows.findIndex((item) => item.id === id);
  if (index >= 0) rows[index] = record;
  else rows.push(record);
  contextSet("swot", rows);
  closeContextModal("contextSwotModal");
  refreshContextScreen("Item SWOT salvo.");
}

function deleteContextSwot(id) {
  contextSet("swot", contextGet("swot").filter((item) => item.id !== id));
  refreshContextScreen("Item SWOT excluído.");
}

function openContextParte(id = "") {
  const rows = contextGet("partes");
  const item = rows.find((row) => row.id === id);
  setText("#contextParteTitle", item ? "Editar parte interessada" : "Nova parte interessada");
  setInputValue("contextParteId", item?.id || "");
  setInputValue("contextParteNome", item?.parte || "");
  setInputValue("contextParteNecessidade", item?.necessidade || "");
  setInputValue("contextParteExpectativa", item?.expectativa || "");
  setInputValue("contextParteMonitoramento", item?.monitoramento || "");
  setInputValue("contextParteFrequencia", item?.frequencia || "Trimestral");
  openContextModal("contextParteModal");
}

function saveContextParte() {
  const rows = contextGet("partes");
  const id = inputValue("contextParteId");
  const record = {
    id: id || nextId("PI", rows),
    parte: inputValue("contextParteNome"),
    necessidade: inputValue("contextParteNecessidade"),
    expectativa: inputValue("contextParteExpectativa"),
    monitoramento: inputValue("contextParteMonitoramento"),
    frequencia: inputValue("contextParteFrequencia"),
  };
  const index = rows.findIndex((item) => item.id === id);
  if (index >= 0) rows[index] = record;
  else rows.push(record);
  contextSet("partes", rows);
  closeContextModal("contextParteModal");
  refreshContextScreen("Parte interessada salva.");
}

function deleteContextParte(id) {
  contextSet("partes", contextGet("partes").filter((item) => item.id !== id));
  refreshContextScreen("Parte interessada excluída.");
}

function saveContextEscopo() {
  const escopo = {
    unidades: inputValue("ctxEscopo-unidades"),
    produtos: inputValue("ctxEscopo-produtos"),
    servicos: inputValue("ctxEscopo-servicos"),
    exclusoes: inputValue("ctxEscopo-exclusoes"),
    justificativas: inputValue("ctxEscopo-justificativas"),
    statusAprovacao: inputValue("ctxEscopo-statusAprovacao"),
    aprovador: inputValue("ctxEscopo-aprovador"),
    dataAprovacao: inputValue("ctxEscopo-dataAprovacao"),
    dataAtualizacao: new Date().toISOString().slice(0, 10),
  };
  contextSet("escopo", escopo);
  renderContextTab();
  renderContextKpis();
  const message = document.querySelector("#ctxEscopoSavedMsg");
  if (message) {
    message.classList.add("show");
    window.setTimeout(() => message.classList.remove("show"), 2200);
  }
  toast("Escopo salvo.");
}

function clearContextEscopo() {
  if (!window.confirm("Limpar os dados do escopo?")) return;
  contextSet("escopo", blankContextEscopo());
  renderContextTab();
  renderContextKpis();
  toast("Escopo limpo.");
}

function viewContextProcesso(id) {
  const item = contextGet("processos").find((row) => row.id === id);
  if (!item) return;
  setText("#contextProcessoViewTitle", `${item.codigo} - ${item.nome}`);
  setText("#contextProcessoViewSub", `Processo ${item.categoria.toLowerCase()} · responsável: ${item.responsavel}`);
  const body = document.querySelector("#contextProcessoViewBody");
  if (body) {
    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><div class="l">Categoria</div><div class="v">${chip(item.categoria, contextCategoryClass(item.categoria))}</div></div>
        <div class="detail-item"><div class="l">Responsável</div><div class="v">${escapeHtml(item.responsavel)} · ${escapeHtml(item.cargo)}</div></div>
      </div>
      <div class="detail-block"><h5>Objetivo</h5><p>${escapeHtml(item.objetivo)}</p></div>
      ${contextListBlock("Indicadores", item.indicadores)}
      ${contextListBlock("Riscos associados", item.riscos)}
      <div class="detail-grid">
        ${contextListBlock("Entradas", item.entradas)}
        ${contextListBlock("Saídas", item.saidas)}
      </div>`;
  }
  openContextModal("contextProcessoViewModal");
}

function contextListBlock(title, rows = []) {
  return `<div class="detail-block"><h5>${escapeHtml(title)}</h5><ul>${rows.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
}

function openContextProcesso(id = "") {
  const rows = contextGet("processos");
  const item = rows.find((row) => row.id === id);
  setText("#contextProcessoTitle", item ? "Editar processo" : "Novo processo");
  setInputValue("contextProcessoId", item?.id || "");
  setInputValue("contextProcessoCodigo", item?.codigo || "");
  setInputValue("contextProcessoCategoria", item?.categoria || "Operacional");
  setInputValue("contextProcessoNome", item?.nome || "");
  setInputValue("contextProcessoResponsavel", item?.responsavel || "Hugo Melo");
  setInputValue("contextProcessoCargo", item?.cargo || "");
  setInputValue("contextProcessoStatus", item?.status || "Ativo");
  setInputValue("contextProcessoObjetivo", item?.objetivo || "");
  setInputValue("contextProcessoIndicadores", (item?.indicadores || []).join("\n"));
  setInputValue("contextProcessoRiscos", (item?.riscos || []).join("\n"));
  setInputValue("contextProcessoEntradas", (item?.entradas || []).join("\n"));
  setInputValue("contextProcessoSaidas", (item?.saidas || []).join("\n"));
  openContextModal("contextProcessoModal");
}

function saveContextProcesso() {
  const rows = contextGet("processos");
  const id = inputValue("contextProcessoId");
  const record = {
    id: id || `proc_${Date.now()}`,
    codigo: inputValue("contextProcessoCodigo"),
    categoria: inputValue("contextProcessoCategoria"),
    nome: inputValue("contextProcessoNome"),
    responsavel: inputValue("contextProcessoResponsavel"),
    cargo: inputValue("contextProcessoCargo"),
    status: inputValue("contextProcessoStatus"),
    objetivo: inputValue("contextProcessoObjetivo"),
    indicadores: linesToArray(inputValue("contextProcessoIndicadores")),
    riscos: linesToArray(inputValue("contextProcessoRiscos")),
    entradas: linesToArray(inputValue("contextProcessoEntradas")),
    saidas: linesToArray(inputValue("contextProcessoSaidas")),
  };
  const index = rows.findIndex((item) => item.id === id);
  if (index >= 0) rows[index] = record;
  else rows.push(record);
  contextSet("processos", rows);
  closeContextModal("contextProcessoModal");
  refreshContextScreen("Processo salvo.");
}

function deleteContextProcesso(id) {
  contextSet("processos", contextGet("processos").filter((item) => item.id !== id));
  refreshContextScreen("Processo excluído.");
}

function linesToArray(value) {
  return String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
}

function refreshContextScreen(message) {
  renderContextTab();
  renderContextKpis();
  toast(message);
}

function riskGoalsHtml() {
  const rows = riskGet("objetivos");
  const body = rows.length
    ? rows
        .map((item) => `
          <tr>
            <td class="strong-cell">${escapeHtml(item.objetivo)}</td>
            <td class="desc-cell">${escapeHtml(item.indicador)}</td>
            <td class="mono strong-cell">${escapeHtml(item.meta)}</td>
            <td>${trendHtml(item.tendenciaDirecao, item.resultadoAtual)}</td>
            <td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td>
            <td class="mono">${formatDate(item.prazoRevisao)}</td>
            <td>${personCell(item.responsavel, item.responsavelCargo)}</td>
            <td>${rowActions("goal", item.id, true)}</td>
          </tr>
        `)
        .join("")
    : `<tr><td colspan="8"><div class="empty-state">Nenhum objetivo cadastrado.</div></td></tr>`;

  return `
    <section class="dcc">
      <div class="dcc-hd">
        <div><div class="dcc-title">Objetivos da Qualidade e Planejamento para Alcançá-los</div><div class="dcc-sub">Metas, resultados e planejamento · cláusula 6.2</div></div>
        ${canEditModule("riscos") ? `<button class="btn-grad" data-risk-action="new-goal" type="button">${moduleIcon("plus")}Novo objetivo</button>` : ""}
      </div>
      <div class="risk-table-wrap">
        <table class="ctxtbl">
          <colgroup><col style="width:19%"><col style="width:17%"><col style="width:8%"><col style="width:10%"><col style="width:11%"><col style="width:9%"><col style="width:15%"><col style="width:11%"></colgroup>
          <thead><tr><th>Objetivo</th><th>Indicador</th><th>Meta</th><th>Resultado atual</th><th>Status</th><th>Prazo revisão</th><th>Responsável</th><th>Ações</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `;
}

function riskChangesHtml() {
  const rows = riskGet("mudancas");
  const body = rows.length
    ? rows
        .map((item) => `
          <tr>
            <td class="mono muted-cell">${escapeHtml(item.id)}</td>
            <td class="strong-cell">${escapeHtml(item.mudanca)}</td>
            <td class="desc-cell">${escapeHtml(item.areaImpactada)}</td>
            <td>${priorityChip(item.prioridade)}</td>
            <td><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></td>
            <td class="mono">${formatDate(item.dataPrevista)}</td>
            <td>${personCell(item.responsavel)}</td>
            <td><span class="res-chip">${formatMoney(item.recursos?.valor)}</span></td>
            <td>${rowActions("change", item.id, false)}</td>
          </tr>
        `)
        .join("")
    : `<tr><td colspan="9"><div class="empty-state">Nenhuma mudança registrada.</div></td></tr>`;

  return `
    <section class="dcc">
      <div class="dcc-hd">
        <div><div class="dcc-title">Registro de Mudanças</div><div class="dcc-sub">Planejamento e controle de mudanças no SGQ · cláusula 6.3</div></div>
        ${canEditModule("riscos") ? `<button class="btn-grad" data-risk-action="new-change" type="button">${moduleIcon("plus")}Nova mudança</button>` : ""}
      </div>
      <div class="risk-table-wrap">
        <table class="ctxtbl">
          <colgroup><col style="width:9%"><col style="width:19%"><col style="width:14%"><col style="width:8%"><col style="width:11%"><col style="width:9%"><col style="width:11%"><col style="width:10%"><col style="width:9%"></colgroup>
          <thead><tr><th>ID</th><th>Mudança</th><th>Área impactada</th><th>Prioridade</th><th>Status</th><th>Data prevista</th><th>Responsável</th><th>Recursos</th><th>Ações</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `;
}

function personCell(name, role = "") {
  return `
    <div class="p-cell">
      <div class="p-avatar">${escapeHtml(initials(name))}</div>
      <div><div class="p-name">${escapeHtml(name)}</div>${role ? `<div class="p-role">${escapeHtml(role)}</div>` : ""}</div>
    </div>
  `;
}

function rowActions(type, id, canView) {
  if (!canEditModule("riscos")) {
    return canView
      ? `<div class="row-actions"><button class="abtn" data-risk-action="view-${type}" data-id="${id}" type="button" title="Ver detalhes">${moduleIcon("eye")}</button></div>`
      : "-";
  }

  return `
    <div class="row-actions">
      ${canView ? `<button class="abtn" data-risk-action="view-${type}" data-id="${id}" type="button" title="Ver detalhes">${moduleIcon("eye")}</button>` : ""}
      <button class="abtn" data-risk-action="edit-${type}" data-id="${id}" type="button" title="Editar">${moduleIcon("edit")}</button>
      <button class="abtn danger" data-risk-action="delete-${type}" data-id="${id}" type="button" title="Excluir">${moduleIcon("trash")}</button>
    </div>
  `;
}

function trendHtml(direction, result) {
  const isUp = direction === "up";
  return `<span class="${isUp ? "trend-up" : "trend-down"}">${moduleIcon(isUp ? "trend-up" : "trend-down")}${escapeHtml(result)}</span>`;
}

function priorityChip(priority) {
  const classes = { Alta: "mchip-red", Média: "mchip-amber", Baixa: "mchip-green" };
  return chip(priority, classes[priority] || "mchip-blue");
}

function riskModalsHtml() {
  return `
    <div class="modal-overlay" id="riskItemModal">
      <div class="modal-box wide">
        <div class="modal-hd">
          <div><h3 id="riskItemTitle">Novo item</h3><p>Riscos e Oportunidades · cláusula 6.1</p></div>
          <button class="modal-close" data-risk-close="riskItemModal" type="button">${moduleIcon("close")}</button>
        </div>
        <input type="hidden" id="riskEditId">
        <div class="field-row3">
          <div class="field"><label>Tipo</label><select class="input-basic" id="riskTipo"><option>Risco</option><option>Oportunidade</option></select></div>
          <div class="field"><label>Processo relacionado</label><input class="input-basic" id="riskProcesso" placeholder="Ex.: Produção, Compras..."></div>
          <div class="field"><label>Responsável</label><select class="input-basic" id="riskResponsavel">${peopleOptions()}</select></div>
        </div>
        <div class="field"><label>Descrição</label><textarea class="input-basic" id="riskTexto" placeholder="Descreva o risco ou oportunidade identificado"></textarea></div>
        <div class="field-row3">
          <div class="field"><label>Probabilidade (1-5)</label><select class="input-basic" id="riskProbabilidade">${numberOptions(1, 5, 3)}</select></div>
          <div class="field"><label>Impacto (1-5)</label><select class="input-basic" id="riskImpacto">${numberOptions(1, 5, 3)}</select></div>
          <div class="field"><label>Progresso do plano (%)</label><input class="input-basic" type="number" min="0" max="100" id="riskProgresso" value="0"></div>
        </div>
        <div class="field"><label>Causa</label><textarea class="input-basic" id="riskCausa"></textarea></div>
        <div class="field"><label>Consequência</label><textarea class="input-basic" id="riskConsequencia"></textarea></div>
        <div class="field"><label>Plano de ação</label><textarea class="input-basic" id="riskPlanoAcao"></textarea></div>
        <div class="field-row2">
          <div class="field"><label>Status</label><select class="input-basic" id="riskStatus"><option>Identificado</option><option>Identificada</option><option>Em Tratamento</option><option>Monitorando</option><option>Explorando</option><option>Tratado</option></select></div>
          <div class="field"><label>Prazo</label><input class="input-basic" type="date" id="riskPrazo"></div>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" data-risk-close="riskItemModal" type="button">Cancelar</button>
          <button class="btn-primary" data-risk-action="save-risk" type="button">Salvar</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="riskDetailModal">
      <div class="modal-box">
        <div class="modal-hd">
          <div><h3 id="riskDetailTitle">Item</h3><p id="riskDetailSub">Detalhes</p></div>
          <button class="modal-close" data-risk-close="riskDetailModal" type="button">${moduleIcon("close")}</button>
        </div>
        <div id="riskDetailBody"></div>
        <div class="modal-actions"><button class="btn-ghost" data-risk-close="riskDetailModal" type="button">Fechar</button></div>
      </div>
    </div>

    <div class="modal-overlay" id="goalModal">
      <div class="modal-box wide">
        <div class="modal-hd">
          <div><h3 id="goalTitle">Novo objetivo</h3><p>Objetivos da Qualidade · cláusula 6.2</p></div>
          <button class="modal-close" data-risk-close="goalModal" type="button">${moduleIcon("close")}</button>
        </div>
        <input type="hidden" id="goalEditId">
        <div class="field"><label>Objetivo</label><input class="input-basic" id="goalObjetivo" placeholder="Ex.: Aumentar a satisfação dos clientes"></div>
        <div class="field-row3">
          <div class="field"><label>Indicador</label><input class="input-basic" id="goalIndicador"></div>
          <div class="field"><label>Meta</label><input class="input-basic" id="goalMeta" placeholder="Ex.: >= 95%"></div>
          <div class="field"><label>Resultado atual</label><input class="input-basic" id="goalResultado" placeholder="Ex.: 92,4%"></div>
        </div>
        <div class="field-row3">
          <div class="field"><label>Tendência</label><select class="input-basic" id="goalTendencia"><option value="up">Em melhora</option><option value="down">Em piora</option></select></div>
          <div class="field"><label>Status</label><select class="input-basic" id="goalStatus"><option>Em andamento</option><option>Atingido</option><option>Atrasado</option></select></div>
          <div class="field"><label>Prazo de revisão</label><input class="input-basic" type="date" id="goalPrazo"></div>
        </div>
        <div class="field-row2">
          <div class="field"><label>Responsável</label><select class="input-basic" id="goalResponsavel">${peopleOptions()}</select></div>
          <div class="field"><label>Cargo do responsável</label><input class="input-basic" id="goalCargo"></div>
        </div>
        <div class="modal-section-title">Planejamento para alcançar o objetivo</div>
        <div class="field"><label>O que será feito</label><textarea class="input-basic" id="goalOQue"></textarea></div>
        <div class="field-row2">
          <div class="field"><label>Recursos necessários</label><textarea class="input-basic" id="goalRecursos"></textarea></div>
          <div class="field"><label>Como será avaliado</label><textarea class="input-basic" id="goalComo"></textarea></div>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" data-risk-close="goalModal" type="button">Cancelar</button>
          <button class="btn-primary" data-risk-action="save-goal" type="button">Salvar</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="goalDetailModal">
      <div class="modal-box">
        <div class="modal-hd">
          <div><h3 id="goalDetailTitle">Objetivo</h3><p>Planejamento para alcançar o objetivo · 6.2.2</p></div>
          <button class="modal-close" data-risk-close="goalDetailModal" type="button">${moduleIcon("close")}</button>
        </div>
        <div id="goalDetailBody"></div>
        <div class="modal-actions"><button class="btn-ghost" data-risk-close="goalDetailModal" type="button">Fechar</button></div>
      </div>
    </div>

    <div class="modal-overlay" id="changeModal">
      <div class="modal-box wide">
        <div class="modal-hd">
          <div><h3 id="changeTitle">Nova mudança</h3><p>Planejamento de Mudanças · cláusula 6.3</p></div>
          <button class="modal-close" data-risk-close="changeModal" type="button">${moduleIcon("close")}</button>
        </div>
        <input type="hidden" id="changeEditId">
        <div class="field"><label>Mudança</label><input class="input-basic" id="changeMudanca" placeholder="Ex.: Implantação de novo ERP/CRM comercial"></div>
        <div class="field"><label>Propósito</label><textarea class="input-basic" id="changeProposito"></textarea></div>
        <div class="field-row2">
          <div class="field"><label>Área impactada</label><input class="input-basic" id="changeArea" placeholder="Ex.: TI / Todos os Processos"></div>
          <div class="field"><label>Responsável</label><select class="input-basic" id="changeResponsavel">${peopleOptions()}</select></div>
        </div>
        <div class="field-row3">
          <div class="field"><label>Status</label><select class="input-basic" id="changeStatus"><option>Em planejamento</option><option>Em execução</option><option>Concluída</option></select></div>
          <div class="field"><label>Prioridade</label><select class="input-basic" id="changePrioridade"><option>Alta</option><option>Média</option><option>Baixa</option></select></div>
          <div class="field"><label>Data prevista</label><input class="input-basic" type="date" id="changeData"></div>
        </div>
        <div class="field-row2">
          <div class="field"><label>Recursos necessários</label><textarea class="input-basic" id="changeRecursosDesc"></textarea></div>
          <div class="field"><label>Valor estimado (R$)</label><input class="input-basic" type="number" min="0" step="100" id="changeRecursosValor" placeholder="Ex.: 5000"></div>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" data-risk-close="changeModal" type="button">Cancelar</button>
          <button class="btn-primary" data-risk-action="save-change" type="button">Salvar</button>
        </div>
      </div>
    </div>
  `;
}

function numberOptions(start, end, selected) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
    .map((value) => `<option ${value === selected ? "selected" : ""}>${value}</option>`)
    .join("");
}

function bindRiskActions() {
  const tabContent = document.querySelector("#riskTabContent");
  if (!tabContent) return;

  tabContent.querySelectorAll("[data-risk-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      riskFilter = button.dataset.riskFilter;
      renderRiskTab();
    });
  });
}

function bindRiskStaticActions() {
  if (document.body.dataset.riskActionsBound !== "true") {
    document.body.dataset.riskActionsBound = "true";
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-risk-action]");
      if (!button) return;
      event.preventDefault();
      handleRiskAction(button.dataset.riskAction, button.dataset.id);
    });
  }

  pageContent.querySelectorAll("[data-risk-close]").forEach((button) => {
    button.addEventListener("click", () => closeRiskModal(button.dataset.riskClose));
  });
}

function bindRiskOverlayClose() {
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.classList.remove("show");
    });
  });
}

function handleRiskAction(action, id) {
  if (!canEditModule("riscos") && !action.startsWith("view-")) {
    toast("Você tem acesso somente para visualizar.");
    return;
  }

  const actions = {
    "new-risk": openRiskItem,
    "save-risk": saveRiskItem,
    "new-goal": openGoal,
    "save-goal": saveGoal,
    "new-change": openChange,
    "save-change": saveChange,
  };

  if (actions[action]) {
    actions[action]();
    return;
  }

  if (action === "view-risk") viewRiskItem(id);
  if (action === "edit-risk") openRiskItem(id);
  if (action === "delete-risk") deleteRiskItem(id);
  if (action === "view-goal") viewGoal(id);
  if (action === "edit-goal") openGoal(id);
  if (action === "delete-goal") deleteGoal(id);
  if (action === "edit-change") openChange(id);
  if (action === "delete-change") deleteChange(id);
}

function openRiskModal(id) {
  document.querySelector(`#${id}`)?.classList.add("show");
}

function closeRiskModal(id) {
  document.querySelector(`#${id}`)?.classList.remove("show");
}

function openRiskItem(id = "") {
  const item = id ? riskGet("riscos").find((row) => row.id === id) : null;
  setText("#riskItemTitle", item ? "Editar item" : "Novo item");
  setInputValue("riskEditId", item?.id || "");
  setInputValue("riskTipo", item?.tipo || "Risco");
  setInputValue("riskProcesso", item?.processo || "");
  setInputValue("riskResponsavel", item?.responsavel || "Hugo Melo");
  setInputValue("riskTexto", item?.texto || "");
  setInputValue("riskProbabilidade", item?.probabilidade || "3");
  setInputValue("riskImpacto", item?.impacto || "3");
  setInputValue("riskProgresso", item?.progresso || "0");
  setInputValue("riskCausa", item?.causa || "");
  setInputValue("riskConsequencia", item?.consequencia || "");
  setInputValue("riskPlanoAcao", item?.planoAcao || "");
  setInputValue("riskStatus", item?.status || "Identificado");
  setInputValue("riskPrazo", item?.prazo || "");
  openRiskModal("riskItemModal");
}

function saveRiskItem() {
  const rows = riskGet("riscos");
  const id = inputValue("riskEditId");
  const record = {
    id: id || nextId("RIS", rows),
    tipo: inputValue("riskTipo"),
    processo: inputValue("riskProcesso"),
    responsavel: inputValue("riskResponsavel"),
    texto: inputValue("riskTexto"),
    probabilidade: Number(inputValue("riskProbabilidade")),
    impacto: Number(inputValue("riskImpacto")),
    progresso: Number(inputValue("riskProgresso")) || 0,
    causa: inputValue("riskCausa"),
    consequencia: inputValue("riskConsequencia"),
    planoAcao: inputValue("riskPlanoAcao"),
    status: inputValue("riskStatus"),
    prazo: inputValue("riskPrazo"),
  };
  const index = rows.findIndex((item) => item.id === id);
  if (index >= 0) rows[index] = record;
  else rows.push(record);
  riskSet("riscos", rows);
  closeRiskModal("riskItemModal");
  refreshRiskScreen("Item salvo.");
}

function deleteRiskItem(id) {
  riskSet("riscos", riskGet("riscos").filter((item) => item.id !== id));
  refreshRiskScreen("Item excluído.");
}

function viewRiskItem(id) {
  const item = riskGet("riscos").find((row) => row.id === id);
  if (!item) return;
  const level = riskLevel(item.probabilidade, item.impacto);
  setText("#riskDetailTitle", item.texto);
  setText("#riskDetailSub", `${item.tipo} · ${item.processo}`);
  document.querySelector("#riskDetailBody").innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><div class="l">Nível</div><div class="v"><span class="risk-pill ${level.cls}">${level.value} · ${level.label}</span></div></div>
      <div class="detail-item"><div class="l">Status</div><div class="v"><span class="status-pill ${statusClass(item.status)}"><span class="status-dot2"></span>${escapeHtml(item.status)}</span></div></div>
      <div class="detail-item"><div class="l">Responsável</div><div class="v">${escapeHtml(item.responsavel)}</div></div>
      <div class="detail-item"><div class="l">Prazo</div><div class="v">${formatDate(item.prazo)}</div></div>
    </div>
    <div class="detail-block"><h5>Causa</h5><p>${escapeHtml(item.causa) || "-"}</p></div>
    <div class="detail-block"><h5>Consequência</h5><p>${escapeHtml(item.consequencia) || "-"}</p></div>
    <div class="detail-block"><h5>Plano de ação</h5><p>${escapeHtml(item.planoAcao) || "-"}</p></div>
    <div class="detail-block"><h5>Progresso do plano</h5><div class="progress-track"><div class="progress-fill" style="width:${Number(item.progresso) || 0}%;"></div></div><p>${Number(item.progresso) || 0}% concluído</p></div>
  `;
  openRiskModal("riskDetailModal");
}

function openGoal(id = "") {
  const item = id ? riskGet("objetivos").find((row) => row.id === id) : null;
  const plan = item?.planejamento || {};
  setText("#goalTitle", item ? "Editar objetivo" : "Novo objetivo");
  setInputValue("goalEditId", item?.id || "");
  setInputValue("goalObjetivo", item?.objetivo || "");
  setInputValue("goalIndicador", item?.indicador || "");
  setInputValue("goalMeta", item?.meta || "");
  setInputValue("goalResultado", item?.resultadoAtual || "");
  setInputValue("goalTendencia", item?.tendenciaDirecao || "up");
  setInputValue("goalStatus", item?.status || "Em andamento");
  setInputValue("goalPrazo", item?.prazoRevisao || "");
  setInputValue("goalResponsavel", item?.responsavel || "Hugo Melo");
  setInputValue("goalCargo", item?.responsavelCargo || "");
  setInputValue("goalOQue", plan.oQue || "");
  setInputValue("goalRecursos", plan.recursos || "");
  setInputValue("goalComo", plan.como || "");
  openRiskModal("goalModal");
}

function saveGoal() {
  const rows = riskGet("objetivos");
  const id = inputValue("goalEditId");
  const record = {
    id: id || nextId("OBJ", rows),
    objetivo: inputValue("goalObjetivo"),
    indicador: inputValue("goalIndicador"),
    meta: inputValue("goalMeta"),
    resultadoAtual: inputValue("goalResultado"),
    tendenciaDirecao: inputValue("goalTendencia"),
    status: inputValue("goalStatus"),
    prazoRevisao: inputValue("goalPrazo"),
    responsavel: inputValue("goalResponsavel"),
    responsavelCargo: inputValue("goalCargo"),
    planejamento: {
      oQue: inputValue("goalOQue"),
      recursos: inputValue("goalRecursos"),
      como: inputValue("goalComo"),
    },
  };
  const index = rows.findIndex((item) => item.id === id);
  if (index >= 0) rows[index] = record;
  else rows.push(record);
  riskSet("objetivos", rows);
  closeRiskModal("goalModal");
  refreshRiskScreen("Objetivo salvo.");
}

function deleteGoal(id) {
  riskSet("objetivos", riskGet("objetivos").filter((item) => item.id !== id));
  refreshRiskScreen("Objetivo excluído.");
}

function viewGoal(id) {
  const item = riskGet("objetivos").find((row) => row.id === id);
  if (!item) return;
  const plan = item.planejamento || {};
  setText("#goalDetailTitle", item.objetivo);
  document.querySelector("#goalDetailBody").innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><div class="l">Indicador</div><div class="v">${escapeHtml(item.indicador)}</div></div>
      <div class="detail-item"><div class="l">Meta</div><div class="v">${escapeHtml(item.meta)}</div></div>
      <div class="detail-item"><div class="l">Resultado atual</div><div class="v">${trendHtml(item.tendenciaDirecao, item.resultadoAtual)}</div></div>
      <div class="detail-item"><div class="l">Responsável</div><div class="v">${escapeHtml(item.responsavel)} · ${escapeHtml(item.responsavelCargo || "")}</div></div>
    </div>
    <div class="detail-block"><h5>O que será feito</h5><p>${escapeHtml(plan.oQue) || "-"}</p></div>
    <div class="detail-block"><h5>Recursos necessários</h5><p>${escapeHtml(plan.recursos) || "-"}</p></div>
    <div class="detail-block"><h5>Como será avaliado</h5><p>${escapeHtml(plan.como) || "-"}</p></div>
  `;
  openRiskModal("goalDetailModal");
}

function openChange(id = "") {
  const item = id ? riskGet("mudancas").find((row) => row.id === id) : null;
  setText("#changeTitle", item ? "Editar mudança" : "Nova mudança");
  setInputValue("changeEditId", item?.id || "");
  setInputValue("changeMudanca", item?.mudanca || "");
  setInputValue("changeProposito", item?.proposito || "");
  setInputValue("changeArea", item?.areaImpactada || "");
  setInputValue("changeResponsavel", item?.responsavel || "Hugo Melo");
  setInputValue("changeStatus", item?.status || "Em planejamento");
  setInputValue("changePrioridade", item?.prioridade || "Média");
  setInputValue("changeData", item?.dataPrevista || "");
  setInputValue("changeRecursosDesc", item?.recursos?.descricao || "");
  setInputValue("changeRecursosValor", item?.recursos?.valor || "");
  openRiskModal("changeModal");
}

function saveChange() {
  const rows = riskGet("mudancas");
  const id = inputValue("changeEditId");
  const record = {
    id: id || `MD-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, "0")}`,
    mudanca: inputValue("changeMudanca"),
    proposito: inputValue("changeProposito"),
    areaImpactada: inputValue("changeArea"),
    responsavel: inputValue("changeResponsavel"),
    status: inputValue("changeStatus"),
    prioridade: inputValue("changePrioridade"),
    dataPrevista: inputValue("changeData"),
    recursos: {
      descricao: inputValue("changeRecursosDesc"),
      valor: Number(inputValue("changeRecursosValor")) || 0,
    },
  };
  const index = rows.findIndex((item) => item.id === id);
  if (index >= 0) rows[index] = record;
  else rows.push(record);
  riskSet("mudancas", rows);
  closeRiskModal("changeModal");
  refreshRiskScreen("Mudança salva.");
}

function deleteChange(id) {
  riskSet("mudancas", riskGet("mudancas").filter((item) => item.id !== id));
  refreshRiskScreen("Mudança excluída.");
}

function inputValue(id) {
  return document.querySelector(`#${id}`)?.value || "";
}

function setInputValue(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.value = value;
}

function refreshRiskScreen(message) {
  renderRiskTab();
  renderRiskKpis();
  toast(message);
}

let ncMainTab = "controle";
let ncSubTab = "clientes";
let ncCurrentId = "";
let ncFilters = { origem: "", referencia: "", processo: "", setor: "", gravidade: "", status: "", busca: "" };
let ncDashYear = "todos";
let ncDashDimension = "processo";

const ncCatalogConfig = {
  clientes: { title: "Clientes", prefix: "CLI", hasCode: true },
  fornecedores: { title: "Fornecedores", prefix: "FOR", hasCode: true },
  processos: { title: "Processo envolvido", prefix: "PRO", hasCode: false },
  setores: { title: "Setor", prefix: "SET", hasCode: false },
};

function ncToday() {
  return new Date().toISOString().slice(0, 10);
}

function ncDate(value) {
  return value ? formatDate(value) : "-";
}

function ensureNcData() {
  state.ncCatalogs = state.ncCatalogs && typeof state.ncCatalogs === "object"
    ? state.ncCatalogs
    : structuredClone(seedState.ncCatalogs);
  Object.keys(ncCatalogConfig).forEach((key) => {
    if (!Array.isArray(state.ncCatalogs[key])) state.ncCatalogs[key] = structuredClone(seedState.ncCatalogs[key]);
  });
  state.ncs = (Array.isArray(state.ncs) ? state.ncs : []).map((row, index) => {
    if (row.dataOrigem || row.ishikawa || row.acoes) {
      return {
        ...row,
        id: row.id || row.code || `RNC-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`,
        ishikawa: { metodo: "", maquina: "", maoObra: "", material: "", medicao: "", meioAmbiente: "", causaRaiz: "", ...(row.ishikawa || {}) },
        acoes: Array.isArray(row.acoes) ? row.acoes : [],
        historico: Array.isArray(row.historico) ? row.historico : [],
      };
    }
    return {
      id: row.code || `RNC-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`,
      dataOrigem: ncToday(), codigoItem: row.code || "", origem: "Interno", origemRef: "",
      setor: row.owner || "Qualidade", processo: "Qualidade", gravidade: row.severity === "Alta" ? "Maior" : row.severity === "Baixa" ? "Menor" : "Média",
      reincidente: false, descricao: row.title || "Não conformidade migrada", status: "Aguardando análise",
      ishikawa: { metodo: "", maquina: "", maoObra: "", material: "", medicao: "", meioAmbiente: "", causaRaiz: "" },
      acoes: [], eficaciaIniciadaEm: "", encerradoEm: "",
      historico: [{ ts: new Date().toISOString(), texto: "Registro migrado para o novo módulo de Não Conformidades." }],
    };
  });
  state.ncs.forEach(ncRecalculateStatus);
}

async function saveNcData(message = "Alterações salvas.") {
  if (!canEditModule("nao-conformidades")) {
    toast("Seu perfil possui acesso somente para visualização.");
    return false;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const saved = await saveRemoteData("state", state, "nao-conformidades");
  toast(saved ? message : "Não foi possível salvar no banco.");
  return saved;
}

function ncActionCounts(rnc) {
  const actions = rnc.acoes || [];
  return {
    total: actions.length,
    done: actions.filter((action) => ncActionEffectiveStatus(action) === "Concluída").length,
    late: actions.filter((action) => ncActionEffectiveStatus(action) === "Atrasada").length,
  };
}

function ncActionEffectiveStatus(action) {
  if (action?.status === "Concluída") return "Concluída";
  return action?.prazo && action.prazo < ncToday() ? "Atrasada" : "Em andamento";
}

function ncRecalculateStatus(rnc) {
  if (rnc.encerradoEm) return void (rnc.status = "Encerrado");
  const counts = ncActionCounts(rnc);
  if (!counts.total) {
    rnc.status = "Aguardando análise";
    rnc.eficaciaIniciadaEm = "";
  } else if (counts.done < counts.total) {
    rnc.status = "Ações em andamento";
    rnc.eficaciaIniciadaEm = "";
  } else {
    rnc.status = "Aguardando eficácia";
    rnc.eficaciaIniciadaEm ||= [...(rnc.acoes || [])].map((action) => action.concluidaEm).filter(Boolean).sort().pop() || ncToday();
  }
}

function ncAddHistory(rnc, text) {
  rnc.historico ||= [];
  rnc.historico.push({ ts: new Date().toISOString(), texto: text });
}

function ncNextNumber() {
  const year = new Date().getFullYear();
  const max = state.ncs.reduce((value, row) => {
    const match = String(row.id || "").match(new RegExp(`^RNC-${year}-(\\d+)$`));
    return Math.max(value, Number(match?.[1] || 0));
  }, 0);
  return `RNC-${year}-${String(max + 1).padStart(4, "0")}`;
}

function ncStatusHtml(status) {
  const cls = ["Encerrado", "Concluída"].includes(status) ? "st-encerrado" : status === "Atrasada" ? "st-atrasada" : status === "Aguardando eficácia" ? "st-eficacia" : ["Ações em andamento", "Em andamento"].includes(status) ? "st-andamento" : "st-aguard";
  return `<span class="status-pill ${cls}"><span class="status-dot2"></span>${escapeHtml(status)}</span>`;
}

function ncSeverityHtml(value) {
  const cls = value === "Maior" ? "grav-maior" : value === "Menor" ? "grav-menor" : "grav-media";
  return `<span class="grav-chip ${cls}">${escapeHtml(value || "Média")}</span>`;
}

function renderNonConformityModule() {
  ensureNcData();
  setTopbar("Não Conformidades", "Registro, tratamento e eficácia de RNCs");
  pageContent.classList.remove("risk-page-content", "context-page-content", "leadership-page-content");
  pageContent.classList.add("nc-page-content");
  pageContent.innerHTML = `
    <div class="breadcrumb"><button type="button" data-view-target="modulos">Meus módulos</button><span>›</span><strong>Não Conformidades</strong></div>
    <div class="page-toolbar"><div><div class="welcome-eyebrow">MELHORIA · NÃO CONFORMIDADES</div><h1 class="welcome-title">Não Conformidades</h1><p class="welcome-sub">Registro, análise de causa, ações corretivas, avaliação de eficácia e rastreabilidade de RNCs.</p></div></div>
    <div id="ncKpis"></div>
    <div class="ctx-tabs" id="ncMainTabs">
      ${[["cadastros", "Cadastros"], ["registrar", "Registrar NC"], ["controle", "Controle"], ["dashboards", "Dashboards"]].map(([id, label]) => `<button class="ctx-tab ${ncMainTab === id ? "active" : ""}" data-nc-tab="${id}" type="button">${label}</button>`).join("")}
    </div>
    <div class="subtab-row" id="ncSubTabs"></div><div id="ncTabContent"></div><div id="ncModalMount"></div>`;
  pageContent.querySelectorAll("[data-nc-tab]").forEach((button) => button.addEventListener("click", () => {
    ncMainTab = button.dataset.ncTab;
    renderNonConformityModule();
  }));
  bindViewTargetButtons();
  renderNcKpis();
  renderNcTab();
  scrollPageToTop();
}

function renderNcKpis() {
  const open = state.ncs.filter((row) => row.status !== "Encerrado").length;
  const awaiting = state.ncs.filter((row) => row.status === "Aguardando análise").length;
  const actions = state.ncs.flatMap((row) => row.acoes || []);
  const running = actions.filter((row) => row.status !== "Concluída").length;
  const late = actions.filter((row) => row.status !== "Concluída" && row.prazo && row.prazo < ncToday()).length;
  const closed = state.ncs.filter((row) => row.status === "Encerrado").length;
  pageContent.querySelector("#ncKpis").innerHTML = `<div class="kpi-row">
    ${ncKpi("RNCs em aberto", open, `${awaiting} aguardando análise`, "#F87171", "nao-conformidades")}
    ${ncKpi("Ações em andamento", running, "ações corretivas não concluídas", "#FBBF24", "plano")}
    ${ncKpi("Ações atrasadas", late, "prazo vencido", "#fb923c", "notificacoes")}
    ${ncKpi("Encerradas", closed, "eficácia comprovada", "#34D399", "auditorias")}
  </div>`;
}

function ncKpi(label, value, caption, color, icon) {
  return `<article class="kpi-card" style="--accent-line:${color}"><div class="kpi-top"><div class="kpi-icon" style="border-color:${hexToRgba(color, .4)};color:${color}">${moduleIcon(icon)}</div><div><div class="kpi-label">${label}</div><div class="kpi-value big">${value}</div></div></div><div class="kpi-caption">${caption}</div></article>`;
}

function renderNcTab() {
  const sub = pageContent.querySelector("#ncSubTabs");
  sub.innerHTML = ncMainTab === "cadastros" ? Object.entries(ncCatalogConfig).map(([id, cfg]) => `<button class="subtab-pill ${ncSubTab === id ? "active" : ""}" data-nc-subtab="${id}" type="button">${cfg.title}</button>`).join("") : "";
  sub.hidden = ncMainTab !== "cadastros";
  sub.querySelectorAll("[data-nc-subtab]").forEach((button) => button.addEventListener("click", () => { ncSubTab = button.dataset.ncSubtab; renderNcTab(); }));
  const content = pageContent.querySelector("#ncTabContent");
  if (ncMainTab === "cadastros") content.innerHTML = ncCatalogHtml();
  if (ncMainTab === "registrar") content.innerHTML = ncRegisterHtml();
  if (ncMainTab === "controle") content.innerHTML = ncControlHtml();
  if (ncMainTab === "dashboards") content.innerHTML = ncDashboardHtml();
  bindNcTabActions();
}

function ncCatalogHtml() {
  const cfg = ncCatalogConfig[ncSubTab];
  const rows = state.ncCatalogs[ncSubTab];
  return `<section class="dcc"><div class="dcc-hd"><div><h2 class="dcc-title">${cfg.title}</h2><p class="dcc-sub">Cadastros utilizados no registro de não conformidades.</p></div>${canEditModule("nao-conformidades") ? `<button class="btn-grad" data-nc-new-catalog type="button">${moduleIcon("plus")} Inserir novo</button>` : ""}</div><div class="nc-table-wrap"><table class="ctxtbl"><thead><tr><th>Nome</th>${cfg.hasCode ? "<th>Código interno</th>" : ""}<th>Ações</th></tr></thead><tbody>${rows.length ? rows.map((row) => `<tr><td><strong>${escapeHtml(row.nome)}</strong></td>${cfg.hasCode ? `<td class="mono">${escapeHtml(row.codigo || "-")}</td>` : ""}<td>${canEditModule("nao-conformidades") ? `<div class="row-actions"><button class="abtn" data-nc-edit-catalog="${row.id}" title="Editar">${moduleIcon("edit")}</button><button class="abtn danger" data-nc-delete-catalog="${row.id}" title="Excluir">${moduleIcon("trash")}</button></div>` : "-"}</td></tr>`).join("") : `<tr><td colspan="3"><div class="empty-state">Nenhum registro cadastrado.</div></td></tr>`}</tbody></table></div></section>`;
}

function ncRegisterHtml() {
  const options = (key) => state.ncCatalogs[key].map((row) => `<option value="${escapeHtml(row.nome)}">${escapeHtml(row.nome)}</option>`).join("");
  const disabled = canEditModule("nao-conformidades") ? "" : "disabled";
  return `<section class="form-card nc-register-form">
    <div class="nc-register-head"><h2 class="dcc-title">Registrar Não Conformidade</h2><p class="dcc-sub nc-form-intro">O número é gerado automaticamente · próximo: <strong class="mono">${ncNextNumber()}</strong></p></div>
    <div class="nc-register-columns">
      <div class="nc-register-column">
        <div class="field-row2"><label class="field">Data de origem<input class="input-basic" id="ncData" type="date" value="${ncToday()}" ${disabled}></label><label class="field">Código do item<input class="input-basic" id="ncItem" placeholder="Ex.: PRD-4471" ${disabled}></label></div>
        <div class="field-row2"><label class="field">Origem<select class="input-basic" id="ncOrigin" ${disabled}><option value="">Selecione...</option><option>Interno</option><option>Fornecedor</option><option>Cliente</option></select></label><label class="field" id="ncReferenceWrap" hidden>Referência<select class="input-basic" id="ncReference" ${disabled}></select></label></div>
        <label class="field">Setor<select class="input-basic" id="ncSector" ${disabled}><option value="">Selecione...</option>${options("setores")}</select></label>
      </div>
      <div class="nc-register-column nc-register-column-right">
        <div class="field-row2"><label class="field">Gravidade<select class="input-basic" id="ncSeverity" ${disabled}><option>Menor</option><option selected>Média</option><option>Maior</option></select></label><label class="field">Processo envolvido<select class="input-basic" id="ncProcess" ${disabled}><option value="">Selecione...</option>${options("processos")}</select></label></div>
        <label class="field nc-description-field">Descrição da não conformidade<textarea class="input-basic" id="ncDescription" ${disabled}></textarea></label>
        <div class="nc-register-footer">
          <label class="check-row"><input type="checkbox" id="ncRepeat" ${disabled}> Esta não conformidade é reincidente</label>
          ${canEditModule("nao-conformidades") ? `<div class="form-actions"><button class="btn-danger-ghost" data-nc-clear type="button">Limpar</button><button class="btn-primary" data-nc-save type="button">Salvar NC</button></div>` : `<div class="banner-info">Seu perfil possui acesso somente para visualização.</div>`}
        </div>
      </div>
    </div>
  </section>`;
}

function ncControlHtml() {
  const values = (key) => state.ncCatalogs[key].map((row) => row.nome);
  const option = (items, selected) => `<option value="">Todos</option>${items.map((item) => `<option ${selected === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}`;
  const filtered = state.ncs.filter((row) => {
    const haystack = `${row.id} ${row.codigoItem} ${row.descricao} ${row.origemRef} ${row.setor} ${row.processo}`.toLowerCase();
    return (!ncFilters.origem || row.origem === ncFilters.origem) && (!ncFilters.referencia || row.origemRef === ncFilters.referencia) && (!ncFilters.processo || row.processo === ncFilters.processo) && (!ncFilters.setor || row.setor === ncFilters.setor) && (!ncFilters.gravidade || row.gravidade === ncFilters.gravidade) && (!ncFilters.status || row.status === ncFilters.status) && (!ncFilters.busca || haystack.includes(ncFilters.busca.toLowerCase()));
  }).sort((a, b) => String(b.id).localeCompare(String(a.id)));
  return `<div class="filter-bar">
    ${ncFilterSelect("origem", "Origem", ["Interno", "Fornecedor", "Cliente"])}
    ${ncFilterSelect("referencia", "Cliente / Fornecedor", [...values("clientes"), ...values("fornecedores")])}
    ${ncFilterSelect("processo", "Processo", values("processos"))}${ncFilterSelect("setor", "Setor", values("setores"))}
    ${ncFilterSelect("gravidade", "Gravidade", ["Menor", "Média", "Maior"])}${ncFilterSelect("status", "Status", ["Aguardando análise", "Ações em andamento", "Aguardando eficácia", "Encerrado"])}
    <label class="fg search">Busca livre<input class="input-basic" data-nc-filter="busca" value="${escapeHtml(ncFilters.busca)}" placeholder="Número, item, descrição..."></label><div class="filter-clear"><button data-nc-clear-filters type="button">Limpar filtros</button></div></div>
    <section class="dcc"><div class="dcc-hd"><div><h2 class="dcc-title">Controle de RNCs</h2><p class="dcc-sub">${filtered.length} registro(s) · clique no número para abrir</p></div>${canEditModule("nao-conformidades") ? `<button class="btn-grad" data-nc-go-register type="button">${moduleIcon("plus")} Registrar NC</button>` : ""}</div><div class="nc-table-wrap"><table class="ctxtbl nc-control-table"><thead><tr><th>Número</th><th>Data</th><th>Origem</th><th>Qual?</th><th>Setor</th><th>Status</th><th>Concluídas</th><th>Atrasadas</th><th>Ações</th></tr></thead><tbody>${filtered.length ? filtered.map((row) => { const count = ncActionCounts(row); return `<tr><td><button class="rnc-link" data-nc-open="${row.id}" type="button">${escapeHtml(row.id)}</button></td><td class="mono">${ncDate(row.dataOrigem)}</td><td><span class="mchip ${row.origem === "Cliente" ? "mchip-blue" : row.origem === "Fornecedor" ? "mchip-purple" : "mchip-gray"}">${escapeHtml(row.origem)}</span></td><td class="desc-cell">${escapeHtml(row.origemRef || "Problema interno")}</td><td>${escapeHtml(row.setor)}</td><td>${ncStatusHtml(row.status)}</td><td class="mono">${count.done}/${count.total}</td><td><span class="atrasadas-badge ${count.late ? "atrasadas-n" : "atrasadas-0"}">${count.late}</span></td><td>${canEditModule("nao-conformidades") ? `<div class="row-actions nc-row-actions"><button class="abtn" data-nc-edit="${row.id}" type="button" title="Editar RNC" aria-label="Editar ${escapeHtml(row.id)}">${moduleIcon("edit")}</button><button class="abtn danger" data-nc-delete="${row.id}" type="button" title="Excluir RNC" aria-label="Excluir ${escapeHtml(row.id)}">${moduleIcon("trash")}</button></div>` : "-"}</td></tr>`; }).join("") : `<tr><td colspan="9"><div class="empty-state">Nenhum RNC encontrado.</div></td></tr>`}</tbody></table></div></section>`;
}

function ncFilterSelect(key, label, items) {
  return `<label class="fg">${label}<select class="input-basic" data-nc-filter="${key}"><option value="">Todos</option>${items.map((item) => `<option ${ncFilters[key] === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label>`;
}

function bindNcTabActions() {
  pageContent.querySelector("[data-nc-new-catalog]")?.addEventListener("click", () => openNcCatalogModal());
  pageContent.querySelectorAll("[data-nc-edit-catalog]").forEach((button) => button.addEventListener("click", () => openNcCatalogModal(button.dataset.ncEditCatalog)));
  pageContent.querySelectorAll("[data-nc-delete-catalog]").forEach((button) => button.addEventListener("click", () => deleteNcCatalog(button.dataset.ncDeleteCatalog)));
  pageContent.querySelector("#ncOrigin")?.addEventListener("change", updateNcReference);
  pageContent.querySelector("[data-nc-save]")?.addEventListener("click", saveNewNc);
  pageContent.querySelector("[data-nc-clear]")?.addEventListener("click", () => { ncMainTab = "registrar"; renderNcTab(); });
  pageContent.querySelectorAll("[data-nc-filter]").forEach((field) => field.addEventListener(field.tagName === "INPUT" ? "input" : "change", () => { ncFilters[field.dataset.ncFilter] = field.value; renderNcTab(); }));
  pageContent.querySelector("[data-nc-clear-filters]")?.addEventListener("click", () => { ncFilters = { origem: "", referencia: "", processo: "", setor: "", gravidade: "", status: "", busca: "" }; renderNcTab(); });
  pageContent.querySelector("[data-nc-go-register]")?.addEventListener("click", () => { ncMainTab = "registrar"; renderNonConformityModule(); });
  pageContent.querySelectorAll("[data-nc-open]").forEach((button) => button.addEventListener("click", () => openNcDetail(button.dataset.ncOpen)));
  pageContent.querySelectorAll("[data-nc-edit]").forEach((button) => button.addEventListener("click", () => openNcEdit(button.dataset.ncEdit)));
  pageContent.querySelectorAll("[data-nc-delete]").forEach((button) => button.addEventListener("click", () => deleteNc(button.dataset.ncDelete)));
  pageContent.querySelectorAll("[data-nc-dash]").forEach((field) => field.addEventListener("change", () => { if (field.dataset.ncDash === "year") ncDashYear = field.value; else ncDashDimension = field.value; renderNcTab(); }));
  pageContent.querySelector("[data-nc-transmit]")?.addEventListener("click", transmitNcDashboard);
}

function updateNcReference() {
  const origin = pageContent.querySelector("#ncOrigin")?.value;
  const wrap = pageContent.querySelector("#ncReferenceWrap");
  const select = pageContent.querySelector("#ncReference");
  if (!wrap || !select) return;
  wrap.hidden = origin === "Interno" || !origin;
  const key = origin === "Cliente" ? "clientes" : "fornecedores";
  select.innerHTML = `<option value="">Selecione...</option>${state.ncCatalogs[key].map((row) => `<option>${escapeHtml(row.nome)}</option>`).join("")}`;
}

async function saveNewNc() {
  if (!canEditModule("nao-conformidades")) return;
  const value = (selector) => pageContent.querySelector(selector)?.value.trim() || "";
  const origin = value("#ncOrigin");
  const reference = value("#ncReference");
  if (!origin || (!reference && origin !== "Interno") || !value("#ncSector") || !value("#ncProcess") || !value("#ncDescription")) return void toast("Preencha os campos obrigatórios.");
  const rnc = { id: ncNextNumber(), dataOrigem: value("#ncData") || ncToday(), codigoItem: value("#ncItem"), origem: origin, origemRef: origin === "Interno" ? "" : reference, setor: value("#ncSector"), processo: value("#ncProcess"), gravidade: value("#ncSeverity"), reincidente: pageContent.querySelector("#ncRepeat")?.checked || false, descricao: value("#ncDescription"), status: "Aguardando análise", ishikawa: { metodo: "", maquina: "", maoObra: "", material: "", medicao: "", meioAmbiente: "", causaRaiz: "" }, acoes: [], eficaciaIniciadaEm: "", encerradoEm: "", historico: [] };
  ncAddHistory(rnc, `RNC aberta por ${currentUser?.name || "Usuário"}.`);
  state.ncs.push(rnc);
  if (await saveNcData(`${rnc.id} registrado com sucesso.`)) { ncMainTab = "controle"; renderNonConformityModule(); }
}

function openNcEdit(id) {
  const row = state.ncs.find((item) => item.id === id);
  if (!row || !canEditModule("nao-conformidades")) return;
  const selected = (value, current) => value === current ? "selected" : "";
  const options = (key, current) => state.ncCatalogs[key].map((item) => `<option value="${escapeHtml(item.nome)}" ${selected(item.nome, current)}>${escapeHtml(item.nome)}</option>`).join("");
  const referenceKey = row.origem === "Cliente" ? "clientes" : "fornecedores";
  mountNcModal(`<div class="modal-box wide"><div class="modal-hd"><div><h3>Editar ${escapeHtml(row.id)}</h3><p>Atualize os dados principais da não conformidade.</p></div><button class="modal-close" data-nc-close>${moduleIcon("close")}</button></div>
    <div class="field-row2"><label class="field">Data de origem<input class="input-basic" id="ncEditData" type="date" value="${escapeHtml(row.dataOrigem || ncToday())}"></label><label class="field">Código do item<input class="input-basic" id="ncEditItem" value="${escapeHtml(row.codigoItem || "")}"></label></div>
    <div class="field-row2"><label class="field">Origem<select class="input-basic" id="ncEditOrigin"><option ${selected("Interno", row.origem)}>Interno</option><option ${selected("Fornecedor", row.origem)}>Fornecedor</option><option ${selected("Cliente", row.origem)}>Cliente</option></select></label><label class="field" id="ncEditReferenceWrap" ${row.origem === "Interno" ? "hidden" : ""}>Referência<select class="input-basic" id="ncEditReference"><option value="">Selecione...</option>${options(referenceKey, row.origemRef)}</select></label></div>
    <div class="field-row2"><label class="field">Setor<select class="input-basic" id="ncEditSector"><option value="">Selecione...</option>${options("setores", row.setor)}</select></label><label class="field">Processo envolvido<select class="input-basic" id="ncEditProcess"><option value="">Selecione...</option>${options("processos", row.processo)}</select></label></div>
    <div class="field-row2"><label class="field">Gravidade<select class="input-basic" id="ncEditSeverity"><option ${selected("Menor", row.gravidade)}>Menor</option><option ${selected("Média", row.gravidade)}>Média</option><option ${selected("Maior", row.gravidade)}>Maior</option></select></label><label class="check-row nc-edit-repeat"><input type="checkbox" id="ncEditRepeat" ${row.reincidente ? "checked" : ""}> Esta não conformidade é reincidente</label></div>
    <label class="field">Descrição da não conformidade<textarea class="input-basic" id="ncEditDescription">${escapeHtml(row.descricao || "")}</textarea></label>
    <div class="modal-actions"><button class="btn-ghost" data-nc-close type="button">Cancelar</button><button class="btn-primary" id="ncEditSave" type="button">Salvar alterações</button></div></div>`);
  document.querySelector("#ncEditOrigin")?.addEventListener("change", updateNcEditReference);
  document.querySelector("#ncEditSave")?.addEventListener("click", () => saveNcEdit(id));
}

function updateNcEditReference() {
  const origin = document.querySelector("#ncEditOrigin")?.value || "Interno";
  const wrap = document.querySelector("#ncEditReferenceWrap");
  const select = document.querySelector("#ncEditReference");
  if (!wrap || !select) return;
  wrap.hidden = origin === "Interno";
  const key = origin === "Cliente" ? "clientes" : "fornecedores";
  select.innerHTML = `<option value="">Selecione...</option>${state.ncCatalogs[key].map((item) => `<option value="${escapeHtml(item.nome)}">${escapeHtml(item.nome)}</option>`).join("")}`;
}

async function saveNcEdit(id) {
  const row = state.ncs.find((item) => item.id === id);
  if (!row || !canEditModule("nao-conformidades")) return;
  const value = (selector) => document.querySelector(selector)?.value.trim() || "";
  const origin = value("#ncEditOrigin");
  const reference = value("#ncEditReference");
  if (!origin || (!reference && origin !== "Interno") || !value("#ncEditSector") || !value("#ncEditProcess") || !value("#ncEditDescription")) return void toast("Preencha os campos obrigatórios.");
  Object.assign(row, {
    dataOrigem: value("#ncEditData") || ncToday(),
    codigoItem: value("#ncEditItem"),
    origem: origin,
    origemRef: origin === "Interno" ? "" : reference,
    setor: value("#ncEditSector"),
    processo: value("#ncEditProcess"),
    gravidade: value("#ncEditSeverity"),
    reincidente: document.querySelector("#ncEditRepeat")?.checked || false,
    descricao: value("#ncEditDescription"),
  });
  ncAddHistory(row, `${currentUser?.name || "Usuário"} atualizou os dados da RNC.`);
  ncRecalculateStatus(row);
  if (await saveNcData(`${row.id} atualizado com sucesso.`)) { closeNcModal(); renderNcKpis(); renderNcTab(); }
}

async function deleteNc(id) {
  if (!canEditModule("nao-conformidades") || !window.confirm(`Excluir definitivamente a RNC ${id}?`)) return;
  state.ncs = state.ncs.filter((row) => row.id !== id);
  if (await saveNcData(`${id} excluído com sucesso.`)) { renderNcKpis(); renderNcTab(); }
}

function openNcCatalogModal(id = "") {
  const cfg = ncCatalogConfig[ncSubTab];
  const row = state.ncCatalogs[ncSubTab].find((item) => item.id === id);
  mountNcModal(`<div class="modal-box"><div class="modal-hd"><div><h3>${row ? "Editar" : "Novo"} · ${cfg.title}</h3><p>Cadastro utilizado no registro de RNC</p></div><button class="modal-close" data-nc-close>${moduleIcon("close")}</button></div><input id="ncCatalogId" type="hidden" value="${escapeHtml(id)}"><label class="field">Nome<input class="input-basic" id="ncCatalogName" value="${escapeHtml(row?.nome || "")}"></label>${cfg.hasCode ? `<label class="field">Código interno<input class="input-basic" id="ncCatalogCode" value="${escapeHtml(row?.codigo || "")}"></label>` : ""}<div class="modal-actions"><button class="btn-ghost" data-nc-close>Cancelar</button><button class="btn-primary" id="ncCatalogSave">Salvar</button></div></div>`);
  document.querySelector("#ncCatalogSave")?.addEventListener("click", saveNcCatalog);
}

async function saveNcCatalog() {
  const cfg = ncCatalogConfig[ncSubTab];
  const rows = state.ncCatalogs[ncSubTab];
  const id = document.querySelector("#ncCatalogId")?.value;
  const nome = document.querySelector("#ncCatalogName")?.value.trim();
  if (!nome) return void toast("Informe o nome.");
  const record = { id: id || `${cfg.prefix}-${Date.now()}`, nome, ...(cfg.hasCode ? { codigo: document.querySelector("#ncCatalogCode")?.value.trim() || "" } : {}) };
  const index = rows.findIndex((item) => item.id === id);
  if (index >= 0) rows[index] = record; else rows.push(record);
  closeNcModal(); await saveNcData("Cadastro salvo."); renderNcTab();
}

async function deleteNcCatalog(id) {
  if (!window.confirm("Excluir este cadastro?")) return;
  state.ncCatalogs[ncSubTab] = state.ncCatalogs[ncSubTab].filter((item) => item.id !== id);
  await saveNcData("Cadastro excluído."); renderNcTab();
}

function mountNcModal(html) {
  const mount = document.querySelector("#ncModalMount");
  mount.innerHTML = `<div class="modal-overlay show nc-modal-overlay">${html}</div>`;
  mount.querySelectorAll("[data-nc-close]").forEach((button) => button.addEventListener("click", closeNcModal));
  mount.querySelector(".modal-overlay")?.addEventListener("click", (event) => { if (event.target.classList.contains("modal-overlay")) closeNcModal(); });
}

function closeNcModal() {
  const mount = document.querySelector("#ncModalMount");
  if (mount) mount.innerHTML = "";
}

function openNcDetail(id) {
  ncCurrentId = id;
  const rnc = state.ncs.find((row) => row.id === id);
  if (!rnc) return;
  ncRecalculateStatus(rnc);
  const count = ncActionCounts(rnc);
  const ish = rnc.ishikawa || {};
  const ishFilled = Object.values(ish).some(Boolean);
  const history = [...(rnc.historico || [])].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  const actionRows = (rnc.acoes || []).map((action) => `<div class="acao-item"><div class="acao-item-hd"><div><div class="acao-item-desc">${escapeHtml(action.desc)}</div><div class="acao-item-meta"><span>Prazo: <b>${ncDate(action.prazo)}</b></span><span>Responsável: <b>${escapeHtml(action.responsavel)}</b></span>${action.evidencia ? `<span>Arquivo: <b>${escapeHtml(action.evidencia)}</b></span>` : ""}</div></div>${ncStatusHtml(ncActionEffectiveStatus(action))}</div></div>`).join("");
  const days = rnc.eficaciaIniciadaEm ? Math.floor((Date.now() - new Date(`${rnc.eficaciaIniciadaEm}T00:00:00`).getTime()) / 86400000) : 0;
  mountNcModal(`<div class="modal-box xwide nc-rnc-modal"><div class="modal-hd"><div><h3>${escapeHtml(rnc.id)}</h3><p>Registro de Não Conformidade · ${escapeHtml(rnc.status)}</p></div><div class="nc-modal-tools"><button class="btn-sm" id="ncPrint">${moduleIcon("download")} Imprimir PDF</button><button class="modal-close" data-nc-close>${moduleIcon("close")}</button></div></div>
    <div class="rnc-detail-grid">${[["Data de origem", ncDate(rnc.dataOrigem)], ["Código do item", rnc.codigoItem || "-"], ["Origem", rnc.origem === "Interno" ? "Interno" : `${rnc.origem} · ${rnc.origemRef}`], ["Setor", rnc.setor], ["Processo", rnc.processo], ["Gravidade", rnc.gravidade], ["Status", rnc.status], ["Reincidente", rnc.reincidente ? "Sim" : "Não"], ["Ações", `${count.done}/${count.total}`]].map(([label, value]) => `<div class="detail-item"><div class="l">${label}</div><div class="v">${escapeHtml(value)}</div></div>`).join("")}</div>
    <section class="rnc-section"><div class="rnc-section-hd"><h4>Descrição da não conformidade</h4></div><p>${escapeHtml(rnc.descricao)}</p></section>
    <section class="rnc-section"><div class="rnc-section-hd"><h4>Análise de causa · Ishikawa <span class="num">6M</span></h4>${canEditModule("nao-conformidades") ? `<button class="btn-sm" id="ncEditIsh">${moduleIcon("edit")} Editar análise</button>` : ""}</div>${ishFilled ? `<div class="ishikawa-grid">${[["Método", ish.metodo], ["Máquina", ish.maquina], ["Mão de obra", ish.maoObra], ["Material", ish.material], ["Medição", ish.medicao], ["Meio ambiente", ish.meioAmbiente]].map(([label, value]) => `<div class="ishikawa-cell"><div class="m-label">${label}</div><div class="m-text">${escapeHtml(value || "-")}</div></div>`).join("")}</div>${ish.causaRaiz ? `<div class="causa-raiz-box"><div class="crlabel">Conclusão / Causa raiz</div><div class="crtext">${escapeHtml(ish.causaRaiz)}</div></div>` : ""}` : `<div class="empty-state">Análise de causa ainda não preenchida.</div>`}</section>
    <section class="rnc-section"><div class="rnc-section-hd"><h4>Ações corretivas <span class="num">${count.done}/${count.total}</span></h4>${canEditModule("nao-conformidades") ? `<button class="btn-sm" id="ncManageActions">${moduleIcon("edit")} Gerenciar ações</button>` : ""}</div>${actionRows || `<div class="empty-state">Nenhuma ação cadastrada.</div>`}</section>
    <section class="rnc-section"><div class="rnc-section-hd"><h4>Avaliação de eficácia</h4>${canEditModule("nao-conformidades") && rnc.status === "Aguardando eficácia" ? `<button class="btn-sm grad" id="ncCloseRnc">Encerrar RNC</button>` : ""}</div><div class="banner-info ${rnc.status === "Encerrado" ? "banner-success" : rnc.status === "Aguardando eficácia" ? "banner-warn" : ""}">${rnc.status === "Encerrado" ? `Eficácia comprovada e RNC encerrado em ${ncDate(rnc.encerradoEm)}.` : rnc.status === "Aguardando eficácia" ? `${Math.max(0, 30 - days)} dia(s) restantes no período de avaliação de 30 dias.` : "A avaliação começa quando todas as ações forem concluídas."}</div></section>
    <section class="rnc-section"><div class="rnc-section-hd"><h4>Histórico e rastreabilidade</h4></div><div class="timeline">${history.map((item) => `<div class="tl-item"><div class="tl-dot"></div><div class="tl-time">${formatDateTime(item.ts)}</div><div class="tl-text">${escapeHtml(String(item.texto || "").replace(/<[^>]+>/g, ""))}</div></div>`).join("") || `<div class="empty-state">Sem registros no histórico.</div>`}</div></section></div>`);
  document.querySelector("#ncPrint")?.addEventListener("click", () => window.print());
  document.querySelector("#ncEditIsh")?.addEventListener("click", openNcIshikawa);
  document.querySelector("#ncManageActions")?.addEventListener("click", openNcActions);
  document.querySelector("#ncCloseRnc")?.addEventListener("click", closeNcRnc);
}

function openNcIshikawa() {
  const row = state.ncs.find((item) => item.id === ncCurrentId); const ish = row?.ishikawa || {};
  mountNcModal(`<div class="modal-box wide"><div class="modal-hd"><div><h3>Análise de Causa · Ishikawa 6M</h3><p>${escapeHtml(ncCurrentId)}</p></div><button class="modal-close" data-nc-close>${moduleIcon("close")}</button></div><div class="field-row2">${[["metodo", "Método"], ["maquina", "Máquina"], ["maoObra", "Mão de obra"], ["material", "Material"], ["medicao", "Medição"], ["meioAmbiente", "Meio ambiente"]].map(([key, label]) => `<label class="field">${label}<textarea class="input-basic" data-ish="${key}">${escapeHtml(ish[key] || "")}</textarea></label>`).join("")}</div><label class="field">Conclusão / Causa raiz<textarea class="input-basic" data-ish="causaRaiz">${escapeHtml(ish.causaRaiz || "")}</textarea></label><div class="modal-actions"><button class="btn-danger-ghost" id="ncClearIsh">Limpar</button><button class="btn-primary" id="ncSaveIsh">Salvar análise</button></div></div>`);
  document.querySelector("#ncClearIsh")?.addEventListener("click", () => document.querySelectorAll("[data-ish]").forEach((field) => { field.value = ""; }));
  document.querySelector("#ncSaveIsh")?.addEventListener("click", saveNcIshikawa);
}

async function saveNcIshikawa() {
  const row = state.ncs.find((item) => item.id === ncCurrentId); if (!row) return;
  row.ishikawa = Object.fromEntries([...document.querySelectorAll("[data-ish]")].map((field) => [field.dataset.ish, field.value.trim()]));
  ncAddHistory(row, `${currentUser?.name || "Usuário"} atualizou a análise de causa Ishikawa.`);
  await saveNcData("Análise de causa salva."); openNcDetail(row.id);
}

function ncResponsibleOptions(selected = "") {
  const names = [...new Set([currentUser?.name, ...(state.users || []).map((user) => user.name), "Hugo Melo", "Carlos Andrade", "Marina Souza"].filter(Boolean))];
  return names.map((name) => `<option ${name === selected ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");
}

function openNcActions(editId = "") {
  const row = state.ncs.find((item) => item.id === ncCurrentId); if (!row) return;
  const edit = (row.acoes || []).find((item) => item.id === editId);
  const formStatus = edit?.status === "Concluída" ? "Concluída" : "Em andamento";
  const list = (row.acoes || []).map((action) => `<div class="acao-item"><div class="acao-item-hd"><div><div class="acao-item-desc">${escapeHtml(action.desc)}</div><div class="acao-item-meta">Prazo: ${ncDate(action.prazo)} · ${escapeHtml(action.responsavel)} · ${escapeHtml(ncActionEffectiveStatus(action))}</div></div><div class="row-actions"><button class="abtn" data-action-edit="${action.id}" title="Editar">${moduleIcon("edit")}</button><button class="abtn danger" data-action-delete="${action.id}" title="Excluir">${moduleIcon("trash")}</button></div></div></div>`).join("");
  mountNcModal(`<div class="modal-box wide"><div class="modal-hd"><div><h3>Ações Corretivas</h3><p>${escapeHtml(row.id)}</p></div><button class="modal-close" data-nc-close>${moduleIcon("close")}</button></div>${list || `<div class="empty-state">Nenhuma ação cadastrada.</div>`}<div class="nc-action-form"><input id="ncActionId" type="hidden" value="${escapeHtml(editId)}"><label class="field">Ação<textarea class="input-basic" id="ncActionDesc">${escapeHtml(edit?.desc || "")}</textarea></label><div class="field-row3"><label class="field">Prazo<input class="input-basic" id="ncActionDue" type="date" value="${escapeHtml(edit?.prazo || "")}"></label><label class="field">Responsável<select class="input-basic" id="ncActionOwner">${ncResponsibleOptions(edit?.responsavel)}</select></label><label class="field">Status<select class="input-basic" id="ncActionStatus"><option ${formStatus === "Em andamento" ? "selected" : ""}>Em andamento</option><option ${formStatus === "Concluída" ? "selected" : ""}>Concluída</option></select></label></div><label class="field" id="ncActionEvidenceWrap" ${formStatus === "Concluída" ? "" : "hidden"}>Evidência<input class="input-basic" id="ncActionEvidence" type="file"><small id="ncEvidenceName">${escapeHtml(edit?.evidencia || "Nenhum arquivo selecionado")}</small></label><div class="modal-actions"><button class="btn-ghost" id="ncResetAction">Cancelar edição</button><button class="btn-primary" id="ncSaveAction">Salvar ação</button></div></div></div>`);
  document.querySelectorAll("[data-action-edit]").forEach((button) => button.addEventListener("click", () => openNcActions(button.dataset.actionEdit)));
  document.querySelectorAll("[data-action-delete]").forEach((button) => button.addEventListener("click", () => deleteNcAction(button.dataset.actionDelete)));
  document.querySelector("#ncResetAction")?.addEventListener("click", () => openNcActions());
  document.querySelector("#ncActionStatus")?.addEventListener("change", updateNcActionEvidenceVisibility);
  document.querySelector("#ncSaveAction")?.addEventListener("click", saveNcAction);
}

function updateNcActionEvidenceVisibility() {
  const wrap = document.querySelector("#ncActionEvidenceWrap");
  if (wrap) wrap.hidden = document.querySelector("#ncActionStatus")?.value !== "Concluída";
}

async function saveNcAction() {
  const row = state.ncs.find((item) => item.id === ncCurrentId); if (!row) return;
  const id = document.querySelector("#ncActionId")?.value; const desc = document.querySelector("#ncActionDesc")?.value.trim();
  if (!desc) return void toast("Descreva a ação.");
  const existing = (row.acoes || []).find((item) => item.id === id); const selectedStatus = document.querySelector("#ncActionStatus")?.value;
  const prazo = document.querySelector("#ncActionDue")?.value || "";
  const status = selectedStatus === "Concluída" ? "Concluída" : prazo && prazo < ncToday() ? "Atrasada" : "Em andamento";
  const file = document.querySelector("#ncActionEvidence")?.files?.[0];
  if (file && file.size > 5 * 1024 * 1024) return void toast("O arquivo deve ter no máximo 5 MB.");
  const action = { id: id || `AC-${Date.now()}`, desc, prazo, responsavel: document.querySelector("#ncActionOwner")?.value || "", status, evidencia: file?.name || existing?.evidencia || "", concluidaEm: status === "Concluída" ? existing?.concluidaEm || ncToday() : "" };
  row.acoes ||= []; const index = row.acoes.findIndex((item) => item.id === id); if (index >= 0) row.acoes[index] = action; else row.acoes.push(action);
  ncRecalculateStatus(row); ncAddHistory(row, `${currentUser?.name || "Usuário"} ${existing ? "atualizou" : "criou"} uma ação corretiva.`);
  await saveNcData("Ação corretiva salva."); openNcActions(); renderNcKpis();
}

async function deleteNcAction(id) {
  if (!window.confirm("Excluir esta ação corretiva?")) return;
  const row = state.ncs.find((item) => item.id === ncCurrentId); if (!row) return;
  row.acoes = (row.acoes || []).filter((item) => item.id !== id); ncRecalculateStatus(row); ncAddHistory(row, `${currentUser?.name || "Usuário"} excluiu uma ação corretiva.`);
  await saveNcData("Ação excluída."); openNcActions(); renderNcKpis();
}

async function closeNcRnc() {
  const row = state.ncs.find((item) => item.id === ncCurrentId); if (!row || !window.confirm("Confirmar eficácia e encerrar este RNC?")) return;
  row.encerradoEm = ncToday(); ncRecalculateStatus(row); ncAddHistory(row, `${currentUser?.name || "Usuário"} confirmou a eficácia e encerrou o RNC.`);
  await saveNcData("RNC encerrado."); openNcDetail(row.id); renderNcKpis();
}

function ncAggregate() {
  const rows = ncDashYear === "todos" ? state.ncs : state.ncs.filter((row) => String(row.dataOrigem || "").startsWith(ncDashYear));
  const dimensions = { processo: {}, setor: {}, origem: {}, gravidade: {}, referencia: {} };
  rows.forEach((row) => Object.entries({ processo: row.processo, setor: row.setor, origem: row.origem, gravidade: row.gravidade, referencia: row.origemRef || "Interno" }).forEach(([key, value]) => { dimensions[key][value || "-"] = (dimensions[key][value || "-"] || 0) + 1; }));
  const actions = rows.flatMap((row) => row.acoes || []);
  return { rows, dimensions, actions, closed: rows.filter((row) => row.status === "Encerrado").length, open: rows.filter((row) => row.status !== "Encerrado").length, major: rows.filter((row) => row.gravidade === "Maior").length, repeat: rows.filter((row) => row.reincidente).length };
}

function ncDashboardHtml() {
  const agg = ncAggregate(); const years = [...new Set(state.ncs.map((row) => String(row.dataOrigem || "").slice(0, 4)).filter(Boolean))].sort().reverse();
  const data = Object.entries(agg.dimensions[ncDashDimension] || {}).sort((a, b) => b[1] - a[1]); const max = Math.max(1, ...data.map(([, value]) => value));
  const status = ["Aguardando análise", "Ações em andamento", "Aguardando eficácia", "Encerrado"].map((name) => [name, agg.rows.filter((row) => row.status === name).length]);
  return `<div class="dash-toolbar"><label class="fg">Ano<select class="input-basic" data-nc-dash="year"><option value="todos">Todos os anos</option>${years.map((year) => `<option ${ncDashYear === year ? "selected" : ""}>${year}</option>`).join("")}</select></label><button class="btn-transmit" data-nc-transmit type="button"><span class="live-dot"></span>${moduleIcon("external")} Transmitir</button></div><div class="dash-cards">${[["Total de RNCs", agg.rows.length, `${agg.open} abertas`], ["Gravidade maior", agg.major, "maior severidade"], ["Reincidentes", agg.repeat, "atenção especial"], ["Taxa de encerramento", agg.rows.length ? `${Math.round(agg.closed / agg.rows.length * 100)}%` : "0%", "eficácia comprovada"]].map(([label, value, caption], index) => `<article class="dash-solid-card dash-color-${index}"><div class="sc-label">${label}</div><div class="sc-value">${value}</div><div class="sc-caption">${caption}</div></article>`).join("")}</div><div class="chart-grid"><section class="chart-card full"><div class="chart-card-hd"><div><h4>Gráfico de Pareto</h4><div class="sub">Frequência por dimensão</div></div><select class="input-basic" data-nc-dash="dimension">${[["processo", "Processo"], ["setor", "Setor"], ["origem", "Origem"], ["gravidade", "Gravidade"], ["referencia", "Cliente/Fornecedor"]].map(([value, label]) => `<option value="${value}" ${ncDashDimension === value ? "selected" : ""}>${label}</option>`).join("")}</select></div><div class="nc-bars">${data.map(([label, value]) => `<div class="nc-bar-row"><span>${escapeHtml(label)}</span><div><i style="width:${value / max * 100}%"></i></div><strong>${value}</strong></div>`).join("") || `<div class="empty-state">Sem dados para o período.</div>`}</div></section><section class="chart-card"><div class="chart-card-hd"><h4>Status dos RNCs</h4></div><div class="nc-status-chart">${status.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`).join("")}</div></section><section class="chart-card"><div class="chart-card-hd"><h4>Ações corretivas</h4></div><div class="nc-status-chart"><div><span>Concluídas</span><strong>${agg.actions.filter((row) => row.status === "Concluída").length}</strong></div><div><span>Pendentes</span><strong>${agg.actions.filter((row) => row.status !== "Concluída").length}</strong></div><div><span>Atrasadas</span><strong>${agg.actions.filter((row) => row.status !== "Concluída" && row.prazo < ncToday()).length}</strong></div></div></section></div>`;
}

function transmitNcDashboard() {
  const html = document.querySelector("#ncTabContent")?.innerHTML || "";
  const popup = window.open("", "_blank", "width=1440,height=900");
  if (!popup) return void toast("Permita pop-ups para abrir o painel de transmissão.");
  popup.opener = null;
  popup.document.write(`<!doctype html><html lang="pt-BR"><head><title>Painel de Não Conformidades</title><link rel="stylesheet" href="${location.origin}/styles.css"></head><body class="nc-tv"><main class="page-content nc-page-content"><h1>${escapeHtml(state.company.name)} · Não Conformidades</h1>${html}</main></body></html>`);
  popup.document.close();
}

function renderOperationalTable(moduleId) {
  if (moduleId === "documentos") {
    return dataTable("Documentos cadastrados", ["Código", "Título", "Versão", "Status", "Responsável"], state.documents);
  }
  if (moduleId === "auditorias") {
    return dataTable("Auditorias", ["Título", "Data", "Status", "Responsável"], state.audits);
  }
  if (moduleId === "nao-conformidades") {
    return dataTable("Não conformidades", ["Código", "Título", "Severidade", "Status", "Responsável"], state.ncs);
  }
  return `
    <article class="qp-card">
      <h3>Registros iniciais</h3>
      <p class="qp-muted">Este módulo já está navegável. Os formulários específicos serão conectados na próxima etapa.</p>
    </article>
  `;
}

const companyFieldMap = {
  fRazaoSocial: "name",
  fNomeFantasia: "tradeName",
  fCnpj: "cnpj",
  fSegmento: "segment",
  fPorte: "size",
  fCep: "cep",
  fCidadeUf: "cityUf",
  fEndereco: "address",
  fBairro: "district",
  fTelefone: "phone",
  fEmail: "email",
  fSite: "site",
  fRespNome: "legalResponsibleName",
  fRespCargo: "legalResponsibleRole",
};

const companyTabMeta = {
  dados: {
    title: "Dados da empresa",
    sub: "Essas informações aparecem no cabeçalho de documentos, relatórios e certificados emitidos pelo sistema.",
  },
  direcao: {
    title: "Alta Direção",
    sub: "Cadastro dos membros da alta direção e suas responsabilidades no SGQ.",
    newLabel: "Novo membro",
  },
  setores: {
    title: "Setores",
    sub: "Estrutura organizacional da empresa, por setor e responsável.",
    newLabel: "Novo setor",
  },
  fornecedores: {
    title: "Fornecedores Homologados",
    sub: "Fornecedores avaliados e aprovados para o fornecimento de produtos e serviços.",
    newLabel: "Novo fornecedor",
  },
  clientes: {
    title: "Clientes",
    sub: "Principais clientes atendidos pela empresa.",
    newLabel: "Novo cliente",
  },
};

const companyRegistrySeeds = {
  direcao: [
    { id: 1, nome: "Hugo Melo", cargo: "Diretor Geral / Executivo", email: "hugo.melo@qualitypro.com.br", telefone: "(11) 98888-0001", responsabilidades: "Liderança executiva do SGQ, definição da política e dos objetivos da qualidade e condução da análise crítica pela direção." },
    { id: 2, nome: "Carlos Andrade", cargo: "Gestor da Qualidade", email: "carlos.andrade@qualitypro.com.br", telefone: "(11) 98888-0002", responsabilidades: "Coordenação do sistema de gestão da qualidade, auditorias internas e tratamento de não conformidades." },
  ],
  setores: [
    { id: 1, nome: "Diretoria", responsavel: "Hugo Melo", colaboradores: 1, descricao: "Direção executiva e estratégica da empresa." },
    { id: 2, nome: "RH / Compras", responsavel: "Marina Souza", colaboradores: 1, descricao: "Gestão de pessoas, recrutamento e compras administrativas." },
    { id: 3, nome: "Engenharia / Qualidade", responsavel: "Carlos Andrade", colaboradores: 1, descricao: "Controle de processos, garantia da qualidade e melhoria contínua." },
    { id: 4, nome: "Comercial", responsavel: "Beatriz Santos", colaboradores: 1, descricao: "Relacionamento com clientes, propostas e contratos comerciais." },
    { id: 5, nome: "Financeiro", responsavel: "Rafael Costa", colaboradores: 1, descricao: "Controle financeiro, contas a pagar e a receber." },
    { id: 6, nome: "Auditoria Interna", responsavel: "João Pereira", colaboradores: 1, descricao: "Planejamento e execução das auditorias internas do SGQ." },
    { id: 7, nome: "Manutenção / TI", responsavel: "Eduardo Lima", colaboradores: 1, descricao: "Suporte técnico, infraestrutura e manutenção predial." },
  ],
  fornecedores: [
    { id: 1, nome: "Metalúrgica Rio Verde LTDA", cnpj: "", categoria: "Matéria-prima", contato: "contato@rioverde.com.br" },
    { id: 2, nome: "Calibra Serviços Técnicos", cnpj: "", categoria: "Calibração de equipamentos", contato: "atendimento@calibra.com.br" },
    { id: 3, nome: "LogExpress Transportes", cnpj: "", categoria: "Logística e transporte", contato: "comercial@logexpress.com.br" },
  ],
  clientes: [
    { id: 1, nome: "Indústrias Alfa S.A.", cnpj: "", segmento: "Indústria automotiva", contato: "qualidade@alfa.com.br" },
    { id: 2, nome: "Grupo Bemol Engenharia", cnpj: "", segmento: "Engenharia civil", contato: "contato@bemol.com.br" },
    { id: 3, nome: "Nortec Componentes", cnpj: "", segmento: "Componentes eletrônicos", contato: "compras@nortec.com.br" },
  ],
};

const companyRegistryModules = {
  direcao: {
    label: "membro da alta direção",
    countNoun: ["membro cadastrado", "membros cadastrados"],
    columns: [
      { label: "Nome", field: "nome" },
      { label: "Cargo / Função", field: "cargo" },
      { label: "E-mail", field: "email", muted: true },
      { label: "Telefone", field: "telefone", muted: true },
    ],
    fields: [
      [{ id: "nome", label: "Nome completo", type: "text", placeholder: "Ex.: Hugo Melo", required: true }],
      [{ id: "cargo", label: "Cargo / Função", type: "text", placeholder: "Ex.: Diretor Geral", required: true }, { id: "email", label: "E-mail", type: "email", placeholder: "nome@empresa.com.br" }],
      [{ id: "telefone", label: "Telefone", type: "text", placeholder: "(00) 00000-0000" }],
      [{ id: "responsabilidades", label: "Principais responsabilidades", type: "textarea", placeholder: "Ex.: Definição da política e dos objetivos da qualidade..." }],
    ],
  },
  setores: {
    label: "setor",
    countNoun: ["setor cadastrado", "setores cadastrados"],
    columns: [
      { label: "Setor", field: "nome" },
      { label: "Responsável", field: "responsavel" },
      { label: "Colab.", field: "colaboradores", mono: true },
      { label: "Descrição", field: "descricao", muted: true },
    ],
    fields: [
      [{ id: "nome", label: "Nome do setor", type: "text", placeholder: "Ex.: Engenharia / Qualidade", required: true }],
      [{ id: "responsavel", label: "Responsável pelo setor", type: "text", placeholder: "Ex.: Carlos Andrade" }, { id: "colaboradores", label: "Nº de colaboradores", type: "number", placeholder: "Ex.: 4" }],
      [{ id: "descricao", label: "Descrição das atividades", type: "textarea", placeholder: "Ex.: Responsável pelo controle de qualidade dos processos e produtos." }],
    ],
  },
  fornecedores: {
    label: "fornecedor",
    countNoun: ["fornecedor cadastrado", "fornecedores cadastrados"],
    columns: [
      { label: "Fornecedor", field: "nome" },
      { label: "CNPJ", field: "cnpj", muted: true, mono: true },
      { label: "Categoria", field: "categoria", muted: true },
      { label: "Contato", field: "contato", muted: true },
    ],
    fields: [
      [{ id: "nome", label: "Nome / Razão social", type: "text", placeholder: "Ex.: Metalúrgica Rio Verde LTDA", required: true }],
      [{ id: "cnpj", label: "CNPJ", type: "text", placeholder: "00.000.000/0000-00" }, { id: "categoria", label: "Categoria de fornecimento", type: "text", placeholder: "Ex.: Matéria-prima" }],
      [{ id: "contato", label: "Contato", type: "text", placeholder: "E-mail ou telefone" }],
    ],
  },
  clientes: {
    label: "cliente",
    countNoun: ["cliente cadastrado", "clientes cadastrados"],
    columns: [
      { label: "Cliente", field: "nome" },
      { label: "CNPJ", field: "cnpj", muted: true, mono: true },
      { label: "Segmento", field: "segmento", muted: true },
      { label: "Contato", field: "contato", muted: true },
    ],
    fields: [
      [{ id: "nome", label: "Nome / Razão social", type: "text", placeholder: "Ex.: Indústrias Alfa S.A.", required: true }],
      [{ id: "cnpj", label: "CNPJ", type: "text", placeholder: "00.000.000/0000-00" }, { id: "segmento", label: "Segmento", type: "text", placeholder: "Ex.: Indústria automotiva" }],
      [{ id: "contato", label: "Contato", type: "text", placeholder: "E-mail ou telefone" }],
    ],
  },
};

function normalizeCompanyRegistry(registry) {
  const source = registry && typeof registry === "object" ? registry : {};
  return Object.fromEntries(Object.keys(companyRegistryModules).map((key) => [key, Array.isArray(source[key]) ? source[key] : structuredClone(companyRegistrySeeds[key])]));
}

function getCompanyProfile() {
  state.company.registry = normalizeCompanyRegistry(state.company.registry);
  return state.company;
}

function companyFormValue(fieldId) {
  const value = getCompanyProfile()[companyFieldMap[fieldId]];
  return value == null ? "" : String(value);
}

async function persistCompanyProfile(message = "Dados da empresa salvos.") {
  if (!canManageCompany()) {
    toast("Você não tem permissão para alterar dados da empresa.");
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const response = await fetch("/api/company", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...state.company,
      plan: state.settings.companyAccess,
    }),
  });

  if (!response.ok) throw new Error("Falha ao salvar empresa.");
  const payload = await response.json();
  if (payload.state?.company) state.company = { ...state.company, ...payload.state.company };
  if (payload.state?.settings?.companyAccess) state.settings.companyAccess = payload.state.settings.companyAccess;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (message) toast(message);
}

function renderEmpresa() {
  setTopbar("Empresa", "Dados principais da organização");
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.classList.remove("leadership-page-content");
  pageContent.classList.add("company-page-content");
  pageContent.innerHTML = `
    <div class="page-toolbar company-toolbar">
      <div>
        <div class="welcome-eyebrow">MINHA EMPRESA</div>
        <h1 class="welcome-title" id="companyTabTitle">${escapeHtml(companyTabMeta[currentCompanyTab].title)}</h1>
        <p class="welcome-sub" id="companyTabSub">${escapeHtml(companyTabMeta[currentCompanyTab].sub)}</p>
      </div>
      <button type="button" class="btn-grad" id="companyNewBtn" data-company-new="${escapeHtml(currentCompanyTab)}" ${canManageCompany() ? "" : "hidden"}>
        ${moduleIcon("plus")}
        <span>${escapeHtml(companyTabMeta[currentCompanyTab].newLabel || "Novo")}</span>
      </button>
    </div>

    <div class="emp-tabbar" role="tablist">
      ${Object.entries(companyTabMeta).map(([key, item]) => `
        <button type="button" class="emp-tab-btn ${currentCompanyTab === key ? "active" : ""}" data-company-tab="${key}">
          ${moduleIcon(key === "dados" ? "documentos" : key === "direcao" ? "lideranca" : key === "setores" ? "modulos" : key === "fornecedores" ? "plano" : "contexto")}
          ${escapeHtml(item.title)}
        </button>
      `).join("")}
    </div>

    <section class="emp-section" id="companyPanel"></section>

    <div class="modal-overlay" id="companyModalOverlay">
      <div class="modal-box">
        <div class="modal-hd">
          <div>
            <h3 id="companyModalTitle">Novo registro</h3>
            <p id="companyModalSub">Preencha as informações abaixo.</p>
          </div>
          <button class="modal-close" data-company-modal-close type="button">${moduleIcon("close")}</button>
        </div>
        <div id="companyModalFields"></div>
        <div class="modal-actions">
          <button class="btn-ghost" data-company-modal-close type="button">Cancelar</button>
          <button class="btn-grad" data-company-save-record type="button">${moduleIcon("check-circle")} Salvar</button>
        </div>
      </div>
    </div>
  `;
  bindCompanyScreen();
  renderCompanyTab();
}

function bindCompanyScreen() {
  pageContent.querySelectorAll("[data-company-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      currentCompanyTab = button.dataset.companyTab;
      renderEmpresa();
    });
  });

  pageContent.querySelector("#companyNewBtn")?.addEventListener("click", () => {
    if (currentCompanyTab !== "dados") openCompanyRegistryModal(currentCompanyTab);
  });

  pageContent.querySelector("[data-company-modal-close]")?.addEventListener("click", closeCompanyRegistryModal);
  pageContent.querySelectorAll("[data-company-modal-close]").forEach((button) => button.addEventListener("click", closeCompanyRegistryModal));
  pageContent.querySelector("[data-company-save-record]")?.addEventListener("click", saveCompanyRegistryRecord);
}

function renderCompanyTab() {
  const newButton = pageContent.querySelector("#companyNewBtn");
  if (newButton) {
    newButton.style.display = currentCompanyTab === "dados" || !canManageCompany() ? "none" : "inline-flex";
    newButton.querySelector("span").textContent = companyTabMeta[currentCompanyTab].newLabel || "Novo";
  }

  const panel = pageContent.querySelector("#companyPanel");
  if (!panel) return;

  if (currentCompanyTab === "dados") {
    panel.innerHTML = renderCompanyForm();
    bindCompanyForm();
    renderCompanyLogo();
    return;
  }

  panel.innerHTML = renderCompanyRegistryTable(currentCompanyTab);
  bindCompanyTableActions();
}

function renderCompanyForm() {
  const editable = canManageCompany();
  return `
    <form class="empresa-form-card" id="companyForm">
      <div class="ef-logo-row">
        <div class="ef-logo-preview" id="logoPreview"></div>
        <div class="ef-logo-info">
          <div class="ef-logo-title">Logo da empresa</div>
          <div class="ef-logo-desc">PNG ou JPG, fundo transparente recomendado. Máx. 3MB.</div>
          <div class="ef-logo-actions" ${editable ? "" : "hidden"}>
            <label class="btn-ghost company-logo-btn">
              Enviar logo
              <input type="file" id="logoInput" accept="image/png,image/jpeg" hidden>
            </label>
            <button type="button" class="btn-ghost" id="logoRemoveBtn">Remover</button>
          </div>
        </div>
      </div>

      <div class="ef-form-grid">
        <div class="ef-form-column">
          ${companyFormSection("Dados gerais", `
            ${companyField("fRazaoSocial", "Razão social", "Ex.: QualityPro Solutions LTDA")}
            <div class="field field-row2">
              ${companyField("fNomeFantasia", "Nome fantasia", "Ex.: QualityPro Solutions", true)}
              ${companyField("fCnpj", "CNPJ", "00.000.000/0000-00", true)}
            </div>
            <div class="field field-row2">
              ${companyField("fSegmento", "Setor / Segmento de atuação", "Ex.: Consultoria em Gestão da Qualidade", true)}
              <div>
                <label for="fPorte">Porte da empresa</label>
                <select class="input-basic" id="fPorte" data-company-field="fPorte">
                  ${companySizeOptions(companyFormValue("fPorte"))}
                </select>
              </div>
            </div>
          `)}

          ${companyFormSection("Endereço", `
            <div class="field field-row2">
              ${companyField("fCep", "CEP", "00000-000", true)}
              ${companyField("fCidadeUf", "Cidade / UF", "Ex.: São Paulo / SP", true)}
            </div>
            <div class="field field-row2">
              ${companyField("fEndereco", "Logradouro e número", "Ex.: Av. Paulista, 1000 - Sala 12", true)}
              ${companyField("fBairro", "Bairro", "Ex.: Bela Vista", true)}
            </div>
          `, true)}
        </div>

        <div class="ef-form-column ef-form-column-right">
          ${companyFormSection("Contato", `
            <div class="field field-row2">
              ${companyField("fTelefone", "Telefone", "(00) 0000-0000", true)}
              ${companyField("fEmail", "E-mail corporativo", "contato@empresa.com.br", true, "email")}
            </div>
            ${companyField("fSite", "Site", "https://www.empresa.com.br")}
          `)}

          ${companyFormSection("Responsável legal", `
            <div class="field field-row2">
              ${companyField("fRespNome", "Nome do responsável", "Ex.: Hugo Melo", true)}
              ${companyField("fRespCargo", "Cargo", "Ex.: Diretor Geral", true)}
            </div>
          `, true)}

          <div class="ef-actions" ${editable ? "" : "hidden"}>
            <span class="ef-save-status" id="companySaveStatus"></span>
            <button type="submit" class="btn-grad">${moduleIcon("check-circle")} Salvar alterações</button>
          </div>
        </div>
      </div>
    </form>
  `.replaceAll("<input class=\"input-basic\"", `<input class="input-basic"${editable ? "" : " readonly"}`)
    .replaceAll("<select class=\"input-basic\"", `<select class="input-basic"${editable ? "" : " disabled"}`);
}

function companyFormSection(title, content, last = false) {
  return `<div class="ef-section ${last ? "last" : ""}"><div class="ef-section-title">${title}</div>${content}</div>`;
}

function companyField(id, label, placeholder, nested = false, type = "text") {
  const input = `<input class="input-basic" id="${id}" data-company-field="${id}" type="${type}" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(companyFormValue(id))}">`;
  const html = `<label for="${id}">${escapeHtml(label)}</label>${input}`;
  return nested ? `<div>${html}</div>` : `<div class="field">${html}</div>`;
}

function companySizeOptions(current) {
  const options = [
    ["mei", "MEI"],
    ["micro", "Microempresa"],
    ["pequena", "Pequena empresa"],
    ["media", "Média empresa"],
    ["grande", "Grande empresa"],
  ];
  return options.map(([value, label]) => `<option value="${value}" ${String(current || "pequena") === value ? "selected" : ""}>${label}</option>`).join("");
}

function bindCompanyForm() {
  pageContent.querySelector("#companyForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = pageContent.querySelector("#fRazaoSocial")?.value.trim();
    const cnpj = pageContent.querySelector("#fCnpj")?.value.trim();
    if (!name) {
      toast("Informe a razão social da empresa.");
      pageContent.querySelector("#fRazaoSocial")?.focus();
      return;
    }
    if (!cnpj) {
      toast("Informe o CNPJ da empresa.");
      pageContent.querySelector("#fCnpj")?.focus();
      return;
    }

    pageContent.querySelectorAll("[data-company-field]").forEach((field) => {
      state.company[companyFieldMap[field.dataset.companyField]] = field.value;
    });

    try {
      await persistCompanyProfile("");
      const status = pageContent.querySelector("#companySaveStatus");
      if (status) {
        status.textContent = "Dados salvos com sucesso.";
        status.classList.add("show");
        window.setTimeout(() => status.classList.remove("show"), 3000);
      }
      toast("Dados da empresa salvos.");
    } catch {
      toast("Não foi possível salvar os dados da empresa.");
    }
  });

  pageContent.querySelector("#logoInput")?.addEventListener("change", handleCompanyLogoChange);
  pageContent.querySelector("#logoRemoveBtn")?.addEventListener("click", async () => {
    state.company.logo = "";
    renderCompanyLogo();
    pageContent.querySelector("#logoInput").value = "";
    try {
      await persistCompanyProfile("Logo removida.");
    } catch {
      toast("Não foi possível remover a logo.");
    }
  });
}

function renderCompanyLogo() {
  const preview = pageContent.querySelector("#logoPreview");
  const removeBtn = pageContent.querySelector("#logoRemoveBtn");
  if (!preview || !removeBtn) return;
  if (state.company.logo) {
    preview.innerHTML = `<img src="${escapeHtml(state.company.logo)}" alt="Logo da empresa">`;
    removeBtn.style.display = "inline-flex";
  } else {
    preview.innerHTML = moduleIcon("documentos");
    removeBtn.style.display = "none";
  }
}

function handleCompanyLogoChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    toast("A imagem excede o limite de 3MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    state.company.logo = reader.result;
    renderCompanyLogo();
    try {
      await persistCompanyProfile("Logo salva.");
    } catch {
      toast("Não foi possível salvar a logo.");
    }
  });
  reader.readAsDataURL(file);
}

function renderCompanyRegistryTable(key) {
  const mod = companyRegistryModules[key];
  const records = getCompanyProfile().registry[key] || [];
  const showActions = canManageCompany();
  return `
    <div class="reg-section">
      <div class="reg-section-hd">
        <div>
          <h2>${escapeHtml(companyTabMeta[key].title)}</h2>
          <p>${records.length} ${escapeHtml(records.length === 1 ? mod.countNoun[0] : mod.countNoun[1])}</p>
        </div>
      </div>
      <div class="company-table-wrap">
        <table class="rtbl">
          <thead>
            <tr>${mod.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}${showActions ? "<th>Ações</th>" : ""}</tr>
          </thead>
          <tbody>
            ${records.map((record) => renderCompanyRegistryRow(key, record, showActions)).join("")}
          </tbody>
        </table>
      </div>
      ${records.length ? "" : `<div class="reg-empty">Nenhum ${escapeHtml(mod.label)} cadastrado ainda.</div>`}
    </div>
  `;
}

function renderCompanyRegistryRow(key, record, showActions = true) {
  const mod = companyRegistryModules[key];
  const cells = mod.columns.map((column) => {
    const value = record[column.field] || "-";
    const classes = [column.muted ? "muted-cell" : "", column.mono ? "mono" : ""].filter(Boolean).join(" ");
    return `<td class="${classes}">${escapeHtml(value)}</td>`;
  }).join("");
  return `
    <tr>
      ${cells}
      ${showActions ? `<td>
        <div class="r-actions">
          <button class="r-abtn" title="Editar" data-company-action="edit" data-company-key="${key}" data-company-id="${record.id}" type="button">${moduleIcon("edit")}</button>
          <button class="r-abtn danger" title="Excluir" data-company-action="delete" data-company-key="${key}" data-company-id="${record.id}" type="button">${moduleIcon("trash")}</button>
        </div>
      </td>` : ""}
    </tr>
  `;
}

function bindCompanyTableActions() {
  pageContent.querySelectorAll("[data-company-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.companyKey;
      const id = Number(button.dataset.companyId);
      if (button.dataset.companyAction === "edit") openCompanyRegistryModal(key, id);
      if (button.dataset.companyAction === "delete") deleteCompanyRegistryRecord(key, id);
    });
  });
}

function renderCompanyModalField(field, record) {
  const value = record?.[field.id] || "";
  const control = field.type === "textarea"
    ? `<textarea class="input-basic" id="companyModal_${field.id}" placeholder="${escapeHtml(field.placeholder || "")}">${escapeHtml(value)}</textarea>`
    : `<input class="input-basic" id="companyModal_${field.id}" type="${field.type || "text"}" placeholder="${escapeHtml(field.placeholder || "")}" value="${escapeHtml(value)}">`;
  return `<label for="companyModal_${field.id}">${escapeHtml(field.label)}</label>${control}`;
}

function openCompanyRegistryModal(key, id = null) {
  if (!canManageCompany()) {
    toast("Você não tem permissão para alterar dados da empresa.");
    return;
  }

  const mod = companyRegistryModules[key];
  const record = id ? getCompanyProfile().registry[key].find((item) => Number(item.id) === Number(id)) : null;
  currentCompanyModalKey = key;
  currentCompanyEditId = id;

  pageContent.querySelector("#companyModalTitle").textContent = `${id ? "Editar" : "Novo"} ${mod.label}`;
  pageContent.querySelector("#companyModalSub").textContent = id ? "Atualize as informações do registro." : "Preencha as informações do novo registro.";
  pageContent.querySelector("#companyModalFields").innerHTML = mod.fields.map((row) => {
    if (row.length === 1) return `<div class="field">${renderCompanyModalField(row[0], record)}</div>`;
    return `<div class="field field-row2">${row.map((field) => `<div>${renderCompanyModalField(field, record)}</div>`).join("")}</div>`;
  }).join("");
  pageContent.querySelector("#companyModalOverlay").classList.add("show");
}

function closeCompanyRegistryModal() {
  pageContent.querySelector("#companyModalOverlay")?.classList.remove("show");
  currentCompanyModalKey = "";
  currentCompanyEditId = null;
}

async function saveCompanyRegistryRecord() {
  if (!canManageCompany()) {
    toast("Você não tem permissão para alterar dados da empresa.");
    return;
  }

  const mod = companyRegistryModules[currentCompanyModalKey];
  if (!mod) return;
  const fields = mod.fields.flat();

  for (const field of fields) {
    const element = pageContent.querySelector(`#companyModal_${field.id}`);
    if (field.required && !element.value.trim()) {
      toast(`Preencha o campo "${field.label}".`);
      element.focus();
      return;
    }
  }

  const data = Object.fromEntries(fields.map((field) => [field.id, pageContent.querySelector(`#companyModal_${field.id}`).value]));
  const registry = getCompanyProfile().registry;
  if (currentCompanyEditId) {
    registry[currentCompanyModalKey] = registry[currentCompanyModalKey].map((item) => (
      Number(item.id) === Number(currentCompanyEditId) ? { ...item, ...data } : item
    ));
  } else {
    const nextId = registry[currentCompanyModalKey].reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
    registry[currentCompanyModalKey].push({ id: nextId, ...data });
  }

  try {
    await persistCompanyProfile("Registro salvo.");
    closeCompanyRegistryModal();
    renderCompanyTab();
  } catch {
    toast("Não foi possível salvar o registro.");
  }
}

async function deleteCompanyRegistryRecord(key, id) {
  if (!canManageCompany()) {
    toast("Você não tem permissão para alterar dados da empresa.");
    return;
  }

  const registry = getCompanyProfile().registry;
  const record = registry[key].find((item) => Number(item.id) === Number(id));
  if (!record) return;
  if (!window.confirm(`Remover "${record.nome || "este registro"}"? Essa ação não pode ser desfeita.`)) return;

  registry[key] = registry[key].filter((item) => Number(item.id) !== Number(id));
  try {
    await persistCompanyProfile("Registro excluído.");
    renderCompanyTab();
  } catch {
    toast("Não foi possível excluir o registro.");
  }
}

async function renderUsuarios() {
  const canManage = canManageUsers();
  if (!canManage) {
    toast("Seu perfil não possui permissão para gerenciar usuários.");
    render("inicio");
    return;
  }
  setTopbar("Usuários", "Controle de acesso da equipe");
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.classList.remove("leadership-page-content");
  pageContent.classList.add("users-page-content");
  pageContent.innerHTML = `
    <div class="page-toolbar company-toolbar">
      <div>
        <div class="welcome-eyebrow">MINHA EMPRESA · CONTROLE DE ACESSO</div>
        <h1 class="welcome-title">Usuários</h1>
        <p class="welcome-sub">Gerencie contas, cargos e permissões de acesso ao SGQ Online.</p>
      </div>
      <button class="btn-grad" data-user-action="new" type="button" ${canManage ? "" : "hidden"}>
        ${moduleIcon("plus")}
        Novo usuário
      </button>
    </div>

    <div class="kpi-row users-kpi-row" id="usersKpiRow"></div>

    <section class="users-section">
      <div class="users-section-hd">
        <div>
          <h2 class="section-title">Todos os usuários</h2>
          <p class="section-sub" id="usersCountLabel">Carregando usuários...</p>
        </div>
        <div class="users-filters">
          <div class="search-wrap">
            ${moduleIcon("search")}
            <input type="text" id="usersSearchInput" placeholder="Buscar por nome ou login...">
          </div>
          <select class="filter-select" id="usersStatusFilter">
            <option value="todos">Todos os status</option>
            <option value="Ativo">Ativos</option>
            <option value="Bloqueado">Inativos</option>
            <option value="Pendente">Pendentes</option>
          </select>
        </div>
      </div>
      <div class="users-table-wrap">
        <table class="utbl">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Departamento</th>
              <th>Papel</th>
              <th>Status</th>
              <th>Último acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="usersTbody"></tbody>
        </table>
      </div>
      <div class="users-empty" id="usersEmpty" hidden>Nenhum usuário encontrado para esse filtro.</div>
    </section>

    <div class="modal-overlay" id="userModalOverlay">
      <div class="modal-box wide">
        <div class="modal-hd">
          <div>
            <h3 id="userModalTitle">Novo usuário</h3>
            <p>Preencha os dados de acesso do membro da equipe.</p>
          </div>
          <button class="modal-close" data-user-modal-close type="button">${moduleIcon("close")}</button>
        </div>
        <div class="field">
          <label for="userNameField">Nome completo</label>
          <input class="input-basic" id="userNameField" type="text" placeholder="Ex.: Marina Souza">
        </div>
        <div class="field">
          <label for="userLoginField">Login / e-mail</label>
          <input class="input-basic" id="userLoginField" type="email" placeholder="nome@empresa.com.br">
        </div>
        <div class="field field-row2">
          <div>
            <label for="userDepartmentField">Departamento</label>
            <select class="input-basic" id="userDepartmentField">
              ${userDepartmentOptions()}
            </select>
          </div>
          <div>
            <label for="userRoleField">Papel</label>
            <select class="input-basic" id="userRoleField">
              ${userRoleOptions()}
            </select>
          </div>
        </div>
        <div class="field">
          <div>
            <label for="userStatusField">Status</label>
            <select class="input-basic" id="userStatusField">
              <option value="Ativo">Ativo</option>
              <option value="Bloqueado">Inativo</option>
              <option value="Pendente">Pendente (convite enviado)</option>
            </select>
          </div>
        </div>
        <div class="invite-flow-note">Ao criar a conta, o usuário receberá um convite de uso único por e-mail para definir a própria senha.</div>
        <div class="permission-box">
          <div class="permission-title">Permissões</div>
          <label><input type="checkbox" data-user-permission="modules" checked> Acessar módulos do SGQ</label>
          <label><input type="checkbox" data-user-permission="reports"> Visualizar relatórios</label>
          <label><input type="checkbox" data-user-permission="manageUsers" ${canManageCompany() ? "" : "disabled"}> Gerenciar usuários da empresa</label>
          <div class="permission-title module-permission-title">Acesso por módulo</div>
          <div class="module-permission-grid">
            ${modules.map((module) => `
              <label class="module-permission-row">
                <span>${escapeHtml(module.title)}</span>
                <select class="input-basic" data-user-module-permission="${module.id}">
                  <option value="none">Sem acesso</option>
                  <option value="view">Visualizar</option>
                  <option value="edit">Editar</option>
                </select>
              </label>
            `).join("")}
          </div>
          <p>A permissão de editar módulos não libera alterações nos dados cadastrais da empresa.</p>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" data-user-modal-close type="button">Cancelar</button>
          <button class="btn-grad" data-user-save type="button">${moduleIcon("check-circle")} Salvar usuário</button>
        </div>
      </div>
    </div>
  `;

  bindUsersScreen();
  await loadCompanyUsers();
}

function bindUsersScreen() {
  pageContent.querySelector("[data-user-action='new']")?.addEventListener("click", () => openCompanyUserModal());
  pageContent.querySelectorAll("[data-user-modal-close]").forEach((button) => button.addEventListener("click", closeCompanyUserModal));
  pageContent.querySelector("[data-user-save]")?.addEventListener("click", saveCompanyUser);
  pageContent.querySelector("#usersSearchInput")?.addEventListener("input", renderCompanyUsersTable);
  pageContent.querySelector("#usersStatusFilter")?.addEventListener("change", renderCompanyUsersTable);
  pageContent.querySelector("#userRoleField")?.addEventListener("change", (event) => {
    applyPermissionDefaultsForRole(event.currentTarget.value);
  });
}

async function loadCompanyUsers() {
  try {
    const response = await fetch("/api/company/users", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Falha ao carregar usuários.");
    const payload = await response.json();
    companyUsersData = (payload.users || []).map(normalizeCompanyUser);
    syncStateUsersFromCompanyUsers();
    renderUsersKpis();
    renderCompanyUsersTable();
  } catch (error) {
    console.warn(error);
    companyUsersData = (state.users || []).map((user, index) => normalizeCompanyUser({
      id: index + 1,
      displayName: user.name,
      username: user.email,
      role: user.role,
      status: user.status,
    }));
    renderUsersKpis();
    renderCompanyUsersTable();
    toast("Não foi possível carregar usuários do banco.");
  }
}

function normalizeCompanyUser(user) {
  const role = user.role || "Colaborador";
  return {
    ...user,
    displayName: user.displayName || user.name || "Usuário",
    username: user.username || user.email || "",
    department: user.department || departmentFromRole(role),
    role,
    status: normalizeUserStatus(user.status),
    permissions: normalizeUserPermissions(role, user.permissions),
  };
}

function syncStateUsersFromCompanyUsers() {
  state.users = companyUsersData.map((user) => ({
    name: user.displayName,
    email: user.username,
    role: user.role,
    status: user.status === "Bloqueado" ? "Inativo" : user.status,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (canManageCompany()) saveRemoteData("state", state);
}

function userDepartmentOptions(selected = "RH / Compras") {
  const departments = getCompanyProfile().registry.setores?.map((item) => item.nome).filter(Boolean) || [];
  const options = departments.length ? departments : ["Diretoria", "RH / Compras", "Engenharia / Qualidade", "Comercial", "Financeiro", "Auditoria Interna", "Manutenção / TI"];
  return [...new Set(options)].map((item) => `<option ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
}

function userRoleOptions(selected = "Colaborador") {
  const roles = ["Administrador", "Gestor", "Colaborador", "Auditor", "Consulta", "Qualidade"];
  return roles
    .filter((role) => canManageCompany() || role !== "Administrador" || role === selected)
    .map((item) => `<option value="${item}" ${item === selected ? "selected" : ""}>${item}</option>`)
    .join("");
}

function departmentFromRole(role) {
  if (role === "Administrador") return "Diretoria";
  if (role === "Auditor") return "Auditoria Interna";
  if (role === "Qualidade" || role === "Gestor") return "Engenharia / Qualidade";
  return "RH / Compras";
}

function defaultUserPermissions(role) {
  const editAll = ["Administrador", "Gestor", "Qualidade"].includes(role);
  const moduleAccess = Object.fromEntries(modules.map((module) => {
    if (editAll) return [module.id, "edit"];
    if (role === "Auditor" && module.id === "auditorias") return [module.id, "edit"];
    return [module.id, "view"];
  }));
  return {
    modules: true,
    reports: ["Administrador", "Gestor", "Qualidade"].includes(role),
    manageUsers: role === "Administrador",
    moduleAccess,
  };
}

function normalizeUserPermissions(role, permissions = {}) {
  const defaults = defaultUserPermissions(role);
  const modulesEnabled = permissions.modules === undefined ? defaults.modules : Boolean(permissions.modules);
  return {
    modules: modulesEnabled,
    reports: permissions.reports === undefined ? defaults.reports : Boolean(permissions.reports),
    manageUsers: permissions.manageUsers === undefined ? defaults.manageUsers : Boolean(permissions.manageUsers),
    moduleAccess: Object.fromEntries(modules.map((module) => {
      const access = permissions.moduleAccess?.[module.id] || defaults.moduleAccess[module.id];
      return [module.id, modulesEnabled && ["none", "view", "edit"].includes(access) ? access : "none"];
    })),
  };
}

function applyPermissionDefaultsForRole(role) {
  const permissions = defaultUserPermissions(role);
  pageContent.querySelectorAll("[data-user-permission]").forEach((checkbox) => {
    checkbox.checked = Boolean(permissions[checkbox.dataset.userPermission]);
  });
  pageContent.querySelectorAll("[data-user-module-permission]").forEach((select) => {
    select.value = permissions.moduleAccess[select.dataset.userModulePermission] || "none";
  });
}

function normalizeUserStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("pendente")) return "Pendente";
  if (value.includes("bloque") || value.includes("inativo")) return "Bloqueado";
  return "Ativo";
}

function renderUsersKpis() {
  const total = companyUsersData.length;
  const active = companyUsersData.filter((user) => user.status === "Ativo").length;
  const admins = companyUsersData.filter((user) => user.role === "Administrador").length;
  const pending = companyUsersData.filter((user) => user.status === "Pendente").length;
  const kpis = [
    { label: "Total de usuários", value: total, accent: "#2f8ff0", icon: "contexto", caption: "Contas cadastradas", muted: true },
    { label: "Usuários ativos", value: active, accent: "#34D399", icon: "auditorias", caption: `${total ? Math.round((active / total) * 100) : 0}% da equipe` },
    { label: "Administradores", value: admins, accent: "#46D9F5", icon: "plano", caption: "Acesso total ao sistema", muted: true },
    { label: "Convites pendentes", value: pending, accent: "#FBBF24", icon: "notificacoes", caption: pending ? "Aguardando primeiro acesso" : "Nenhum convite em aberto", muted: true },
  ];

  const row = pageContent.querySelector("#usersKpiRow");
  if (!row) return;
  row.innerHTML = kpis.map((item) => `
    <article class="kpi-card" style="--accent-line:${item.accent};">
      <div class="kpi-top">
        <div class="kpi-icon" style="border-color:${hexToRgba(item.accent, 0.4)}; color:${item.accent};">${moduleIcon(item.icon)}</div>
        <div><div class="kpi-label">${escapeHtml(item.label)}</div><div class="kpi-value big">${item.value}</div></div>
      </div>
      <div class="kpi-caption ${item.muted ? "muted" : ""}">${escapeHtml(item.caption)}</div>
    </article>
  `).join("");
}

function renderCompanyUsersTable() {
  const search = pageContent.querySelector("#usersSearchInput")?.value.trim().toLowerCase() || "";
  const statusFilter = pageContent.querySelector("#usersStatusFilter")?.value || "todos";
  const filtered = companyUsersData.filter((user) => {
    const matchesSearch = !search || user.displayName.toLowerCase().includes(search) || user.username.toLowerCase().includes(search);
    const matchesStatus = statusFilter === "todos" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const count = pageContent.querySelector("#usersCountLabel");
  if (count) count.textContent = `${companyUsersData.length} ${companyUsersData.length === 1 ? "usuário cadastrado" : "usuários cadastrados"}`;

  const tbody = pageContent.querySelector("#usersTbody");
  const empty = pageContent.querySelector("#usersEmpty");
  if (!tbody || !empty) return;
  if (!filtered.length) {
    tbody.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  tbody.innerHTML = filtered.map((user) => renderCompanyUserRow(user)).join("");
  pageContent.querySelectorAll("[data-user-row-action]").forEach((button) => {
    button.addEventListener("click", () => handleCompanyUserAction(button));
  });
}

function renderCompanyUserRow(user) {
  const status = userStatusMeta(user.status);
  const showActions = canManageUsers() && (canManageCompany() || user.role !== "Administrador");
  return `
    <tr class="${user.status === "Bloqueado" ? "inactive-row" : ""}">
      <td>
        <div class="u-cell">
          <div class="u-avatar" style="background:${avatarColor(user.id)};">${escapeHtml(initials(user.displayName))}</div>
          <div><div class="u-name">${escapeHtml(user.displayName)}</div><div class="u-email">${escapeHtml(user.username)}</div></div>
        </div>
      </td>
      <td>${escapeHtml(user.department)}</td>
      <td><span class="role-badge ${roleClass(user.role)}">${escapeHtml(user.role)}</span></td>
      <td><span class="status-pill ${status.cls}"><span class="status-dot2"></span>${escapeHtml(status.label)}</span></td>
      <td class="last-access">${escapeHtml(user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Nunca acessou")}</td>
      ${showActions ? `<td>
        <div class="u-actions">
          <button class="u-abtn" title="Editar" data-user-row-action="edit" data-user-id="${user.id}" type="button">${moduleIcon("edit")}</button>
          <button class="u-abtn" title="Permissões" data-user-row-action="permissions" data-user-id="${user.id}" type="button">${moduleIcon("key")}</button>
          ${user.status === "Pendente" ? `<button class="u-abtn" title="Reenviar convite" data-user-row-action="resend" data-user-id="${user.id}" type="button">${moduleIcon("mail")}</button>` : ""}
          <button class="u-abtn danger" title="Excluir" data-user-row-action="delete" data-user-id="${user.id}" type="button">${moduleIcon("trash")}</button>
        </div>
      </td>` : "<td>-</td>"}
    </tr>
  `;
}

function avatarColor(id) {
  const colors = ["#4fa3ff", "#46D9F5", "#F2B705", "#34D399", "#FBBF24", "#F87171", "#A78BFA"];
  return colors[Number(id || 0) % colors.length];
}

function roleClass(role) {
  const normalized = String(role || "").toLowerCase();
  if (normalized.includes("admin")) return "role-admin";
  if (normalized.includes("gestor") || normalized.includes("qualidade")) return "role-gestor";
  if (normalized.includes("auditor")) return "role-auditor";
  return "role-colab";
}

function userStatusMeta(status) {
  if (status === "Ativo") return { cls: "st-active", label: "Ativo" };
  if (status === "Pendente") return { cls: "st-pending", label: "Pendente" };
  return { cls: "st-inactive", label: "Inativo" };
}

function handleCompanyUserAction(button) {
  const user = companyUsersData.find((item) => Number(item.id) === Number(button.dataset.userId));
  if (!user) return;
  if (button.dataset.userRowAction === "edit") {
    openCompanyUserModal(user.id);
    return;
  }
  if (button.dataset.userRowAction === "permissions") {
    toast(`Permissões de ${user.displayName}: ${describePermissions(user.permissions)}.`);
    return;
  }
  if (button.dataset.userRowAction === "resend") {
    resendCompanyUserInvitation(user);
    return;
  }
  deleteCompanyUser(user);
}

function describePermissions(permissions) {
  const labels = [];
  const editCount = Object.values(permissions?.moduleAccess || {}).filter((access) => access === "edit").length;
  const viewCount = Object.values(permissions?.moduleAccess || {}).filter((access) => access === "view").length;
  if (permissions?.modules) labels.push(`${editCount} para editar e ${viewCount} para visualizar`);
  if (permissions?.reports) labels.push("relatórios");
  if (permissions?.manageUsers) labels.push("usuários");
  return labels.length ? labels.join(", ") : "sem permissões adicionais";
}

function openCompanyUserModal(id = null) {
  if (!canManageUsers()) {
    toast("Você não tem permissão para gerenciar usuários.");
    return;
  }

  const user = id ? companyUsersData.find((item) => Number(item.id) === Number(id)) : null;
  editingCompanyUserId = id;
  pageContent.querySelector("#userModalTitle").textContent = id ? "Editar usuário" : "Novo usuário";
  pageContent.querySelector("#userNameField").value = user?.displayName || "";
  pageContent.querySelector("#userLoginField").value = user?.username || "";
  pageContent.querySelector("#userDepartmentField").innerHTML = userDepartmentOptions(user?.department);
  pageContent.querySelector("#userRoleField").innerHTML = userRoleOptions(user?.role);
  pageContent.querySelector("#userStatusField").value = user?.status || "Pendente";
  const permissions = normalizeUserPermissions(user?.role || "Colaborador", user?.permissions);
  pageContent.querySelectorAll("[data-user-permission]").forEach((checkbox) => {
    checkbox.checked = Boolean(permissions[checkbox.dataset.userPermission]);
  });
  pageContent.querySelectorAll("[data-user-module-permission]").forEach((select) => {
    select.value = permissions.moduleAccess[select.dataset.userModulePermission] || "none";
  });
  pageContent.querySelector("#userModalOverlay").classList.add("show");
}

function closeCompanyUserModal() {
  pageContent.querySelector("#userModalOverlay")?.classList.remove("show");
  editingCompanyUserId = null;
}

async function saveCompanyUser() {
  if (!canManageUsers()) {
    toast("Você não tem permissão para gerenciar usuários.");
    return;
  }

  const displayName = pageContent.querySelector("#userNameField").value.trim();
  const username = pageContent.querySelector("#userLoginField").value.trim();
  const department = pageContent.querySelector("#userDepartmentField").value;
  const role = pageContent.querySelector("#userRoleField").value;
  const status = pageContent.querySelector("#userStatusField").value;
  const permissions = Object.fromEntries([...pageContent.querySelectorAll("[data-user-permission]")].map((checkbox) => [checkbox.dataset.userPermission, checkbox.checked]));
  permissions.moduleAccess = Object.fromEntries(
    [...pageContent.querySelectorAll("[data-user-module-permission]")]
      .map((select) => [select.dataset.userModulePermission, select.value]),
  );

  if (!displayName || !username) {
    toast("Preencha nome e login para continuar.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
    toast("Informe um e-mail válido para enviar o convite.");
    return;
  }

  const isEditing = Boolean(editingCompanyUserId);
  const currentPassword = await confirmSensitiveAction(
    isEditing ? "Atualizar acesso do usuário" : "Convidar novo usuário",
  );
  if (!currentPassword) return;

  const method = editingCompanyUserId ? "PATCH" : "POST";
  const body = {
    userId: editingCompanyUserId,
    username,
    displayName,
    department,
    role,
    status,
    currentPassword,
    permissions,
  };

  const response = await fetch("/api/company/users", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    if (result.error === "access_limit_reached") {
      toast("O limite de acessos do plano foi atingido.");
      return;
    }
    const messages = {
      400: "Verifique os dados do usuário.",
      409: "Já existe um usuário com esse login.",
    };
    toast(messages[response.status] || "Não foi possível salvar o usuário.");
    return;
  }

  const result = await response.json().catch(() => ({}));
  closeCompanyUserModal();
  toast(
    isEditing
      ? "Usuário atualizado."
      : result.invitation?.delivery === "sent"
        ? "Convite enviado por e-mail."
        : "Usuário criado. Configure o e-mail do sistema para entregar o convite.",
  );
  await loadCompanyUsers();
}

async function resendCompanyUserInvitation(user) {
  const currentPassword = await confirmSensitiveAction("Reenviar convite de acesso");
  if (!currentPassword) return;
  const response = await fetch("/api/company/users/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, currentPassword }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    toast(result.error === "password_confirmation_required" ? "Senha atual incorreta." : "Não foi possível reenviar o convite.");
    return;
  }
  toast(result.invitation?.delivery === "sent" ? "Convite reenviado." : "Convite renovado, mas o envio de e-mail não está configurado.");
}

async function deleteCompanyUser(user) {
  if (!canManageUsers()) {
    toast("Você não tem permissão para gerenciar usuários.");
    return;
  }

  if (Number(user.id) === Number(currentUser?.id)) {
    toast("Você não pode excluir seu próprio acesso.");
    return;
  }
  if (!window.confirm(`Remover o acesso de "${user.displayName}"? Essa ação não pode ser desfeita.`)) return;
  const currentPassword = await confirmSensitiveAction("Excluir acesso do usuário");
  if (!currentPassword) return;

  const response = await fetch("/api/company/users", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, currentPassword }),
  });

  if (!response.ok) {
    toast("Não foi possível excluir o usuário.");
    return;
  }

  toast("Usuário excluído.");
  await loadCompanyUsers();
}

function renderNotificacoes() {
  setTopbar("Notificações", "Pendências e alertas do SGQ");
  pageContent.innerHTML = `
    ${viewHeader("Notificações", "Acompanhe alertas importantes do sistema.")}
    <div class="qp-card">
      <ul class="qp-list strong">
        ${state.notifications.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderRelatorios() {
  setTopbar("Relatórios", "Indicadores e exportações");
  ensureContextData();
  ensureRiskData();
  ensureLeadershipData();
  const contextRecords =
    contextGet("swot").length + contextGet("partes").length + contextGet("processos").length;
  const riskRecords = riskGet("riscos").length + riskGet("objetivos").length + riskGet("mudancas").length;
  const leadershipRecords =
    leadershipGet("acoes").length + leadershipGet("plano").length + leadershipGet("cargos").length;
  pageContent.innerHTML = `
    ${viewHeader("Relatórios", "Resumo executivo dos dados cadastrados no SGQ.")}
    <div class="qp-grid metrics">
      ${metric("Contexto", contextRecords)}
      ${metric("Riscos e objetivos", riskRecords)}
      ${metric("Liderança", leadershipRecords)}
      ${metric("Usuários", state.users.length)}
    </div>
    <section class="report-export-grid">
      ${reportExportCard("Relatório completo", "PDF", "Documento pronto para visualizar, imprimir ou compartilhar.", "pdf", "documentos")}
      ${reportExportCard("Planilha completa", "Excel", "Abas separadas para empresa, usuários e registros dos módulos.", "xlsx", "relatorios")}
      ${reportExportCard("Backup da empresa", "JSON", "Cópia técnica dos dados da empresa, sem armazenar senhas.", "json", "shield")}
    </section>
    <article class="qp-card report-note">
      <h3>Dados incluídos</h3>
      <p class="qp-muted">Os arquivos são gerados no momento do download com os dados salvos no banco: empresa, usuários, contexto, riscos, objetivos, liderança, documentos, auditorias e não conformidades.</p>
    </article>
  `;
}

function reportExportCard(title, format, description, queryFormat, icon) {
  return `
    <article class="qp-card report-export-card">
      <div class="report-export-icon">${moduleIcon(icon)}</div>
      <div>
        <span class="report-format">${escapeHtml(format)}</span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
      <a class="btn-primary report-download" href="/api/export?format=${encodeURIComponent(queryFormat)}">${moduleIcon("download")} Baixar ${escapeHtml(format)}</a>
    </article>
  `;
}

async function renderGerenciamento() {
  setTopbar("Gerenciamento", "Clientes, planos e acessos do SGQ Online");
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.innerHTML = `
    ${viewHeader("Gerenciamento", "Acompanhe clientes pagantes, acessos ativos e usuários cadastrados automaticamente.")}
    <div class="admin-loading qp-card">Carregando dados de gerenciamento...</div>
  `;

  try {
    const [response, operationsResponse] = await Promise.all([
      fetch("/api/admin/overview", { headers: { Accept: "application/json" }, cache: "no-store" }),
      fetch("/api/admin/operations", { headers: { Accept: "application/json" }, cache: "no-store" }),
    ]);
    if (response.status === 403) {
      pageContent.innerHTML = `${viewHeader("Acesso restrito", "Esta área está disponível somente para o administrador.")}`;
      return;
    }
    if (!response.ok) throw new Error("Falha ao carregar gerenciamento.");

    const data = await response.json();
    data.operations = operationsResponse.ok ? await operationsResponse.json() : null;
    pageContent.innerHTML = adminOverviewHtml(data);
    bindAdminActions();
  } catch (error) {
    console.warn(error);
    pageContent.innerHTML = `
      ${viewHeader("Gerenciamento", "Clientes, planos e acessos do SGQ Online.")}
      <article class="qp-card">
        <h3>Não foi possível carregar</h3>
        <p class="qp-muted">Verifique se o servidor local está rodando e tente novamente.</p>
      </article>
    `;
  }
}

function adminOverviewHtml(data) {
  const summary = data.summary || {};
  const companies = data.companies || [];
  const users = data.users || [];
  const logs = data.logs || [];
  const operations = data.operations || null;

  return `
    ${viewHeader("Gerenciamento", "Acompanhe clientes pagantes, acessos ativos e usuários cadastrados automaticamente.")}

    <div class="admin-kpi-row">
      ${adminMetric("Clientes", summary.companies || 0, "empresas cadastradas")}
      ${adminMetric("Pagantes", summary.payingCompanies || 0, "empresas com plano pago")}
      ${adminMetric("Acessos", summary.accesses || 0, "usuários cadastrados")}
      ${adminMetric("Ativos", summary.activeAccesses || 0, "acessos ativos")}
      ${adminMetric("Bloqueados", summary.blockedAccesses || 0, "acessos bloqueados")}
      ${adminMetric("Entradas 24h", summary.successfulLogins24h || 0, "logins realizados")}
      ${adminMetric("Falhas 24h", summary.failedLogins24h || 0, "tentativas recusadas")}
      ${adminMetric("Disponibilidade", "Online", "banco e autenticação ativos")}
    </div>

    ${operations ? operationsPanelHtml(operations) : ""}

    <div class="admin-toolbar qp-card">
      <label>
        <span>Buscar no gerenciamento</span>
        <input class="input-basic" type="search" data-admin-search placeholder="Empresa, usuário, login ou plano" />
      </label>
      <a class="btn-primary" href="/api/admin/backup">${moduleIcon("download")} Backup geral</a>
    </div>

    <div class="admin-form-grid">
      ${adminCompanyFormHtml()}
      ${adminUserFormHtml(companies)}
    </div>

    <section class="qp-card admin-card">
      <div class="dcc-head">
        <div>
          <div class="dcc-title">Clientes e planos</div>
          <div class="dcc-sub">Planos, pagamentos e ocupação dos acessos de cada empresa.</div>
        </div>
      </div>
      <div class="admin-table-wrap">
        <table class="data-table">
          <thead><tr><th>Empresa</th><th>Plano</th><th>Pagamento</th><th>Acessos</th><th>Última atividade</th><th>Ações</th></tr></thead>
          <tbody>
            ${companies.length ? companies.map((company) => `
              <tr data-admin-search-row="${escapeHtml(`${company.name} ${company.cnpj || ""} ${company.plan || ""} ${company.billingStatus || ""}`.toLowerCase())}">
                <td><strong>${escapeHtml(company.name)}</strong></td>
                <td>${planBadge(company.plan)}</td>
                <td>${billingBadge(company.billingStatus)}</td>
                <td>${Number(company.active_access_count || 0)} ativos / ${Number(company.access_count || 0)} de ${Number(company.accessLimit || 5)}</td>
                <td>${formatDateTime(company.last_activity_at)}</td>
                <td>
                  <button class="abtn" data-admin-action="edit-company" data-company='${adminPayload(company)}' type="button" title="Editar cliente">${moduleIcon("edit")}</button>
                  <a class="abtn" href="/api/admin/backup?companyId=${company.id}" title="Backup desta empresa">${moduleIcon("download")}</a>
                </td>
              </tr>
            `).join("") : `<tr><td colspan="6"><div class="empty-state">Nenhum cliente cadastrado.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>

    <section class="qp-card admin-card">
      <div class="dcc-head">
        <div>
          <div class="dcc-title">Usuários e acessos</div>
          <div class="dcc-sub">Todo usuário cadastrado no banco aparece automaticamente aqui.</div>
        </div>
      </div>
      <div class="admin-table-wrap">
        <table class="data-table">
          <thead><tr><th>Usuário</th><th>Login</th><th>Empresa</th><th>Perfil</th><th>Último acesso</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            ${users.length ? users.map((user) => `
              <tr data-admin-search-row="${escapeHtml(`${user.displayName} ${user.username} ${user.companyName} ${user.role} ${user.status}`.toLowerCase())}">
                <td><strong>${escapeHtml(user.displayName)}</strong></td>
                <td>${escapeHtml(user.username)}</td>
                <td>${escapeHtml(user.companyName)}</td>
                <td>${escapeHtml(user.role)}</td>
                <td>${formatDateTime(user.lastLoginAt)}</td>
                <td><span class="status-pill ${statusClass(user.status)}"><span class="status-dot2"></span>${escapeHtml(user.status)}</span></td>
                <td>
                  <button class="abtn" data-admin-action="edit-user" data-user='${adminPayload(user)}' type="button" title="Editar usuário">${moduleIcon("edit")}</button>
                  ${user.status === "Pendente"
                    ? `<button class="abtn" data-admin-action="resend-invite" data-user-id="${user.id}" data-user-name="${escapeHtml(user.displayName)}" type="button" title="Reenviar convite">${moduleIcon("mail")}</button>`
                    : `<button class="abtn" data-admin-action="toggle-user" data-user-id="${user.id}" data-user-status="${escapeHtml(user.status)}" data-user-name="${escapeHtml(user.displayName)}" type="button" title="${user.status === "Ativo" ? "Bloquear acesso" : "Liberar acesso"}">${moduleIcon("shield")}</button>`}
                  <button class="abtn" data-admin-action="reset-password" data-user-id="${user.id}" data-user-name="${escapeHtml(user.displayName)}" type="button" title="Resetar senha">${moduleIcon("key")}</button>
                </td>
              </tr>
            `).join("") : `<tr><td colspan="6"><div class="empty-state">Nenhum usuário cadastrado.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>

    <section class="qp-card admin-card">
      <div class="dcc-head">
        <div>
          <div class="dcc-title">Atividade e segurança</div>
          <div class="dcc-sub">Últimos acessos, tentativas recusadas e ações administrativas registradas no banco.</div>
        </div>
      </div>
      <div class="admin-table-wrap">
        <table class="data-table admin-log-table">
          <thead><tr><th>Data</th><th>Evento</th><th>Usuário</th><th>Resultado</th><th>IP</th></tr></thead>
          <tbody>
            ${logs.length ? logs.map((log) => `
              <tr data-admin-search-row="${escapeHtml(`${log.username || ""} ${adminEventLabel(log.eventType)} ${log.outcome || ""}`.toLowerCase())}">
                <td>${formatDateTime(log.createdAt)}</td>
                <td>${escapeHtml(adminEventLabel(log.eventType))}</td>
                <td>${escapeHtml(log.username || "Sistema")}</td>
                <td>${auditOutcomeBadge(log.outcome)}</td>
                <td class="mono-cell">${escapeHtml(log.ipAddress || "-")}</td>
              </tr>
            `).join("") : `<tr><td colspan="5"><div class="empty-state">A atividade começará a aparecer após os próximos acessos.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>

    <div class="admin-reset-result" id="adminResetResult" hidden></div>
  `;
}

function operationsPanelHtml(operations) {
  const health = operations.health || {};
  const services = health.services || {};
  const backups = operations.backups || [];
  const incidents = operations.incidents || [];
  const billingEvents = operations.billingEvents || [];
  return `
    <section class="qp-card admin-card operations-card">
      <div class="dcc-head">
        <div>
          <div class="dcc-title">Operação do sistema</div>
          <div class="dcc-sub">Cobrança, backups verificados e falhas registradas automaticamente.</div>
        </div>
        <button class="btn-primary" data-admin-action="run-backup" type="button">${moduleIcon("download")} Executar backup</button>
      </div>
      <div class="operations-health-grid">
        ${operationHealthItem("Banco de dados", services.database?.ok, services.database?.ok ? `${services.database.latencyMs} ms` : "Indisponível")}
        ${operationHealthItem("Cobrança Stripe", services.billing?.ok, services.billing?.ok ? "Configurada" : "Não configurada")}
        ${operationHealthItem("Backup automático", services.backup?.ok, services.backup?.mode || "Indisponível")}
        ${operationHealthItem(
          "E-mail e alertas",
          services.email?.ok && services.email?.operationalAlertsConfigured,
          !services.email?.ok
            ? "Envio não configurado"
            : services.email?.operationalAlertsConfigured
              ? "Envio e destinatário configurados"
              : "Falta o destinatário dos incidentes",
        )}
      </div>
      <div class="operations-columns">
        <div>
          <h4>Backups recentes</h4>
          <div class="admin-table-wrap">
            <table class="data-table compact-table">
              <thead><tr><th>Data</th><th>Tamanho</th><th>Verificação</th><th>Ação</th></tr></thead>
              <tbody>${backups.length ? backups.slice(0, 8).map((backup) => `
                <tr>
                  <td>${formatDateTime(backup.createdAt)}</td>
                  <td>${formatBytes(backup.byteSize)}</td>
                  <td>${backupStatusBadge(backup)}</td>
                  <td>${backup.status === "completed" ? `<button class="abtn" data-admin-action="verify-backup" data-backup-id="${backup.id}" type="button" title="Testar restauração">${moduleIcon("check-circle")}</button>` : "-"}</td>
                </tr>`).join("") : `<tr><td colspan="4"><div class="empty-state">Nenhum backup automático executado.</div></td></tr>`}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h4>Incidentes recentes</h4>
          <div class="operations-event-list">
            ${incidents.length ? incidents.slice(0, 8).map((incident) => `
              <div class="operations-event ${escapeHtml(incident.severity || "info")}">
                <span></span><div><strong>${escapeHtml(incident.component || "app")}</strong><p>${escapeHtml(incident.message || incident.eventType)}</p><small>${formatDateTime(incident.createdAt)}</small></div>
              </div>`).join("") : `<div class="empty-state">Nenhuma falha registrada.</div>`}
          </div>
        </div>
      </div>
      <details class="billing-events-details">
        <summary>Histórico recente da cobrança (${billingEvents.length})</summary>
        <div class="operations-event-list">
          ${billingEvents.length ? billingEvents.slice(0, 10).map((event) => `
            <div class="operations-event info"><span></span><div><strong>${escapeHtml(event.eventType)}</strong><p>Empresa ${escapeHtml(event.companyId || "-")} · ${escapeHtml(event.status || "processado")}</p><small>${formatDateTime(event.createdAt)}</small></div></div>`).join("") : `<div class="empty-state">Os eventos aparecerão após o primeiro webhook da Stripe.</div>`}
        </div>
      </details>
    </section>`;
}

function operationHealthItem(label, ok, detail) {
  return `<div class="operation-health ${ok ? "ok" : "warning"}"><span></span><div><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></div></div>`;
}

function backupStatusBadge(backup) {
  const verified = backup.verificationStatus === "verified";
  const restoreTested = backup.metadata?.restoreTest?.ok === true;
  const failed = backup.status === "failed" || backup.verificationStatus === "failed";
  const label = failed ? "Falhou" : restoreTested ? "Restauração testada" : verified ? "Verificado" : "Pendente";
  return `<span class="status-pill ${failed ? "s-danger" : verified ? "s-ok" : "s-prog"}"><span class="status-dot2"></span>${label}</span>`;
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function adminCompanyFormHtml() {
  return `
    <form class="qp-card qp-form admin-edit-form" id="adminCompanyForm">
      <input type="hidden" name="companyId" />
      <div class="form-section-title full">Cliente</div>
      <label><span>Empresa</span><input name="name" required placeholder="Nome da empresa" /></label>
      <label><span>CNPJ</span><input name="cnpj" placeholder="00.000.000/0001-00" /></label>
      <label><span>Certificação</span><input name="certification" placeholder="ISO 9001:2015" /></label>
      <label><span>Plano</span><input name="plan" placeholder="Plano Profissional" /></label>
      <label><span>Situação do pagamento</span><select name="billingStatus"><option>Ativo</option><option>Pendente</option><option>Inadimplente</option><option>Teste</option><option>Cancelado</option></select></label>
      <label><span>Limite de acessos</span><input name="accessLimit" type="number" min="1" max="10000" value="5" required /></label>
      <label class="full"><span>Escopo</span><textarea name="scope" placeholder="Escopo do sistema de gestão"></textarea></label>
      <div class="admin-form-actions full">
        <button class="btn-primary" type="submit">Salvar cliente</button>
        <button class="btn-ghost" data-admin-action="clear-company-form" type="button">Novo cliente</button>
      </div>
    </form>
  `;
}

function adminUserFormHtml(companies) {
  return `
    <form class="qp-card qp-form admin-edit-form" id="adminUserForm">
      <input type="hidden" name="userId" />
      <div class="form-section-title full">Usuário e acesso</div>
      <label><span>Nome</span><input name="displayName" required placeholder="Nome do usuário" /></label>
      <label><span>E-mail de acesso</span><input name="username" type="email" required placeholder="usuario@empresa.com.br" /></label>
      <label>
        <span>Empresa</span>
        <select name="companyId" required>
          <option value="">Selecione</option>
          ${companies.map((company) => `<option value="${company.id}">${escapeHtml(company.name)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Perfil</span>
        <select name="role">
          <option>Administrador</option>
          <option>Qualidade</option>
          <option>Consulta</option>
        </select>
      </label>
      <label>
        <span>Status</span>
        <select name="status">
          <option>Ativo</option>
          <option>Bloqueado</option>
          <option>Pendente</option>
        </select>
      </label>
      <div class="invite-flow-note full">Novos usuários recebem um convite por e-mail para criar a própria senha.</div>
      <div class="admin-form-actions full">
        <button class="btn-primary" type="submit">Salvar usuário</button>
        <button class="btn-ghost" data-admin-action="clear-user-form" type="button">Novo usuário</button>
      </div>
    </form>
  `;
}

function adminMetric(label, value, caption) {
  return `
    <article class="kpi-card" style="--accent-line:#2f8ff0;">
      <div class="kpi-top">
        <div class="kpi-icon" style="border-color:rgba(47,143,240,0.4); color:#4fa3ff;">${moduleIcon("modulos")}</div>
        <div><div class="kpi-label">${escapeHtml(label)}</div><div class="kpi-value big">${escapeHtml(value)}</div></div>
      </div>
      <div class="kpi-caption">${escapeHtml(caption)}</div>
    </article>
  `;
}

function planBadge(plan) {
  const paid = isPaidPlanName(plan);
  return `<span class="plan-badge ${paid ? "paid" : "trial"}">${escapeHtml(plan || "Sem plano")}</span>`;
}

function billingBadge(status) {
  const value = status || "Ativo";
  const normalized = value.toLowerCase();
  const className = normalized === "ativo" ? "paid" : normalized === "teste" || normalized === "pendente" ? "trial" : "overdue";
  return `<span class="plan-badge ${className}">${escapeHtml(value)}</span>`;
}

function auditOutcomeBadge(outcome) {
  const value = outcome || "success";
  const success = value === "success";
  return `<span class="audit-outcome ${success ? "success" : "failed"}"><span></span>${success ? "Sucesso" : value === "blocked" ? "Bloqueado" : "Falha"}</span>`;
}

function adminEventLabel(eventType) {
  const labels = {
    login_success: "Login realizado",
    login_failed: "Falha no login",
    login_rate_limited: "Login temporariamente bloqueado",
    logout: "Saída do sistema",
    onboarding_completed: "Cadastro inicial concluído",
    company_updated: "Dados da empresa atualizados",
    company_user_created: "Usuário da empresa criado",
    company_user_updated: "Usuário da empresa atualizado",
    company_user_deleted: "Usuário da empresa removido",
    admin_company_created: "Cliente criado pelo administrador",
    admin_company_updated: "Cliente atualizado pelo administrador",
    admin_user_created: "Usuário criado pelo administrador",
    admin_user_updated: "Usuário atualizado pelo administrador",
    admin_password_reset: "Senha resetada pelo administrador",
    password_reset_requested: "Recuperação de senha solicitada",
    password_reset_rate_limited: "Recuperação temporariamente bloqueada",
    password_reset_completed: "Senha redefinida pelo usuário",
    password_reset_failed: "Link de recuperação recusado",
    invitation_sent: "Convite de usuário enviado",
    invitation_resent: "Convite de usuário reenviado",
    invitation_accepted: "Convite de usuário aceito",
    invitation_failed: "Convite de usuário recusado",
    mfa_challenge_started: "Verificação em duas etapas solicitada",
    mfa_verified: "Verificação em duas etapas concluída",
    mfa_failed: "Falha na verificação em duas etapas",
    mfa_rate_limited: "Verificação em duas etapas bloqueada",
    mfa_setup_started: "Configuração de 2FA iniciada",
    mfa_enabled: "Verificação em duas etapas ativada",
    mfa_disabled: "Verificação em duas etapas desativada",
    session_revoked: "Sessão desconectada",
    other_sessions_revoked: "Outras sessões desconectadas",
    csrf_rejected: "Solicitação insegura recusada",
    deadline_alert_sent: "Alerta de prazos enviado",
    company_export: "Relatório exportado",
    company_backup: "Backup da empresa gerado",
    admin_backup: "Backup administrativo gerado",
    module_data_updated: "Dados de módulo atualizados",
  };
  return labels[eventType] || String(eventType || "Evento").replace(/_/g, " ");
}

function formatDateTime(value) {
  if (!value) return "Nunca";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isPaidPlanName(plan) {
  const value = String(plan || "").trim().toLowerCase();
  return Boolean(value) && !["gratis", "grátis", "free", "teste", "demo"].includes(value);
}

function adminPayload(value) {
  return encodeURIComponent(JSON.stringify(value || {})).replace(/'/g, "%27");
}

function readAdminPayload(button, key) {
  if (!button) return {};
  try {
    return JSON.parse(decodeURIComponent(button.dataset[key] || "%7B%7D"));
  } catch {
    return {};
  }
}

function bindAdminActions() {
  document.querySelector("#adminCompanyForm")?.addEventListener("submit", saveAdminCompany);
  document.querySelector("#adminUserForm")?.addEventListener("submit", saveAdminUser);

  pageContent.querySelectorAll("[data-admin-action]").forEach((button) => {
    button.addEventListener("click", () => handleAdminAction(button));
  });
  pageContent.querySelector("[data-admin-search]")?.addEventListener("input", filterAdminRows);
}

function filterAdminRows(event) {
  const query = String(event.currentTarget.value || "").trim().toLowerCase();
  pageContent.querySelectorAll("[data-admin-search-row]").forEach((row) => {
    row.hidden = Boolean(query) && !String(row.dataset.adminSearchRow || "").includes(query);
  });
}

async function handleAdminAction(button) {
  const action = button.dataset.adminAction;

  if (action === "run-backup") {
    await runAdminBackup();
    return;
  }

  if (action === "verify-backup") {
    await verifyAdminBackup(Number(button.dataset.backupId));
    return;
  }

  if (action === "clear-company-form") {
    clearAdminCompanyForm();
    return;
  }

  if (action === "clear-user-form") {
    clearAdminUserForm();
    return;
  }

  if (action === "edit-company") {
    fillAdminCompanyForm(readAdminPayload(button, "company"));
    return;
  }

  if (action === "edit-user") {
    fillAdminUserForm(readAdminPayload(button, "user"));
    return;
  }

  if (action === "toggle-user") {
    await toggleAdminUser(button);
    return;
  }

  if (action === "resend-invite") {
    await resendAdminInvitation(button);
    return;
  }

  if (action !== "reset-password") return;
  const userId = Number(button.dataset.userId);
  const userName = button.dataset.userName || "usuário";
  if (!userId || !window.confirm(`Resetar a senha de ${userName}?`)) return;
  const currentPassword = await confirmSensitiveAction("Resetar senha do usuário");
  if (!currentPassword) return;

  const response = await fetch("/api/admin/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, currentPassword }),
  });

  if (!response.ok) {
    toast("Não foi possível resetar a senha.");
    return;
  }

  const result = await response.json();
  const box = document.querySelector("#adminResetResult");
  if (box) {
    box.hidden = false;
    box.innerHTML = `
      <strong>Senha temporária gerada para ${escapeHtml(result.user.displayName)}:</strong>
      <code>${escapeHtml(result.temporaryPassword)}</code>
    `;
  }
  toast("Senha resetada.");
}

async function runAdminBackup() {
  const currentPassword = await confirmSensitiveAction("Executar backup automático agora");
  if (!currentPassword) return;
  const response = await fetch("/api/admin/backups/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword }),
  });
  if (!response.ok) {
    toast("Não foi possível concluir o backup.");
    return;
  }
  toast("Backup criado e restauração isolada testada.");
  await renderGerenciamento();
}

async function verifyAdminBackup(snapshotId) {
  if (!snapshotId) return;
  const currentPassword = await confirmSensitiveAction("Testar restauração do backup");
  if (!currentPassword) return;
  const response = await fetch("/api/admin/backups/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshotId, currentPassword }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    toast("O teste de restauração falhou.");
    return;
  }
  const counts = result.counts || {};
  toast(`Restauração isolada concluída: ${counts.companies || 0} empresa(s), ${counts.users || 0} usuário(s).`);
  await renderGerenciamento();
}

async function resendAdminInvitation(button) {
  const userId = Number(button.dataset.userId);
  const currentPassword = await confirmSensitiveAction("Reenviar convite de acesso");
  if (!userId || !currentPassword) return;
  const response = await fetch("/api/admin/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, currentPassword }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    toast(result.error === "password_confirmation_required" ? "Senha atual incorreta." : "Não foi possível reenviar o convite.");
    return;
  }
  toast(result.invitation?.delivery === "sent" ? "Convite reenviado." : "Convite renovado, mas o envio de e-mail não está configurado.");
  await renderGerenciamento();
}

async function saveAdminCompany(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const isEditing = Boolean(data.companyId);
  const currentPassword = isEditing
    ? await confirmSensitiveAction("Atualizar dados do cliente")
    : "";
  if (isEditing && !currentPassword) return;

  const response = await fetch("/api/admin/company", {
    method: isEditing ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId: data.companyId ? Number(data.companyId) : undefined,
      name: data.name,
      cnpj: data.cnpj,
      certification: data.certification,
      plan: data.plan,
      billingStatus: data.billingStatus,
      accessLimit: Number(data.accessLimit),
      scope: data.scope,
      currentPassword,
    }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    toast(result.error === "company_exists" ? "Já existe uma empresa com esse nome." : "Não foi possível salvar o cliente.");
    return;
  }

  toast(isEditing ? "Cliente atualizado." : "Cliente cadastrado.");
  await renderGerenciamento();
}

async function saveAdminUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const isEditing = Boolean(data.userId);
  const currentPassword = await confirmSensitiveAction(isEditing ? "Atualizar usuário" : "Convidar usuário");
  if (!currentPassword) return;

  const response = await fetch("/api/admin/user", {
    method: isEditing ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: data.userId ? Number(data.userId) : undefined,
      companyId: Number(data.companyId),
      username: data.username,
      displayName: data.displayName,
      role: data.role,
      status: data.status,
      currentPassword,
    }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    toast(
      result.error === "access_limit_reached"
        ? "O limite de acessos desta empresa foi atingido."
        : result.error === "user_exists"
          ? "Já existe um usuário com esse login."
          : "Não foi possível salvar o usuário.",
    );
    return;
  }

  const result = await response.json().catch(() => ({}));
  toast(
    isEditing
      ? "Usuário atualizado."
      : result.invitation?.delivery === "sent"
        ? "Convite enviado por e-mail."
        : "Usuário criado. Configure o e-mail para entregar o convite.",
  );
  await renderGerenciamento();
}

async function toggleAdminUser(button) {
  const user = readAdminPayload(button.closest("tr")?.querySelector("[data-admin-action='edit-user']"), "user");
  if (!user?.id) return;

  const nextStatus = user.status === "Ativo" ? "Bloqueado" : "Ativo";
  if (!window.confirm(`${nextStatus === "Bloqueado" ? "Bloquear" : "Liberar"} o acesso de ${user.displayName}?`)) return;
  const currentPassword = await confirmSensitiveAction(`${nextStatus === "Bloqueado" ? "Bloquear" : "Liberar"} acesso`);
  if (!currentPassword) return;

  const response = await fetch("/api/admin/user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      companyId: user.companyId,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      status: nextStatus,
      currentPassword,
    }),
  });

  if (!response.ok) {
    toast("Não foi possível alterar o status.");
    return;
  }

  toast(nextStatus === "Bloqueado" ? "Acesso bloqueado." : "Acesso liberado.");
  await renderGerenciamento();
}

function fillAdminCompanyForm(company) {
  const form = document.querySelector("#adminCompanyForm");
  if (!form) return;
  form.companyId.value = company.id || "";
  form.name.value = company.name || "";
  form.cnpj.value = company.cnpj || "";
  form.certification.value = company.certification || "";
  form.plan.value = company.plan || "";
  form.billingStatus.value = company.billingStatus || "Ativo";
  form.accessLimit.value = company.accessLimit || 5;
  form.scope.value = company.scope || "";
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function fillAdminUserForm(user) {
  const form = document.querySelector("#adminUserForm");
  if (!form) return;
  form.userId.value = user.id || "";
  form.displayName.value = user.displayName || "";
  form.username.value = user.username || "";
  form.companyId.value = user.companyId || "";
  form.role.value = user.role || "Administrador";
  form.status.value = user.status || "Ativo";
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearAdminCompanyForm() {
  const form = document.querySelector("#adminCompanyForm");
  if (!form) return;
  form.reset();
  form.companyId.value = "";
  form.billingStatus.value = "Ativo";
  form.accessLimit.value = 5;
}

function clearAdminUserForm() {
  const form = document.querySelector("#adminUserForm");
  if (!form) return;
  form.reset();
  form.userId.value = "";
}

async function renderMeuPerfil() {
  setTopbar("Meu perfil", "Dados do usuário conectado");
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.classList.remove("leadership-page-content");
  pageContent.innerHTML = `
    ${viewHeader("Meu perfil", "Consulte as informações da sua conta no SGQ Online.")}
    <section class="profile-grid">
      <article class="qp-card profile-card">
        <div class="profile-avatar">${escapeHtml(initials(currentUser?.name || currentUser?.username || "U"))}</div>
        <div>
          <h3>${escapeHtml(currentUser?.name || "Usuário")}</h3>
          <p>${escapeHtml(currentUser?.role || "Colaborador")}</p>
        </div>
      </article>
      <article class="qp-card profile-card details">
        <div class="detail-item"><span>Login</span><strong>${escapeHtml(currentUser?.username || "-")}</strong></div>
        <div class="detail-item"><span>Empresa</span><strong>${escapeHtml(state.company.name || "-")}</strong></div>
        <div class="detail-item"><span>Perfil</span><strong>${escapeHtml(currentUser?.role || "-")}</strong></div>
        <div class="detail-item"><span>Acesso</span><strong>${canManageCompany() ? "Administrador da empresa" : "Colaborador"}</strong></div>
      </article>
    </section>
    <section class="security-grid" id="securityGrid">
      <article class="qp-card security-card"><div class="admin-loading">Carregando segurança da conta...</div></article>
    </section>
  `;

  try {
    const response = await fetch("/api/security", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error("Falha ao carregar segurança.");
    renderSecurityPanel(await response.json());
  } catch (error) {
    console.warn(error);
    const grid = pageContent.querySelector("#securityGrid");
    if (grid) grid.innerHTML = `<article class="qp-card security-card"><p class="qp-muted">Não foi possível carregar as opções de segurança.</p></article>`;
  }
}

function renderSecurityPanel(security) {
  const grid = pageContent.querySelector("#securityGrid");
  if (!grid) return;
  const mfaCard = security.mfaAvailable ? `
    <article class="qp-card security-card">
      <div class="security-card-head">
        <div class="security-icon">${moduleIcon("shield")}</div>
        <div><h3>Verificação em duas etapas</h3><p>Protege seu acesso administrativo com um código temporário.</p></div>
      </div>
      <div class="security-status ${security.mfaEnabled ? "enabled" : "disabled"}">
        <span></span>${security.mfaEnabled ? "Ativada" : "Desativada"}
      </div>
      <button class="${security.mfaEnabled ? "btn-ghost danger-text" : "btn-primary"}" type="button" data-security-action="${security.mfaEnabled ? "disable-mfa" : "setup-mfa"}">
        ${security.mfaEnabled ? "Desativar 2FA" : "Configurar 2FA"}
      </button>
    </article>` : "";
  grid.innerHTML = `
    ${mfaCard}
    <article class="qp-card security-card security-sessions-card">
      <div class="security-card-head">
        <div class="security-icon">${moduleIcon("modulos")}</div>
        <div><h3>Sessões ativas</h3><p>Dispositivos que ainda possuem acesso à sua conta.</p></div>
      </div>
      <div class="security-session-list">
        ${(security.sessions || []).map((session) => `
          <div class="security-session-row">
            <div>
              <strong>${escapeHtml(session.device || "Navegador")}${session.current ? " · sessão atual" : ""}</strong>
              <span>${escapeHtml(session.ipAddress || "IP não informado")} · atividade ${escapeHtml(formatDateTime(session.lastSeenAt))}</span>
            </div>
            ${session.current ? `<span class="security-current">Atual</span>` : `<button class="u-abtn danger" type="button" title="Desconectar dispositivo" data-security-session="${escapeHtml(session.id)}">${moduleIcon("close")}</button>`}
          </div>
        `).join("") || `<p class="qp-muted">Nenhuma sessão ativa encontrada.</p>`}
      </div>
      ${(security.sessions || []).some((session) => !session.current) ? `<button class="btn-ghost" type="button" data-security-action="revoke-others">Desconectar outros dispositivos</button>` : ""}
    </article>
  `;
  grid.querySelector("[data-security-action='setup-mfa']")?.addEventListener("click", setupMfa);
  grid.querySelector("[data-security-action='disable-mfa']")?.addEventListener("click", disableMfa);
  grid.querySelector("[data-security-action='revoke-others']")?.addEventListener("click", revokeOtherSessions);
  grid.querySelectorAll("[data-security-session]").forEach((button) => {
    button.addEventListener("click", () => revokeSecuritySession(button.dataset.securitySession));
  });
}

async function setupMfa() {
  const currentPassword = await confirmSensitiveAction("Configurar verificação em duas etapas");
  if (!currentPassword) return;
  const response = await fetch("/api/security/mfa/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    toast(result.error === "password_confirmation_required" ? "Senha atual incorreta." : "Não foi possível iniciar a configuração.");
    return;
  }
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay show mfa-setup-overlay";
  overlay.innerHTML = `
    <div class="modal-box mfa-setup-box" role="dialog" aria-modal="true">
      <div class="modal-hd"><div><h3>Ativar verificação em duas etapas</h3><p>Leia o QR Code no Google Authenticator, Microsoft Authenticator ou aplicativo compatível.</p></div></div>
      <div class="mfa-setup-content">
        <img src="${result.qrCode}" alt="QR Code para configurar autenticação em duas etapas">
        <div><span>Chave manual</span><code>${escapeHtml(result.secret)}</code></div>
      </div>
      <div class="field"><label for="mfaSetupCode">Código de seis números</label><input class="input-basic" id="mfaSetupCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></div>
      <div class="modal-actions"><button class="btn-ghost" type="button" data-mfa-cancel>Cancelar</button><button class="btn-grad" type="button" data-mfa-enable>Ativar 2FA</button></div>
    </div>`;
  overlay.querySelector("[data-mfa-cancel]").addEventListener("click", () => overlay.remove());
  overlay.querySelector("[data-mfa-enable]").addEventListener("click", async () => {
    const code = overlay.querySelector("#mfaSetupCode").value.trim();
    if (!/^\d{6}$/.test(code)) {
      toast("Digite o código de seis números.");
      return;
    }
    const password = await confirmSensitiveAction("Confirmar ativação do 2FA");
    if (!password) return;
    const enableResponse = await fetch("/api/security/mfa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, currentPassword: password }),
    });
    const enabled = await enableResponse.json().catch(() => ({}));
    if (!enableResponse.ok) {
      toast(enabled.error === "invalid_mfa_code" ? "Código inválido." : "Não foi possível ativar o 2FA.");
      return;
    }
    overlay.querySelector(".mfa-setup-box").innerHTML = `
      <div class="modal-hd"><div><h3>Códigos de recuperação</h3><p>Guarde estes códigos em local seguro. Cada código funciona apenas uma vez.</p></div></div>
      <div class="recovery-code-grid">${enabled.recoveryCodes.map((item) => `<code>${escapeHtml(item)}</code>`).join("")}</div>
      <div class="modal-actions"><button class="btn-grad" type="button" data-mfa-finish>Concluir</button></div>`;
    overlay.querySelector("[data-mfa-finish]").addEventListener("click", () => {
      overlay.remove();
      renderMeuPerfil();
    });
  });
  document.body.appendChild(overlay);
  overlay.querySelector("#mfaSetupCode").focus();
}

function promptSecurityCode(title) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay show security-confirm-overlay";
    overlay.innerHTML = `
      <div class="modal-box security-confirm-box" role="dialog" aria-modal="true">
        <div class="modal-hd"><div><h3>${escapeHtml(title)}</h3><p>Informe o código do autenticador ou um código de recuperação.</p></div></div>
        <div class="field"><label for="securityCodeField">Código</label><input class="input-basic" id="securityCodeField" autocomplete="one-time-code" required></div>
        <div class="modal-actions"><button class="btn-ghost" type="button" data-code-cancel>Cancelar</button><button class="btn-grad" type="button" data-code-confirm>Confirmar</button></div>
      </div>`;
    const finish = (value) => { overlay.remove(); resolve(value); };
    overlay.querySelector("[data-code-cancel]").addEventListener("click", () => finish(null));
    overlay.querySelector("[data-code-confirm]").addEventListener("click", () => finish(overlay.querySelector("#securityCodeField").value.trim() || null));
    document.body.appendChild(overlay);
    overlay.querySelector("#securityCodeField").focus();
  });
}

async function disableMfa() {
  const code = await promptSecurityCode("Desativar verificação em duas etapas");
  if (!code) return;
  const currentPassword = await confirmSensitiveAction("Confirmar desativação do 2FA");
  if (!currentPassword) return;
  const response = await fetch("/api/security/mfa/disable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, currentPassword }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    toast(result.error === "invalid_mfa_code" ? "Código de verificação inválido." : "Não foi possível desativar o 2FA.");
    return;
  }
  toast("Verificação em duas etapas desativada.");
  renderMeuPerfil();
}

async function revokeSecuritySession(sessionId) {
  const currentPassword = await confirmSensitiveAction("Desconectar dispositivo");
  if (!currentPassword) return;
  const response = await fetch("/api/security/sessions", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, currentPassword }),
  });
  if (!response.ok) {
    toast("Não foi possível desconectar o dispositivo.");
    return;
  }
  toast("Dispositivo desconectado.");
  renderMeuPerfil();
}

async function revokeOtherSessions() {
  const currentPassword = await confirmSensitiveAction("Desconectar outros dispositivos");
  if (!currentPassword) return;
  const response = await fetch("/api/security/sessions/revoke-others", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    toast("Não foi possível desconectar as outras sessões.");
    return;
  }
  toast(`${result.revoked || 0} sessão(ões) desconectada(s).`);
  renderMeuPerfil();
}

async function renderMinhasPermissoes() {
  setTopbar("Minhas permissões", "Acessos disponíveis para sua conta");
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.classList.remove("leadership-page-content");
  pageContent.innerHTML = `
    ${viewHeader("Minhas permissões", "Veja quais áreas do SGQ Online estão liberadas para o seu usuário.")}
    <article class="qp-card permissions-summary">
      <div class="admin-loading">Carregando permissões...</div>
    </article>
  `;

  let user = null;
  try {
    const response = await fetch("/api/company/users", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (response.ok) {
      const payload = await response.json();
      user = (payload.users || []).map(normalizeCompanyUser).find((item) => Number(item.id) === Number(currentUser?.id));
    }
  } catch (error) {
    console.warn(error);
  }

  const permissions = normalizeUserPermissions(
    currentUser?.role || "Colaborador",
    user?.permissions || currentUser?.permissions,
  );
  const rows = [
    ["Acessar módulos do SGQ", Boolean(permissions.modules)],
    ["Visualizar relatórios", Boolean(permissions.reports)],
    ["Gerenciar usuários", Boolean(permissions.manageUsers || canManageCompany())],
    ["Alterar dados da empresa", canManageCompany()],
  ];
  const moduleRows = modules.map((module) => {
    const access = moduleAccessLevel(module.id);
    const label = access === "edit" ? "Editar" : access === "view" ? "Visualizar" : "Sem acesso";
    return [module.title, label, access !== "none"];
  });

  const box = pageContent.querySelector(".permissions-summary");
  if (!box) return;
  box.innerHTML = `
    <div class="permission-list">
      ${rows.map(([label, allowed]) => `
        <div class="permission-row">
          <span>${escapeHtml(label)}</span>
          <strong class="${allowed ? "allowed" : "blocked"}">${allowed ? "Liberado" : "Bloqueado"}</strong>
        </div>
      `).join("")}
    </div>
    <div class="permission-title permission-summary-title">Permissões por módulo</div>
    <div class="permission-list">
      ${moduleRows.map(([label, access, allowed]) => `
        <div class="permission-row">
          <span>${escapeHtml(label)}</span>
          <strong class="${allowed ? "allowed" : "blocked"}">${escapeHtml(access)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderConfiguracoes() {
  setTopbar("Configurações", "Preferências do sistema");
  pageContent.innerHTML = `
    ${viewHeader(currentUser?.isAdmin ? "Configurações globais" : "Preferências", "Ajuste preferências iniciais do SGQ Online.")}
    <form class="qp-card qp-form" id="settingsForm">
      <label>
        <span>Tema do sistema</span>
        <select name="theme">
          <option value="dark" ${state.settings.theme !== "light" ? "selected" : ""}>Escuro</option>
          <option value="light" ${state.settings.theme === "light" ? "selected" : ""}>Claro azul</option>
        </select>
      </label>
      <label class="check-row"><input name="emailAlerts" type="checkbox" ${state.settings.emailAlerts ? "checked" : ""} /> <span>Enviar alertas por e-mail</span></label>
      <label class="check-row"><input name="weeklyReport" type="checkbox" ${state.settings.weeklyReport ? "checked" : ""} /> <span>Gerar resumo semanal</span></label>
      <button type="submit">Salvar configurações</button>
    </form>
    ${canManageCompany() ? `<section id="billingSettings" class="billing-settings"><div class="qp-card admin-loading">Carregando assinatura...</div></section>` : ""}
  `;
  document.querySelector("#settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.settings = {
      companyAccess: state.settings.companyAccess,
      emailAlerts: data.has("emailAlerts"),
      weeklyReport: data.has("weeklyReport"),
      theme: data.get("theme") || "dark",
    };
    saveState();
    applyTheme();
    toast("Configurações salvas.");
  });
  if (canManageCompany()) await loadBillingSettings();
}

async function loadBillingSettings() {
  const container = document.querySelector("#billingSettings");
  if (!container) return;
  try {
    const response = await fetch("/api/billing", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error("billing_load_failed");
    const billing = await response.json();
    container.innerHTML = billingSettingsHtml(billing);
    container.querySelectorAll("[data-billing-action]").forEach((button) => {
      button.addEventListener("click", () => handleBillingAction(button));
    });
  } catch {
    container.innerHTML = `<article class="qp-card"><h3>Assinatura indisponível</h3><p class="qp-muted">Não foi possível consultar a cobrança agora.</p></article>`;
  }
}

function billingSettingsHtml(billing) {
  const company = billing.company || {};
  const plans = billing.plans || [];
  const invoices = billing.invoices || [];
  const hasSubscription = Boolean(company.billingSubscriptionId);
  return `
    <article class="qp-card billing-summary-card">
      <div class="dcc-head">
        <div><div class="dcc-title">Assinatura</div><div class="dcc-sub">Plano, período de teste, renovação e faturas da empresa.</div></div>
        ${billingBadge(company.billingStatus || "Pendente")}
      </div>
      ${billing.configured ? "" : `<div class="billing-warning">A cobrança ainda não foi configurada pelo administrador do SGQ Online.</div>`}
      <div class="billing-current-grid">
        <div><span>Plano atual</span><strong>${escapeHtml(company.plan || "Sem plano")}</strong></div>
        <div><span>Limite de acessos</span><strong>${Number(company.accessLimit || 0)}</strong></div>
        <div><span>Próxima renovação</span><strong>${formatDateTime(company.billingCurrentPeriodEnd || company.billingTrialEnd)}</strong></div>
        <div><span>Renovação automática</span><strong>${company.billingCancelAtPeriodEnd ? "Cancelamento agendado" : "Ativa"}</strong></div>
      </div>
      ${company.billingCustomerId ? `<button class="btn-ghost" data-billing-action="portal" type="button">${moduleIcon("external")} Gerenciar cobrança e faturas</button>` : ""}
    </article>
    <section class="billing-plan-section">
      <div class="dcc-title">Planos disponíveis</div>
      <div class="billing-plan-grid">
        ${plans.length ? plans.map((plan) => {
          const selected = company.billingPriceId === plan.priceId;
          const action = hasSubscription ? "change-plan" : "checkout";
          return `<article class="qp-card billing-plan-card ${selected ? "selected" : ""}">
            <div><span>${selected ? "PLANO ATUAL" : "ASSINATURA"}</span><h3>${escapeHtml(plan.name)}</h3><p>Até ${Number(plan.accessLimit)} acessos por empresa.</p></div>
            <button class="${selected ? "btn-ghost" : "btn-primary"}" data-billing-action="${action}" data-plan="${escapeHtml(plan.key)}" type="button" ${selected || !billing.configured ? "disabled" : ""}>${selected ? "Plano atual" : hasSubscription ? "Trocar plano" : "Iniciar período de teste"}</button>
          </article>`;
        }).join("") : `<article class="qp-card"><p class="qp-muted">Os planos aparecerão quando os preços da Stripe forem configurados.</p></article>`}
      </div>
    </section>
    <article class="qp-card admin-card">
      <div class="dcc-title">Faturas</div>
      <div class="admin-table-wrap">
        <table class="data-table compact-table"><thead><tr><th>Data</th><th>Número</th><th>Status</th><th>Valor</th><th>Ação</th></tr></thead>
          <tbody>${invoices.length ? invoices.map((invoice) => `<tr><td>${formatDate(invoice.createdAt)}</td><td>${escapeHtml(invoice.number || invoice.id)}</td><td>${billingBadge(invoice.status)}</td><td>${formatCurrencyMinor(invoice.amount, invoice.currency)}</td><td>${invoice.url ? `<a class="abtn" href="${escapeHtml(invoice.url)}" target="_blank" rel="noopener" title="Abrir fatura">${moduleIcon("external")}</a>` : "-"}</td></tr>`).join("") : `<tr><td colspan="5"><div class="empty-state">Nenhuma fatura emitida.</div></td></tr>`}</tbody>
        </table>
      </div>
    </article>`;
}

async function handleBillingAction(button) {
  const action = button.dataset.billingAction;
  const currentPassword = await confirmSensitiveAction(
    action === "portal" ? "Abrir gerenciamento da cobrança" : action === "checkout" ? "Iniciar assinatura" : "Trocar plano",
  );
  if (!currentPassword) return;
  const endpoint = action === "portal" ? "/api/billing/portal" : action === "checkout" ? "/api/billing/checkout" : "/api/billing/change-plan";
  button.disabled = true;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan: button.dataset.plan, currentPassword }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    button.disabled = false;
    toast(result.error === "password_confirmation_required" ? "Senha atual incorreta." : "Não foi possível atualizar a assinatura.");
    return;
  }
  if (result.url) {
    window.location.assign(result.url);
    return;
  }
  state.settings.companyAccess = result.company?.plan || state.settings.companyAccess;
  toast("Plano atualizado.");
  await loadBillingSettings();
}

function formatCurrencyMinor(value, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: String(currency || "BRL").toUpperCase() }).format((Number(value) || 0) / 100);
}

function renderAjuda() {
  setTopbar("Ajuda", "Suporte e orientação");
  pageContent.innerHTML = `
    ${viewHeader("Central de ajuda", "Orientações para implantação e uso do SGQ Online.")}
    <div class="qp-layout">
      <article class="qp-card">
        <h3>Primeiros passos</h3>
        <ul class="qp-list">
          <li>Revise os dados da empresa.</li>
          <li>Cadastre os usuários principais.</li>
          <li>Acesse os módulos e organize os registros iniciais.</li>
        </ul>
      </article>
      <article class="qp-card">
        <h3>Suporte</h3>
        <p class="qp-muted">Use este espaço futuramente para abrir chamados, enviar dúvidas e acompanhar retornos.</p>
      </article>
    </div>
  `;
}

function viewHeader(title, subtitle) {
  return `
    <header class="qp-view-header">
      <p>QualityPro Cloud</p>
      <h1>${title}</h1>
      <span>${subtitle}</span>
    </header>
  `;
}

function dataTable(title, headers, rows) {
  return `
    <article class="qp-card qp-table-card">
      <h3>${title}</h3>
      <div class="qp-table-wrap">
        <table class="qp-table">
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>${Object.values(row)
                    .map((value) => `<td>${escapeHtml(value)}</td>`)
                    .join("")}</tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function metric(label, value) {
  return `
    <article class="qp-card qp-metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function bindGlobalSearch(view) {
  const search = document.querySelector("#dashboardGlobalSearch");
  if (!search) return;

  search.value = "";
  search.oninput = () => {
    if (view !== "inicio") return;
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    document.querySelectorAll(".home-v2-module").forEach((card) => {
      card.hidden = Boolean(query) && !card.textContent.toLocaleLowerCase("pt-BR").includes(query);
    });
  };
  search.onkeydown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    if (!query) return;

    if (view === "inicio") {
      const visibleCard = document.querySelector(".home-v2-module:not([hidden])");
      if (visibleCard) return void visibleCard.click();
    }

    const matchingModule = accessibleModules().find((module) =>
      `${module.title} ${module.desc}`.toLocaleLowerCase("pt-BR").includes(query),
    );
    if (matchingModule) return void renderModuleDetail(matchingModule.id);

    const matchingNav = [...document.querySelectorAll(".nav-item")].find((item) =>
      item.textContent.toLocaleLowerCase("pt-BR").includes(query),
    );
    if (matchingNav?.dataset.view) return void render(matchingNav.dataset.view);
    toast("Nenhum módulo ou tela encontrado para essa busca.");
  };
}

function bindDashboardActions() {
  bindModuleCards();
  bindViewTargetButtons();

  document.querySelectorAll(".kpi-link:not([data-view-target])").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      render(link.textContent.includes("empresa") ? "empresa" : "relatorios");
    });
  });

}

function bindModuleButtons() {
  bindModuleCards();
}

function bindModuleCards() {
  markModuleCards();
  if (document.body.dataset.moduleCardsBound === "true") return;
  document.body.dataset.moduleCardsBound = "true";

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-module], [data-module-card], .module-card, .mymod-card");
    if (!trigger) return;
    const moduleId = resolveModuleId(trigger);
    if (!moduleId) return;
    event.preventDefault();
    renderModuleDetail(moduleId);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const trigger = event.target.closest("[data-module], [data-module-card], .module-card, .mymod-card");
    if (!trigger) return;
    const moduleId = resolveModuleId(trigger);
    if (!moduleId) return;
    event.preventDefault();
    renderModuleDetail(moduleId);
  });
}

function markModuleCards() {
  document.querySelectorAll(".module-card, .mymod-card").forEach((card) => {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
  });
}

function resolveModuleId(element) {
  const directId = element.dataset.module || element.dataset.moduleCard;
  if (directId) return directId;

  const card = element.closest(".module-card, .mymod-card");
  const cardId = card?.dataset.module || card?.dataset.moduleCard;
  if (cardId) return cardId;

  const title = card?.querySelector(".module-title, .mymod-title")?.textContent?.trim();
  return modules.find((item) => item.title === title)?.id || "";
}

function bindViewTargetButtons() {
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => render(button.dataset.viewTarget));
  });
}

function confirmSensitiveAction(title, description = "Confirme sua senha para continuar.") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay show security-confirm-overlay";
    overlay.innerHTML = `
      <div class="modal-box security-confirm-box" role="dialog" aria-modal="true" aria-labelledby="securityConfirmTitle">
        <div class="modal-hd">
          <div><h3 id="securityConfirmTitle">${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div>
          <button class="modal-close" type="button" data-security-cancel>${moduleIcon("close")}</button>
        </div>
        <div class="field">
          <label for="securityConfirmPassword">Sua senha atual</label>
          <input class="input-basic" id="securityConfirmPassword" type="password" autocomplete="current-password" required>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" type="button" data-security-cancel>Cancelar</button>
          <button class="btn-grad" type="button" data-security-confirm>${moduleIcon("shield")} Confirmar</button>
        </div>
      </div>`;
    const finish = (value) => {
      overlay.remove();
      resolve(value);
    };
    overlay.querySelectorAll("[data-security-cancel]").forEach((button) => button.addEventListener("click", () => finish(null)));
    overlay.querySelector("[data-security-confirm]").addEventListener("click", () => {
      const password = overlay.querySelector("#securityConfirmPassword").value;
      if (!password) {
        toast("Informe sua senha atual.");
        return;
      }
      finish(password);
    });
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") finish(null);
      if (event.key === "Enter") overlay.querySelector("[data-security-confirm]").click();
    });
    document.body.appendChild(overlay);
    overlay.querySelector("#securityConfirmPassword").focus();
  });
}

function toast(message) {
  const existing = document.querySelector(".qp-toast");
  if (existing) existing.remove();

  const element = document.createElement("div");
  element.className = "qp-toast";
  element.textContent = message;
  document.body.appendChild(element);

  window.setTimeout(() => element.remove(), 2400);
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => render(item.dataset.view));
});

initializeApp();
