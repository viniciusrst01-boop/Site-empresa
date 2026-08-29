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
    cnpj: "00.000.000/0001-00",
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

let state = loadState();
let riskData = null;
let contextData = null;
let currentUser = null;
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
    currentUser = payload.user || null;
    state = normalizeState(payload.state, payload.company, payload.user);
    riskData = payload.risk || loadLocalRiskData();
    contextData = payload.context || loadLocalContextData();

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

  if (company && !savedState) {
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
}

function renderOnboarding() {
  setActiveNav("");
  setTopbar("Cadastro inicial", "Complete os dados para iniciar o SGQ Online");
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
  pageContent.innerHTML = `
    ${pageDecorHtml()}
    <section class="onboarding-shell">
      <div class="onboarding-copy">
        <div class="welcome-eyebrow">PRIMEIRO ACESSO</div>
        <h1 class="welcome-title">Finalize seu cadastro</h1>
        <p class="welcome-sub">Essas informações criam o ambiente da sua empresa e deixam os dados separados dos outros usuários.</p>
      </div>

      <form class="qp-card qp-form onboarding-form" id="onboardingForm">
        <div class="form-section-title">Dados do usuário</div>
        <label>
          <span>Nome completo</span>
          <input name="userName" value="${escapeHtml(currentUser?.name || "")}" required />
        </label>
        <label>
          <span>Cargo/perfil</span>
          <input name="userRole" value="${escapeHtml(currentUser?.role || "Administrador")}" required />
        </label>

        <div class="form-section-title full">Dados da empresa</div>
        <label>
          <span>Razão social</span>
          <input name="companyName" value="${escapeHtml(state.company.name)}" required />
        </label>
        <label>
          <span>CNPJ</span>
          <input name="companyCnpj" value="${escapeHtml(state.company.cnpj)}" />
        </label>
        <label>
          <span>Certificação</span>
          <input name="companyCertification" value="${escapeHtml(state.company.certification)}" />
        </label>
        <label>
          <span>Plano</span>
          <input name="companyPlan" value="${escapeHtml(state.settings.companyAccess)}" />
        </label>
        <label class="full">
          <span>Escopo do SGQ</span>
          <textarea name="companyScope" rows="4">${escapeHtml(state.company.scope)}</textarea>
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
    cnpj: data.get("companyCnpj"),
    certification: data.get("companyCertification"),
    plan: data.get("companyPlan"),
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
    cnpj: company.cnpj,
    certification: company.certification,
    scope: company.scope,
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
    }),
  });

  if (!response.ok) {
    toast("Não foi possível salvar o cadastro inicial.");
    return;
  }

  const payload = await response.json();
  if (payload.user) {
    currentUser = {
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

function saveRemoteData(key, value) {
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
    keepalive: true,
  }).catch((error) => console.warn(error));
}

function applyTheme() {
  const isLight = state.settings.theme === "light";
  document.body.classList.toggle("theme-light", isLight);
  document.querySelectorAll(".app-theme-logo").forEach((logo) => {
    logo.src = isLight
      ? "/assets/qualitypro-cloud-logo-light.png"
      : "/assets/qualitypro-cloud-logo-transparent.png";
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
  setActiveNav(view);
  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");

  const views = {
    inicio: renderInicio,
    modulos: renderModulos,
    empresa: renderEmpresa,
    usuarios: renderUsuarios,
    notificacoes: renderNotificacoes,
    relatorios: renderRelatorios,
    configuracoes: renderConfiguracoes,
    ajuda: renderAjuda,
  };

  const renderView = views[view] || renderInicio;
  renderView();
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
  const moduleCards = modules
    .map((module) => dashboardModuleCard(module, summary.modules[module.id]))
    .join("");

  return `
    ${pageDecorHtml()}
    <div class="welcome-block">
      <div class="welcome-eyebrow">PAINEL · SISTEMA DE GESTÃO DA QUALIDADE</div>
      <h1 class="welcome-title">Olá, ${escapeHtml(firstName(currentUser?.name || "Usuário"))}!</h1>
      <p class="welcome-sub">Aqui está um resumo do seu Sistema de Gestão.</p>
    </div>

    <div class="kpi-row">
      <article class="kpi-card" style="--accent-line:#2f8ff0;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(47,143,240,0.4); color:#4fa3ff;">${moduleIcon("home")}</div>
          <div>
            <div class="kpi-label">Empresa</div>
            <div class="kpi-value">${escapeHtml(state.company.name)}</div>
          </div>
        </div>
        <button class="kpi-link" type="button" data-view-target="empresa">Ver dados da empresa ${moduleIcon("arrow")}</button>
      </article>

      <article class="kpi-card" style="--accent-line:#46D9F5;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(70,217,245,0.4); color:#46D9F5;">${moduleIcon("modulos")}</div>
          <div>
            <div class="kpi-label">Registros do SGQ</div>
            <div class="kpi-value big">${summary.totalRecords}</div>
          </div>
        </div>
        <div class="kpi-caption">${summary.openActions} ações ou itens em acompanhamento</div>
      </article>

      <article class="kpi-card" style="--accent-line:#F2B705;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(242,183,5,0.4); color:#F2B705;">${moduleIcon("plano")}</div>
          <div>
            <div class="kpi-label">Plano contratado</div>
            <div class="kpi-value">${escapeHtml(state.settings.companyAccess)}</div>
          </div>
        </div>
        <button class="kpi-link" type="button" data-view-target="configuracoes">Ver detalhes do plano ${moduleIcon("arrow")}</button>
      </article>

      <article class="kpi-card" style="--accent-line:#34D399;">
        <div class="kpi-top">
          <div class="kpi-icon" style="border-color:rgba(52,211,153,0.4); color:#34D399;">${moduleIcon("check-circle")}</div>
          <div>
            <div class="kpi-label">Certificação</div>
            <div class="kpi-value">${escapeHtml(state.company.certification)}</div>
          </div>
        </div>
        <div class="kpi-caption">Escopo: ${escapeHtml(shortText(state.company.scope, 54))}</div>
      </article>
    </div>

    <div class="modules-section">
      <div class="section-hd">
        <h2 class="section-title">Meus módulos</h2>
        <p class="section-sub">Os cartões abaixo refletem os dados cadastrados nos módulos do QualityPro Cloud.</p>
      </div>
      <div class="modules-grid">
        ${moduleCards}
      </div>
    </div>
  `;
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
        value: `${users.length} usuários`,
        caption: `${state.company.certification} · ${state.settings.companyAccess}`,
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
  return ["Aprovado", "Atingido", "Concluído", "Concluída", "Fechado", "Fechada", "Resolvido", "Resolvida"].includes(status);
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
  const moduleOrder = ["contexto", "lideranca", "riscos", "documentos", "nao-conformidades", "auditorias"];
  const activeModules = moduleOrder
    .map((id) => modules.find((module) => module.id === id))
    .filter(Boolean);
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
        <div class="kpi-caption muted">1 módulo disponível para contratação</div>
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

      <div class="mymods-grid">
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
                    <div class="mymod-plan">${isAudit ? "Módulo adicional contratado à parte" : "Incluído no Plano Professional"}</div>
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

      <div class="mymods-banner">
        <div class="mymods-banner-text">
          <div class="mymods-banner-icon">${moduleIcon("info")}</div>
          <div>
            <p class="mymods-banner-title">Sua empresa contratou ${activeModules.length} de ${modules.length} módulos disponíveis no QualityPro Cloud.</p>
            <p class="mymods-banner-sub">Conheça o módulo Equipamentos de Medição e outros recursos disponíveis para o seu plano.</p>
          </div>
        </div>
        <button class="btn-ghost-cta" data-module="equipamentos" type="button">Ver módulo disponível ${moduleIcon("arrow")}</button>
      </div>
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
  if (moduleId === "contexto") {
    renderContextModule();
    return;
  }

  if (moduleId === "riscos") {
    renderRiskOpportunityModule();
    return;
  }

  pageContent.classList.remove("risk-page-content");
  pageContent.classList.remove("context-page-content");
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
  if (normalized.includes("conclu") || normalized.includes("atingid") || normalized.includes("tratado")) return "s-done";
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
        <button class="btn-grad" data-risk-action="new-risk" type="button">${moduleIcon("plus")}Novo item</button>
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
      <div class="toolbar-actions">
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
        <button class="btn-grad" data-context-action="new-swot" type="button">${moduleIcon("plus")}Novo item</button>
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
        <button class="btn-grad" data-context-action="new-parte" type="button">${moduleIcon("plus")}Nova parte interessada</button>
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
            <textarea id="ctxEscopo-${key}">${escapeHtml(data[key] || "")}</textarea>
          </div>`).join("")}
        <div class="escopo-card full">
          <h4>Aprovação pela Alta Direção</h4>
          <div class="field-row3">
            <div class="field"><label>Status de aprovação</label><select class="input-basic" id="ctxEscopo-statusAprovacao">${["Pendente", "Aprovado", "Reprovado"].map((status) => `<option value="${status}" ${data.statusAprovacao === status ? "selected" : ""}>${status}</option>`).join("")}</select></div>
            <div class="field"><label>Aprovador</label><input class="input-basic" id="ctxEscopo-aprovador" type="text" value="${escapeHtml(data.aprovador || "")}"></div>
            <div class="field"><label>Data de aprovação</label><input class="input-basic" id="ctxEscopo-dataAprovacao" type="date" value="${escapeHtml(data.dataAprovacao || "")}"></div>
          </div>
        </div>
      </div>
      <div class="escopo-save-row">
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
        <button class="btn-grad" data-context-action="new-processo" type="button">${moduleIcon("plus")}Novo processo</button>
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
        <button class="btn-grad" data-risk-action="new-goal" type="button">${moduleIcon("plus")}Novo objetivo</button>
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
        <button class="btn-grad" data-risk-action="new-change" type="button">${moduleIcon("plus")}Nova mudança</button>
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

function renderEmpresa() {
  setTopbar("Empresa", "Dados principais da organização");
  pageContent.innerHTML = `
    ${viewHeader("Dados da empresa", "Atualize as informações que aparecem nos módulos do SGQ.")}
    <form class="qp-card qp-form" id="companyForm">
      <label><span>Razão social</span><input name="name" value="${escapeHtml(state.company.name)}" /></label>
      <label><span>CNPJ</span><input name="cnpj" value="${escapeHtml(state.company.cnpj)}" /></label>
      <label><span>Certificação</span><input name="certification" value="${escapeHtml(state.company.certification)}" /></label>
      <label class="full"><span>Escopo do SGQ</span><textarea name="scope" rows="4">${escapeHtml(state.company.scope)}</textarea></label>
      <button type="submit">Salvar empresa</button>
    </form>
  `;
  document.querySelector("#companyForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.company = Object.fromEntries(data.entries());
    saveState();
    toast("Dados da empresa salvos.");
  });
}

function renderUsuarios() {
  setTopbar("Usuários", "Controle de acesso da equipe");
  pageContent.innerHTML = `
    ${viewHeader("Usuários", "Cadastre pessoas que terão acesso ao SGQ Online.")}
    <form class="qp-card qp-form compact" id="userForm">
      <label><span>Nome</span><input name="name" required /></label>
      <label><span>E-mail</span><input name="email" type="email" required /></label>
      <label><span>Perfil</span><select name="role"><option>Administrador</option><option>Qualidade</option><option>Consulta</option></select></label>
      <button type="submit">Adicionar usuário</button>
    </form>
    ${dataTable("Usuários cadastrados", ["Nome", "E-mail", "Perfil", "Status"], state.users)}
  `;
  document.querySelector("#userForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    state.users.unshift({ ...data, status: "Ativo" });
    saveState();
    renderUsuarios();
    toast("Usuário adicionado.");
  });
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
  pageContent.innerHTML = `
    ${viewHeader("Relatórios", "Resumo executivo dos dados cadastrados no SGQ.")}
    <div class="qp-grid metrics">
      ${metric("Documentos", state.documents.length)}
      ${metric("Auditorias", state.audits.length)}
      ${metric("Não conformidades", state.ncs.length)}
      ${metric("Usuários", state.users.length)}
    </div>
    <article class="qp-card">
      <h3>Exportações</h3>
      <p class="qp-muted">Nesta primeira versão, os relatórios são exibidos em tela. A exportação em PDF/Excel entra na próxima etapa.</p>
    </article>
  `;
}

function renderConfiguracoes() {
  setTopbar("Configurações", "Preferências do sistema");
  pageContent.innerHTML = `
    ${viewHeader("Configurações", "Ajuste preferências iniciais do SGQ Online.")}
    <form class="qp-card qp-form" id="settingsForm">
      <label><span>Plano</span><input name="companyAccess" value="${escapeHtml(state.settings.companyAccess)}" /></label>
      <label>
        <span>Tema do sistema</span>
        <select name="theme">
          <option value="dark" ${state.settings.theme !== "light" ? "selected" : ""}>Escuro</option>
          <option value="light" ${state.settings.theme === "light" ? "selected" : ""}>Claro azul/branco</option>
        </select>
      </label>
      <label class="check-row"><input name="emailAlerts" type="checkbox" ${state.settings.emailAlerts ? "checked" : ""} /> <span>Enviar alertas por e-mail</span></label>
      <label class="check-row"><input name="weeklyReport" type="checkbox" ${state.settings.weeklyReport ? "checked" : ""} /> <span>Gerar resumo semanal</span></label>
      <button type="submit">Salvar configurações</button>
    </form>
  `;
  document.querySelector("#settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.settings = {
      companyAccess: data.get("companyAccess"),
      emailAlerts: data.has("emailAlerts"),
      weeklyReport: data.has("weeklyReport"),
      theme: data.get("theme") || "dark",
    };
    saveState();
    applyTheme();
    toast("Configurações salvas.");
  });
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
