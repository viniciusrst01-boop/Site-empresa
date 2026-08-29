const STATUS_OPTIONS = [
  "Conforme",
  "Não Conformidade Maior",
  "Não Conformidade Menor",
  "Oportunidade de Melhoria",
  "Não Aplicável",
];

const VERIFY_OPTIONS = ["Sim", "Não", "Pendente"];

const statusMeta = {
  "Conforme": { key: "conforme", color: "#177b55", className: "status-conforme", short: "Conforme" },
  "Oportunidade de Melhoria": { key: "melhoria", color: "#2f78b7", className: "status-melhoria", short: "Melhoria" },
  "Não Conformidade Menor": { key: "menor", color: "#b7791f", className: "status-menor", short: "NC menor" },
  "Não Conformidade Maior": { key: "maior", color: "#c43c34", className: "status-maior", short: "NC maior" },
  "Não Aplicável": { key: "na", color: "#7b8589", className: "status-na", short: "N/A" },
};

const STANDARD_TITLES = {
  "ISO 9001:2015": "Relatório de Auditoria ISO 9001",
  "ISO 14001:2015": "Relatório de Auditoria ISO 14001",
  "ISO 45001:2018": "Relatório de Auditoria ISO 45001",
  "ISO/IEC 27001:2022": "Relatório de Auditoria ISO/IEC 27001",
  "Personalizada": "Relatório de Auditoria Personalizada",
};

const STANDARD_OBJECTIVES = {
  "ISO 9001:2015":
    "Verificar a conformidade do Sistema de Gestão da Qualidade da organização com os requisitos da ISO 9001:2015, avaliar a eficácia dos processos e identificar oportunidades de melhoria.",
  "ISO 14001:2015":
    "Verificar a conformidade e a eficácia do sistema de gestão ambiental, considerando contexto, aspectos ambientais, controles operacionais, atendimento a obrigações aplicáveis e melhoria do desempenho ambiental.",
  "ISO 45001:2018":
    "Verificar a conformidade e a eficácia do sistema de gestão de saúde e segurança ocupacional, considerando perigos, riscos, controles operacionais, participação dos trabalhadores e melhoria do desempenho de SSO.",
  "ISO/IEC 27001:2022":
    "Verificar a conformidade e a eficácia do sistema de gestão de segurança da informação, considerando riscos, controles, proteção de ativos, tratamento de incidentes e melhoria contínua.",
  "Personalizada":
    "Verificar a conformidade do sistema auditado com os critérios definidos para a auditoria, avaliar a eficácia dos processos e identificar oportunidades de melhoria.",
};

const generalFields = [
  ["standard", "Norma auditada", "standard"],
  ["empresa", "Empresa auditada"],
  ["unidade", "Unidade / local"],
  ["cnpj", "CNPJ"],
  ["numeroAuditoria", "Nº da auditoria"],
  ["tipoAuditoria", "Tipo de auditoria"],
  ["periodo", "Data da auditoria"],
  ["escopo", "Escopo da auditoria", "textarea"],
  ["segmento", "Segmento"],
  ["auditorLider", "Auditor líder"],
  ["equipeAuditora", "Equipe auditora"],
  ["representante", "Representante da direção"],
  ["cargo", "Cargo"],
  ["objetivo", "Objetivo da auditoria", "textarea"],
  ["conclusao", "Conclusão geral", "textarea"],
];

const initialState = {
  general: {
    standard: "ISO 9001:2015",
    empresa: "",
    unidade: "",
    cnpj: "",
    numeroAuditoria: "",
    tipoAuditoria: "Interna",
    periodo: "",
    escopo: "",
    segmento: "",
    auditorLider: "",
    equipeAuditora: "",
    representante: "",
    cargo: "",
    objetivo:
      "Verificar a conformidade do Sistema de Gestão da Qualidade da organização com os requisitos da ISO 9001:2015, avaliar a eficácia dos processos e identificar oportunidades de melhoria.",
    conclusao: "",
  },
  checklist: [
    {
      id: "4.1",
      group: "4. Contexto da Organização",
      title: "Entendendo a organização e seu contexto",
      questions:
        "Quais são as questões internas e externas relevantes para o propósito e direção estratégica da organização? Como essas questões são monitoradas e analisadas criticamente?",
      documents: "FM 001 - MATRIZ SWOT",
      people: "123 - IGOR MELO - COORDENADOR",
      status: "Conforme",
      findings:
        "Conforme avaliado in-loco foi evidenciado o formulário que contempla toda estrutura e descrição das questões internas e externas da organização.",
    },
    {
      id: "4.2",
      group: "4. Contexto da Organização",
      title: "Necessidades e expectativas das partes interessadas",
      questions:
        "Quais são as partes interessadas pertinentes ao SGQ e quais são seus requisitos? Como essas informações são monitoradas e analisadas criticamente?",
      documents: "FM 002 - PARTES INTERESSADAS",
      people: "123 - VINICIUS - ANALISTA",
      status: "Não Conformidade Menor",
      findings:
        "Foi constatado que existe um formulário para partes interessadas, porém não contemplava todos os requisitos exigidos pela ISO e não estava sendo monitorado.",
    },
    {
      id: "4.3",
      group: "4. Contexto da Organização",
      title: "Determinação do escopo do SGQ",
      questions:
        "Qual é o escopo do SGQ e como foi determinado? Há exclusões de requisitos? Qual a justificativa? O escopo está documentado?",
      documents: "",
      people: "",
      status: "Não Conformidade Maior",
      findings: "",
    },
    {
      id: "4.4",
      group: "4. Contexto da Organização",
      title: "SGQ e seus processos",
      questions:
        "Quais são os processos necessários para o SGQ e como eles interagem? Como são definidos entradas, saídas, critérios, métodos e recursos para a operação eficaz desses processos? Como riscos e oportunidades desses processos são tratados?",
      documents: "",
      people: "",
      status: "Oportunidade de Melhoria",
      findings: "",
    },
    {
      id: "5.1",
      group: "5. Liderança",
      title: "Liderança e comprometimento",
      questions:
        "Como a Alta Direção demonstra liderança e comprometimento com o SGQ? A política e os objetivos da qualidade são compatíveis com o contexto e a direção estratégica?",
      documents: "",
      people: "",
      status: "Não Aplicável",
      findings: "",
    },
    {
      id: "5.2",
      group: "5. Liderança",
      title: "Política da Qualidade",
      questions:
        "A política da qualidade está documentada, comunicada e compreendida na organização? É apropriada ao propósito da organização e disponível às partes interessadas pertinentes?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "5.3",
      group: "5. Liderança",
      title: "Papéis, responsabilidades e autoridades",
      questions:
        "As responsabilidades e autoridades estão definidas, comunicadas e entendidas? Quem é responsável por assegurar a conformidade do SGQ e relatar seu desempenho à Alta Direção?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "6.1",
      group: "6. Planejamento",
      title: "Ações para abordar riscos e oportunidades",
      questions:
        "Como a organização determina riscos e oportunidades que precisam ser abordados? Que ações foram planejadas para tratá-los? Como sua eficácia é avaliada?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "6.2",
      group: "6. Planejamento",
      title: "Objetivos da Qualidade e planejamento",
      questions:
        "Quais são os objetivos da qualidade estabelecidos para as funções, níveis e processos pertinentes? Os objetivos são mensuráveis, monitorados e comunicados? Existe planejamento de como alcançá-los?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "6.3",
      group: "6. Planejamento",
      title: "Planejamento de mudanças",
      questions:
        "Como as mudanças no SGQ são planejadas de forma sistemática? São considerados propósito, consequências, integridade do SGQ, recursos e responsabilidades?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "7.1",
      group: "7. Apoio",
      title: "Recursos",
      questions:
        "Como são determinados e providos os recursos necessários? Os equipamentos de monitoramento e medição são calibrados ou verificados?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "7.2",
      group: "7. Apoio",
      title: "Competência",
      questions:
        "Como é determinada a competência necessária das pessoas que afetam o desempenho do SGQ? Como são tratadas lacunas de competência? Existem registros de treinamento e competência?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "7.3",
      group: "7. Apoio",
      title: "Conscientização",
      questions:
        "As pessoas estão cientes da política da qualidade, dos objetivos pertinentes e de sua contribuição para o SGQ? Elas entendem as implicações de não atender aos requisitos do SGQ?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "7.4",
      group: "7. Apoio",
      title: "Comunicação",
      questions:
        "Como a organização determina as comunicações internas e externas pertinentes ao SGQ?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "7.5",
      group: "7. Apoio",
      title: "Informação documentada",
      questions:
        "Como é controlada a informação documentada exigida pela norma e pela organização? Existe uma lista mestra de documentos e registros atualizada?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "8.1",
      group: "8. Operação",
      title: "Planejamento e controle operacional",
      questions:
        "Como são planejados, implementados e controlados os processos para atender aos requisitos de produtos e serviços?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "8.2",
      group: "8. Operação",
      title: "Requisitos para produtos e serviços",
      questions:
        "Como é feita a comunicação com o cliente? Como são analisados criticamente os requisitos antes do compromisso de fornecer produtos/serviços?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "8.3",
      group: "8. Operação",
      title: "Projeto e desenvolvimento",
      questions:
        "Existe processo de projeto e desenvolvimento definido? Como são tratadas as revisões, verificações e validações de projeto?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "8.4",
      group: "8. Operação",
      title: "Controle de processos/produtos/serviços providos externamente",
      questions:
        "Como são avaliados, selecionados e monitorados os fornecedores externos? Que tipo e extensão de controle é aplicado?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "8.5",
      group: "8. Operação",
      title: "Produção e provisão de serviço",
      questions:
        "As condições controladas incluem informação documentada, recursos de medição e ações para evitar erro humano?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "8.6",
      group: "8. Operação",
      title: "Liberação de produtos e serviços",
      questions:
        "Como é verificado, antes da liberação, que os requisitos foram atendidos? Existem evidências de conformidade e rastreabilidade?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "8.7",
      group: "8. Operação",
      title: "Controle de saídas não conformes",
      questions:
        "Como são identificadas e controladas saídas não conformes, evitando seu uso ou entrega não pretendidos?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "9.1",
      group: "9. Avaliação de Desempenho",
      title: "Monitoramento, medição, análise e avaliação",
      questions:
        "O que é monitorado e medido, com quais métodos, e quando os resultados são analisados e avaliados?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "9.2",
      group: "9. Avaliação de Desempenho",
      title: "Auditoria interna",
      questions:
        "Existe programa de auditoria interna com critérios, escopo, frequência e métodos definidos?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "9.3",
      group: "9. Avaliação de Desempenho",
      title: "Análise crítica pela direção",
      questions:
        "A Alta Direção realiza análises críticas do SGQ em intervalos planejados? As entradas e saídas atendem ao exigido pela norma?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "10.1",
      group: "10. Melhoria",
      title: "Generalidades",
      questions:
        "Como são determinadas e selecionadas oportunidades de melhoria e implementadas as ações necessárias?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "10.2",
      group: "10. Melhoria",
      title: "Não conformidade e ação corretiva",
      questions:
        "Como a organização reage às não conformidades? Como são avaliadas as causas e a eficácia das ações corretivas para prevenir recorrência?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
    {
      id: "10.3",
      group: "10. Melhoria",
      title: "Melhoria contínua",
      questions:
        "Como a organização melhora continuamente a adequação, suficiência e eficácia do SGQ?",
      documents: "",
      people: "",
      status: "",
      findings: "",
    },
  ],
  documentChecks: {},
  peopleChecks: {},
};

const STANDARD_BANKS = {
  "ISO 9001:2015": initialState.checklist,
  "ISO 14001:2015": [
    auditItem("4.1", "4. Contexto", "Contexto ambiental da organização", "Quais fatores internos e externos podem afetar o desempenho ambiental e o sistema de gestão ambiental? Como essas informações são acompanhadas?"),
    auditItem("4.2", "4. Contexto", "Partes interessadas e obrigações ambientais", "Quais partes interessadas possuem requisitos ambientais relevantes? Como requisitos legais e outros compromissos são identificados e mantidos?"),
    auditItem("4.3", "4. Contexto", "Escopo do sistema ambiental", "O escopo considera atividades, produtos, serviços, locais, limites organizacionais e impactos ambientais significativos?"),
    auditItem("5.1", "5. Liderança", "Liderança e comprometimento ambiental", "Como a direção demonstra compromisso com proteção ambiental, prevenção da poluição e melhoria do desempenho ambiental?"),
    auditItem("6.1", "6. Planejamento", "Aspectos, impactos, riscos e oportunidades", "Como a organização identifica aspectos ambientais, avalia impactos significativos e define ações para riscos e oportunidades?"),
    auditItem("6.2", "6. Planejamento", "Objetivos ambientais", "Os objetivos ambientais são mensuráveis, monitorados, comunicados e coerentes com os aspectos significativos e obrigações aplicáveis?"),
    auditItem("7.2", "7. Apoio", "Competência e conscientização ambiental", "As pessoas que executam atividades com impacto ambiental possuem competência e estão conscientes de suas responsabilidades?"),
    auditItem("7.5", "7. Apoio", "Informação documentada ambiental", "Os documentos e registros ambientais são controlados, atualizados, protegidos e disponíveis onde necessários?"),
    auditItem("8.1", "8. Operação", "Controle operacional ambiental", "Os processos associados a aspectos ambientais significativos possuem critérios, controles, comunicação e evidências de execução?"),
    auditItem("8.2", "8. Operação", "Preparação e resposta a emergências", "Há planos, testes e registros para responder a emergências ambientais previsíveis?"),
    auditItem("9.1", "9. Avaliação de desempenho", "Monitoramento e atendimento legal", "O desempenho ambiental e o atendimento a obrigações aplicáveis são monitorados, analisados e avaliados periodicamente?"),
    auditItem("10.2", "10. Melhoria", "Não conformidade e ação corretiva ambiental", "Como incidentes, desvios ambientais e não conformidades são tratados, investigados e verificados quanto à eficácia das ações?"),
  ],
  "ISO 45001:2018": [
    auditItem("4.1", "4. Contexto", "Contexto de saúde e segurança", "Quais fatores internos e externos influenciam o desempenho de saúde e segurança ocupacional? Como são analisados?"),
    auditItem("4.2", "4. Contexto", "Trabalhadores e partes interessadas", "Quais necessidades de trabalhadores, contratados e partes interessadas afetam o sistema de SSO?"),
    auditItem("5.1", "5. Liderança", "Liderança e cultura de prevenção", "Como a alta direção demonstra compromisso com ambientes seguros, prevenção de lesões e melhoria do desempenho de SSO?"),
    auditItem("5.4", "5. Liderança", "Consulta e participação", "Como trabalhadores e representantes participam da identificação de perigos, investigação de incidentes e melhoria do sistema?"),
    auditItem("6.1", "6. Planejamento", "Perigos, riscos e oportunidades", "Como perigos são identificados e riscos de SSO são avaliados, priorizados e tratados?"),
    auditItem("6.2", "6. Planejamento", "Objetivos de SSO", "Os objetivos de SSO são monitorados, comunicados e associados a planos de ação com responsáveis e prazos?"),
    auditItem("7.2", "7. Apoio", "Competência em SSO", "As pessoas que executam atividades críticas possuem treinamento, competência e evidências adequadas?"),
    auditItem("7.4", "7. Apoio", "Comunicação de SSO", "Como informações de SSO são comunicadas internamente, a contratados e a outras partes interessadas?"),
    auditItem("8.1", "8. Operação", "Controles operacionais", "Os controles operacionais, permissões de trabalho, EPIs, manutenção e gestão de mudanças estão definidos e evidenciados?"),
    auditItem("8.2", "8. Operação", "Emergências de SSO", "A organização identifica cenários de emergência, mantém planos, realiza simulados e registra aprendizados?"),
    auditItem("9.1", "9. Avaliação de desempenho", "Monitoramento de SSO", "Indicadores, inspeções, requisitos legais, incidentes e ações são monitorados e analisados criticamente?"),
    auditItem("10.2", "10. Melhoria", "Incidentes e ações corretivas", "Como incidentes, quase acidentes e não conformidades são registrados, investigados e tratados para evitar recorrência?"),
  ],
  "ISO/IEC 27001:2022": [
    auditItem("4.1", "4. Contexto", "Contexto de segurança da informação", "Quais fatores internos e externos afetam a segurança da informação e o sistema de gestão?"),
    auditItem("4.2", "4. Contexto", "Partes interessadas e requisitos", "Quais requisitos de clientes, legais, regulatórios e contratuais impactam a segurança da informação?"),
    auditItem("5.1", "5. Liderança", "Direção e política de segurança", "Como a liderança apoia a política, os objetivos e a integração da segurança da informação aos processos?"),
    auditItem("6.1", "6. Planejamento", "Riscos de segurança da informação", "Como riscos de segurança da informação são identificados, analisados, avaliados e tratados?"),
    auditItem("6.1A", "6. Planejamento", "Controles e plano de tratamento", "Os controles selecionados possuem justificativa, responsáveis, prazos, evidências e acompanhamento de implementação?"),
    auditItem("7.2", "7. Apoio", "Competência e conscientização", "As pessoas conhecem suas responsabilidades de segurança e recebem orientação proporcional aos riscos?"),
    auditItem("7.5", "7. Apoio", "Informação documentada do SGSI", "Políticas, procedimentos, registros e evidências do SGSI são controlados e protegidos?"),
    auditItem("8.1", "8. Operação", "Operação do tratamento de riscos", "O plano de tratamento de riscos é executado, monitorado e atualizado quando há mudanças relevantes?"),
    auditItem("8.2", "8. Operação", "Avaliação de riscos recorrente", "A avaliação de riscos é revista em intervalos planejados ou após mudanças, incidentes e novos ativos?"),
    auditItem("9.1", "9. Avaliação de desempenho", "Medição e monitoramento do SGSI", "Quais indicadores demonstram eficácia dos controles, tratamento de riscos e desempenho do SGSI?"),
    auditItem("9.2", "9. Avaliação de desempenho", "Auditoria interna do SGSI", "O programa de auditoria cobre processos, controles, riscos relevantes e resultados anteriores?"),
    auditItem("10.2", "10. Melhoria", "Incidentes, não conformidades e melhoria", "Como incidentes de segurança e não conformidades são tratados, investigados e convertidos em melhorias?"),
  ],
  "Personalizada": [
    auditItem("1", "1. Critérios", "Critérios e escopo da auditoria", "Quais critérios, requisitos, processos, áreas e limites serão considerados nesta auditoria?"),
    auditItem("2", "2. Evidências", "Documentos e registros", "Quais documentos, registros, indicadores ou sistemas serão usados como evidência objetiva?"),
    auditItem("3", "3. Pessoas", "Entrevistas e responsabilidades", "Quais pessoas devem ser entrevistadas e quais responsabilidades precisam ser confirmadas?"),
    auditItem("4", "4. Execução", "Conformidade do processo", "O processo auditado está sendo executado conforme critérios definidos e evidências disponíveis?"),
    auditItem("5", "5. Riscos", "Riscos, falhas e controles", "Quais riscos, falhas, desvios ou controles frágeis foram identificados durante a auditoria?"),
    auditItem("6", "6. Melhoria", "Ações e oportunidades", "Quais ações corretivas, preventivas ou oportunidades de melhoria devem ser registradas?"),
  ],
};

function auditItem(id, group, title, questions) {
  return { id, group, title, questions, documents: "", people: "", status: "", findings: "" };
}

let state = loadState();
let visualModel = localStorage.getItem("auditpro-visual-model") || "qualicheck";

function loadState() {
  const saved = localStorage.getItem("auditpro-state");
  if (!saved) return structuredClone(initialState);
  try {
    const parsed = JSON.parse(saved);
    const standard = parsed.general?.standard || initialState.general.standard;
    return {
      ...structuredClone(initialState),
      ...parsed,
      general: { ...initialState.general, ...parsed.general },
      checklist: mergeChecklist(parsed.checklist || [], standard),
      documentChecks: parsed.documentChecks || {},
      peopleChecks: parsed.peopleChecks || {},
    };
  } catch {
    return structuredClone(initialState);
  }
}

function mergeChecklist(items, standard = initialState.general.standard) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return getStandardChecklist(standard).map((item) => ({ ...item, ...(byId.get(item.id) || {}) }));
}

function getStandardChecklist(standard) {
  return (STANDARD_BANKS[standard] || STANDARD_BANKS[initialState.general.standard]).map((item) => ({ ...item }));
}

function getBlankChecklist(standard = initialState.general.standard) {
  return getStandardChecklist(standard).map((item) => ({
    ...item,
    documents: "",
    people: "",
    status: "",
    findings: "",
  }));
}

function getBlankGeneral(standard = initialState.general.standard) {
  return {
    ...initialState.general,
    standard,
    empresa: "",
    unidade: "",
    cnpj: "",
    numeroAuditoria: "",
    tipoAuditoria: "Interna",
    periodo: "",
    escopo: "",
    segmento: "",
    auditorLider: "",
    equipeAuditora: "",
    representante: "",
    cargo: "",
    objetivo: STANDARD_OBJECTIVES[standard] || STANDARD_OBJECTIVES.Personalizada,
    conclusao: "",
  };
}

function getBlankState(standard = initialState.general.standard) {
  return {
    general: getBlankGeneral(standard),
    checklist: getBlankChecklist(standard),
    documentChecks: {},
    peopleChecks: {},
  };
}

function getStandardTitle() {
  return STANDARD_TITLES[state.general.standard] || STANDARD_TITLES.Personalizada;
}

function renderTitles() {
  const title = getStandardTitle();
  document.getElementById("appTitle").textContent = title;
  document.getElementById("reportTitle").textContent = `${title}${state.general.standard === "Personalizada" ? "" : ` - ${state.general.standard}`}`;
  document.getElementById("brandStandard").textContent = state.general.standard;
}

function hasChecklistInput() {
  return state.checklist.some((item) => item.status || item.documents || item.people || item.findings);
}

function changeStandard(nextStandard) {
  if (nextStandard === state.general.standard) return;
  if (hasChecklistInput()) {
    const ok = confirm("Trocar a norma substitui o checklist atual e limpa os cruzamentos de documentos/RH. Deseja continuar?");
    if (!ok) {
      renderAll();
      return;
    }
  }
  state.general.standard = nextStandard;
  state.general.objetivo = STANDARD_OBJECTIVES[nextStandard] || STANDARD_OBJECTIVES.Personalizada;
  state.checklist = getBlankChecklist(nextStandard);
  state.documentChecks = {};
  state.peopleChecks = {};
  saveState();
  renderAll();
}

function saveState() {
  localStorage.setItem("auditpro-state", JSON.stringify(state));
}

function resetAuditData() {
  const standard = state.general.standard || initialState.general.standard;
  localStorage.removeItem("auditpro-state");
  state = getBlankState(standard);
  saveState();
  const importFile = document.getElementById("importFile");
  if (importFile) importFile.value = "";
  renderAll();
}

function hasPersistedAudit() {
  return Boolean(localStorage.getItem("auditpro-state"));
}

function populateStartStandards() {
  const select = document.getElementById("startStandard");
  if (!select) return;
  select.innerHTML = "";
  Object.keys(STANDARD_BANKS).forEach((standard) => {
    const option = document.createElement("option");
    option.value = standard;
    option.textContent = standard;
    select.append(option);
  });
  select.value = state.general.standard || initialState.general.standard;
}

function enterAuditApp(viewName = "dados") {
  document.body.classList.add("audit-active");
  document.body.classList.remove("start-active");
  setActiveView(viewName);
}

function startConsultoria(targetView = "dados") {
  const select = document.getElementById("startStandard");
  const selectedStandard = select?.value || initialState.general.standard;
  const hasSavedAudit = hasPersistedAudit();
  const hasCurrentInput = hasSavedAudit && hasChecklistInput();

  if (hasCurrentInput && selectedStandard !== state.general.standard) {
    const ok = confirm("Iniciar com outra norma substitui o checklist atual e limpa os cruzamentos. Deseja continuar?");
    if (!ok) return;
  }

  if (!hasSavedAudit || selectedStandard !== state.general.standard) {
    state = getBlankState(selectedStandard);
    saveState();
  }

  renderAll();
  enterAuditApp(targetView);
}

function initStartScreen() {
  populateStartStandards();
  document.body.classList.add("start-active");
  document.body.classList.remove("audit-active");
  document.getElementById("startConsultoriaBtn")?.addEventListener("click", () => startConsultoria("dados"));
  document.querySelectorAll("[data-start-view]").forEach((button) => {
    button.addEventListener("click", () => startConsultoria(button.dataset.startView || "dados"));
  });
}

function applyVisualModel(model) {
  visualModel = model === "classic" ? "classic" : "qualicheck";
  document.body.classList.toggle("theme-classic", visualModel === "classic");
  document.body.classList.toggle("theme-qualicheck", visualModel === "qualicheck");
  localStorage.setItem("auditpro-visual-model", visualModel);
  renderDashboard();
  renderReport();
}

function showModelChooser() {
  document.getElementById("modelChooser").classList.add("show");
}

function hideModelChooser() {
  document.getElementById("modelChooser").classList.remove("show");
}

function getCounts() {
  const counts = { conforme: 0, melhoria: 0, menor: 0, maior: 0, na: 0, total: 0, preenchidos: 0 };
  state.checklist.forEach((item) => {
    if (!item.status) return;
    const meta = statusMeta[item.status];
    if (!meta) return;
    counts[meta.key] += 1;
    counts.total += 1;
    if (item.status !== "Não Aplicável") counts.preenchidos += 1;
  });
  return counts;
}

function getClassification() {
  const counts = getCounts();
  if (counts.maior > 0) {
    return {
      title: "Sistema Não Conforme",
      badge: "Não conforme",
      className: "status-maior",
      text: "Há não conformidade maior registrada. A conclusão sugerida é sistema não conforme até tratamento, análise de causa e verificação de eficácia.",
    };
  }
  if (counts.menor > 0 || counts.melhoria > 0) {
    return {
      title: "Sistema Conforme com Observações",
      badge: "Com observações",
      className: counts.menor > 0 ? "status-menor" : "status-melhoria",
      text: "Não há não conformidade maior, mas existem pontos que exigem ação, acompanhamento ou oportunidade formal de melhoria.",
    };
  }
  return {
    title: "Sistema Conforme",
    badge: "Conforme",
    className: "status-conforme",
    text: "Os itens preenchidos indicam conformidade do SGQ com os requisitos avaliados.",
  };
}

function getRequirementStats() {
  const stats = new Map();
  state.checklist.forEach((item) => {
    if (!stats.has(item.group)) {
      stats.set(item.group, { group: item.group, total: 0, conforme: 0, melhoria: 0, menor: 0, maior: 0, na: 0 });
    }
    if (!item.status) return;
    const row = stats.get(item.group);
    const meta = statusMeta[item.status];
    row.total += 1;
    row[meta.key] += 1;
  });
  return [...stats.values()];
}

function getDocuments() {
  return state.checklist
    .filter((item) => item.documents.trim())
    .map((item, index) => ({
      id: `${item.id}-${item.documents}`,
      number: index + 1,
      clause: item.id,
      value: item.documents,
      verified: state.documentChecks[`${item.id}-${item.documents}`]?.verified || "Pendente",
      notes: state.documentChecks[`${item.id}-${item.documents}`]?.notes || "",
    }));
}

function getPeople() {
  return state.checklist
    .filter((item) => item.people.trim())
    .map((item, index) => ({
      id: `${item.id}-${item.people}`,
      number: index + 1,
      clause: item.id,
      value: item.people,
      verified: state.peopleChecks[`${item.id}-${item.people}`]?.verified || "Pendente",
      notes: state.peopleChecks[`${item.id}-${item.people}`]?.notes || "",
    }));
}

function pendingCount(rows) {
  return rows.filter((row) => row.verified !== "Sim").length;
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.append(child));
  return node;
}

function renderGeneralForm() {
  const form = document.getElementById("generalForm");
  form.innerHTML = "";
  generalFields.forEach(([key, label, type]) => {
    const input =
      type === "textarea"
        ? el("textarea", { id: `general-${key}` })
        : el(key === "tipoAuditoria" || type === "standard" ? "select" : "input", { id: `general-${key}`, type: "text" });
    if (type === "standard") {
      Object.keys(STANDARD_BANKS).forEach((option) => {
        input.append(el("option", { value: option, text: option }));
      });
    }
    if (key === "tipoAuditoria") {
      ["Interna", "1ª Parte", "2ª Parte", "3ª Parte"].forEach((option) => {
        input.append(el("option", { value: option, text: option }));
      });
    }
    input.value = state.general[key] || "";
    if (type === "standard") {
      input.addEventListener("change", () => changeStandard(input.value));
      form.append(el("label", { className: "field" }, [el("span", { text: label }), input]));
      return;
    }
    input.addEventListener("input", () => {
      state.general[key] = input.value;
      saveState();
    });
    input.addEventListener("change", renderAll);
    input.addEventListener("blur", renderAll);
    form.append(el("label", { className: `field ${type === "textarea" ? "field-wide" : ""}` }, [
      el("span", { text: label }),
      input,
    ]));
  });
}

function renderFilters() {
  const requirementFilter = document.getElementById("requirementFilter");
  const currentRequirement = requirementFilter.value;
  requirementFilter.innerHTML = "";
  requirementFilter.append(el("option", { value: "", text: "Todos os requisitos" }));
  [...new Set(state.checklist.map((item) => item.group))].forEach((group) => {
    requirementFilter.append(el("option", { value: group, text: group }));
  });
  requirementFilter.value = currentRequirement;

  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter.options.length === 1) {
    STATUS_OPTIONS.forEach((status) => statusFilter.append(el("option", { value: status, text: status })));
  }
}

function renderChecklist() {
  renderFilters();
  const requirement = document.getElementById("requirementFilter").value;
  const status = document.getElementById("statusFilter").value;
  const rows = document.getElementById("checklistRows");
  rows.innerHTML = "";
  state.checklist
    .filter((item) => !requirement || item.group === requirement)
    .filter((item) => !status || item.status === status)
    .forEach((item) => {
      const statusSelect = el("select");
      statusSelect.append(el("option", { value: "", text: "Sem status" }));
      STATUS_OPTIONS.forEach((option) => statusSelect.append(el("option", { value: option, text: option })));
      statusSelect.value = item.status;
      statusSelect.addEventListener("change", () => updateChecklist(item.id, "status", statusSelect.value, true));

      const docs = textArea(item.documents, (value) => updateChecklist(item.id, "documents", value));
      const people = textArea(item.people, (value) => updateChecklist(item.id, "people", value));
      const findings = textArea(item.findings, (value) => updateChecklist(item.id, "findings", value));

      rows.append(
        el("article", { className: "checklist-item" }, [
          el("div", { className: "checklist-meta" }, [
            el("strong", { text: item.id }),
            el("span", { text: item.group }),
            statusSelect,
          ]),
          el("div", { className: "checklist-body" }, [
            el("h3", { text: item.title }),
            el("div", { className: "question-box", text: item.questions }),
            el("div", { className: "item-grid" }, [
              fieldShell("Documentos e registros apresentados", docs),
              fieldShell("Pessoas entrevistadas / cargo / função", people),
            ]),
            fieldShell("Constatações", findings),
          ]),
        ])
      );
    });
}

function textArea(value, onInput) {
  const input = el("textarea");
  input.value = value || "";
  input.addEventListener("input", () => onInput(input.value));
  input.addEventListener("blur", renderAll);
  return input;
}

function fieldShell(label, input) {
  return el("label", { className: "field" }, [el("span", { text: label }), input]);
}

function updateChecklist(id, key, value, shouldRender = false) {
  state.checklist = state.checklist.map((item) => (item.id === id ? { ...item, [key]: value } : item));
  saveState();
  if (shouldRender) renderAll();
}

function renderCrossChecks(kind) {
  const rows = kind === "documents" ? getDocuments() : getPeople();
  const container = document.getElementById(kind === "documents" ? "documentRows" : "personRows");
  const count = document.getElementById(kind === "documents" ? "docCount" : "personCount");
  count.textContent = `${rows.length} itens`;
  container.innerHTML = "";
  container.append(
    el("div", { className: "table-row header" }, [
      el("div", { text: "Nº" }),
      el("div", { text: "Cláusula" }),
      el("div", { text: kind === "documents" ? "Documento / registro citado" : "Pessoa entrevistada / cargo" }),
      el("div", { text: kind === "documents" ? "Lista mestra" : "Verificado RH" }),
      el("div", { text: "Observações" }),
    ])
  );
  rows.forEach((row) => {
    const select = el("select");
    VERIFY_OPTIONS.forEach((option) => select.append(el("option", { value: option, text: option })));
    select.value = row.verified;
    select.addEventListener("change", () => updateCheck(kind, row.id, "verified", select.value, true));
    const notes = textArea(row.notes, (value) => updateCheck(kind, row.id, "notes", value));
    container.append(
      el("div", { className: "table-row" }, [
        el("div", { className: "table-cell", text: String(row.number) }),
        el("div", { className: "table-cell", text: row.clause }),
        el("div", { className: "table-cell", text: row.value }),
        el("div", { className: "table-cell" }, [select]),
        el("div", { className: "table-cell" }, [notes]),
      ])
    );
  });
}

function updateCheck(kind, id, key, value, shouldRender = false) {
  const bucket = kind === "documents" ? "documentChecks" : "peopleChecks";
  state[bucket][id] = { ...(state[bucket][id] || {}), [key]: value };
  saveState();
  if (shouldRender) renderAll();
}

function renderDashboard() {
  const counts = getCounts();
  const docs = getDocuments();
  const people = getPeople();
  const classification = getClassification();
  document.getElementById("metricConforme").textContent = counts.conforme;
  document.getElementById("metricMelhoria").textContent = counts.melhoria;
  document.getElementById("metricMenor").textContent = counts.menor;
  document.getElementById("metricMaior").textContent = counts.maior;
  document.getElementById("totalAuditado").textContent = `${counts.total} itens`;
  document.getElementById("pendingDocs").textContent = pendingCount(docs);
  document.getElementById("pendingPeople").textContent = pendingCount(people);
  document.getElementById("classificationTitle").textContent = classification.title;
  document.getElementById("classificationText").textContent = classification.text;
  const badge = document.getElementById("classificationBadge");
  badge.textContent = classification.badge;
  badge.className = `status-pill ${classification.className}`;
  drawStatusChart("statusChart", counts);
  renderRequirementBars();
  renderCriticalList();
}

function renderRequirementBars() {
  const container = document.getElementById("requirementBars");
  const stats = getRequirementStats();
  const max = Math.max(1, ...stats.map((row) => row.maior + row.menor + row.melhoria));
  container.innerHTML = "";
  stats.forEach((row) => {
    const risk = row.maior + row.menor + row.melhoria;
    const pct = Math.round((risk / max) * 100);
    container.append(
      el("div", { className: "bar-row" }, [
        el("span", { text: row.group }),
        el("div", { className: "bar-track" }, [
          el("div", {
            className: "bar-fill",
            style: `width:${pct}%;background:${row.maior ? "#c43c34" : row.menor ? "#b7791f" : "#2f78b7"}`,
          }),
        ]),
        el("strong", { text: String(risk) }),
      ])
    );
  });
}

function renderCriticalList() {
  const container = document.getElementById("criticalList");
  const critical = state.checklist.filter((item) =>
    ["Não Conformidade Maior", "Não Conformidade Menor", "Oportunidade de Melhoria"].includes(item.status)
  );
  container.innerHTML = "";
  if (!critical.length) {
    container.append(el("p", { className: "muted", text: "Nenhuma constatação crítica registrada." }));
    return;
  }
  critical.slice(0, 6).forEach((item) => {
    const meta = statusMeta[item.status];
    container.append(
      el("div", { className: "critical-item" }, [
        el("span", { className: `status-pill ${meta.className}`, text: meta.short }),
        el("strong", { text: `${item.id} - ${item.title}` }),
        el("span", { text: item.findings || "Constatação ainda sem descrição." }),
      ])
    );
  });
}

function drawStatusChart(canvasId, counts) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const isClassic = document.body.classList.contains("theme-classic");
  const labelColor = isClassic ? "#17201c" : "#f8fafc";
  const trackColor = isClassic ? "#e8ecef" : "rgba(255, 255, 255, 0.08)";
  const entries = [
    ["Conformidades", counts.conforme, "#6ee7b7"],
    ["Oportunidades", counts.melhoria, "#67e8f9"],
    ["NC menores", counts.menor, "#fcd34d"],
    ["NC maiores", counts.maior, "#fca5a5"],
    ["N/A", counts.na, "#94a3b8"],
  ];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px Arial";
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  entries.forEach(([label, value, color], index) => {
    const y = 34 + index * 54;
    const width = Math.round((value / max) * 430);
    ctx.fillStyle = trackColor;
    ctx.fillRect(160, y - 18, 430, 24);
    ctx.fillStyle = color;
    ctx.fillRect(160, y - 18, width, 24);
    ctx.fillStyle = labelColor;
    ctx.fillText(label, 18, y);
    ctx.font = "bold 15px Arial";
    ctx.fillText(String(value), 606, y);
    ctx.font = "14px Arial";
  });
}

function renderReport() {
  const counts = getCounts();
  const docs = getDocuments();
  const people = getPeople();
  const classification = getClassification();
  renderTitles();
  document.getElementById("reportSubtitle").textContent = state.general.numeroAuditoria
    ? `Auditoria nº ${state.general.numeroAuditoria}`
    : "Relatório gerado a partir do checklist de auditoria";
  document.getElementById("reportObjective").textContent = state.general.objetivo;
  document.getElementById("reportConclusion").textContent =
    state.general.conclusao || classification.text;
  document.getElementById("reportClassification").textContent = `Classificação geral: ${classification.title}`;

  const general = document.getElementById("reportGeneral");
  general.innerHTML = "";
  [
    ["Empresa auditada", state.general.empresa],
    ["Unidade / local", state.general.unidade],
    ["CNPJ", state.general.cnpj],
    ["Nº da auditoria", state.general.numeroAuditoria],
    ["Tipo de auditoria", state.general.tipoAuditoria],
    ["Data da auditoria", state.general.periodo],
    ["Escopo", state.general.escopo],
    ["Segmento", state.general.segmento],
    ["Auditor líder", state.general.auditorLider],
    ["Equipe auditora", state.general.equipeAuditora],
    ["Representante da direção", state.general.representante],
    ["Cargo", state.general.cargo],
  ].forEach(([label, value]) => {
    general.append(el("div", {}, [el("strong", { text: label }), document.createTextNode(value || "-")]));
  });

  const metrics = document.getElementById("reportMetrics");
  metrics.innerHTML = "";
  [
    ["Conformidades", counts.conforme],
    ["Oportunidades de melhoria", counts.melhoria],
    ["Não conformidades menores", counts.menor],
    ["Não conformidades maiores", counts.maior],
    ["Não aplicável", counts.na],
    ["Total preenchido", counts.total],
  ].forEach(([label, value]) => {
    metrics.append(el("div", {}, [el("strong", { text: label }), document.createTextNode(String(value))]));
  });
  drawStatusChart("reportChart", counts);
  renderReportRequirementTable();
  renderReportCrossChecks(docs, people);
  renderReportFindings();
}

function renderReportRequirementTable() {
  const table = document.getElementById("reportRequirementTable");
  table.innerHTML = "";
  ["Requisito", "Conf.", "Melh.", "NC menor", "NC maior"].forEach((head) => {
    table.append(el("div", { className: "head", text: head }));
  });
  getRequirementStats().forEach((row) => {
    [row.group, row.conforme, row.melhoria, row.menor, row.maior].forEach((value) => {
      table.append(el("div", { text: String(value) }));
    });
  });
}

function renderReportCrossChecks(docs, people) {
  const table = document.getElementById("reportCrossChecks");
  table.innerHTML = "";
  ["Cruzamento", "Total", "Sim", "Não", "Pendente"].forEach((head) => table.append(el("div", { className: "head", text: head })));
  [
    ["Informação documentada", docs],
    ["Competência / RH", people],
  ].forEach(([label, rows]) => {
    const sim = rows.filter((row) => row.verified === "Sim").length;
    const nao = rows.filter((row) => row.verified === "Não").length;
    const pendente = rows.filter((row) => row.verified === "Pendente").length;
    [label, rows.length, sim, nao, pendente].forEach((value) => table.append(el("div", { text: String(value) })));
  });
}

function renderReportFindings() {
  const table = document.getElementById("reportFindings");
  table.innerHTML = "";
  ["Cláusula", "Status", "Constatação", "Documento", "Pessoa"].forEach((head) =>
    table.append(el("div", { className: "head", text: head }))
  );
  state.checklist
    .filter((item) => item.status && item.status !== "Conforme" && item.status !== "Não Aplicável")
    .forEach((item) => {
      [item.id, item.status, item.findings || "-", item.documents || "-", item.people || "-"].forEach((value) =>
        table.append(el("div", { text: value }))
      );
    });
}

function copyReportText() {
  const classification = getClassification();
  const counts = getCounts();
  const lines = [
    `AUDITPRO - ${getStandardTitle().toUpperCase()}${state.general.standard === "Personalizada" ? "" : ` - ${state.general.standard}`}`,
    `Empresa: ${state.general.empresa || "-"}`,
    `Auditoria: ${state.general.numeroAuditoria || "-"}`,
    `Classificação geral: ${classification.title}`,
    "",
    `Conformidades: ${counts.conforme}`,
    `Oportunidades de melhoria: ${counts.melhoria}`,
    `Não conformidades menores: ${counts.menor}`,
    `Não conformidades maiores: ${counts.maior}`,
    "",
    "Constatações:",
    ...state.checklist
      .filter((item) => item.status)
      .map((item) => `${item.id} - ${item.title} | ${item.status} | ${item.findings || "-"}`),
  ];
  navigator.clipboard.writeText(lines.join("\n"));
}

function getActiveView() {
  return document.querySelector(".nav-button.active")?.dataset.view || "dashboard";
}

function setActiveView(viewName) {
  document.querySelectorAll(".nav-button").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewName);
  });
  document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
  document.getElementById(`view-${viewName}`).classList.add("active");
  renderAll();
}

function exportPdf() {
  const previousView = getActiveView();
  setActiveView("relatorio");

  const restoreView = () => {
    setActiveView(previousView);
    window.removeEventListener("afterprint", restoreView);
  };

  window.addEventListener("afterprint", restoreView);
  window.setTimeout(() => window.print(), 100);
}

function importState(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state = {
        ...structuredClone(initialState),
        ...imported,
        general: { ...initialState.general, ...imported.general },
        checklist: mergeChecklist(imported.checklist || []),
        documentChecks: imported.documentChecks || {},
        peopleChecks: imported.peopleChecks || {},
      };
      saveState();
      renderAll();
    } catch {
      alert("Arquivo JSON inválido.");
    }
  };
  reader.readAsText(file);
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.view);
    });
  });
  document.getElementById("requirementFilter").addEventListener("change", renderChecklist);
  document.getElementById("statusFilter").addEventListener("change", renderChecklist);
  document.getElementById("modelBtn")?.addEventListener("click", showModelChooser);
  document.querySelectorAll("[data-model-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      applyVisualModel(button.dataset.modelChoice);
      hideModelChooser();
    });
  });
  document.getElementById("exportBtn").addEventListener("click", exportPdf);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", (event) => {
    if (event.target.files[0]) importState(event.target.files[0]);
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Limpar todos os dados preenchidos desta auditoria?")) return;
    resetAuditData();
  });
  document.getElementById("printBtn").addEventListener("click", exportPdf);
  document.getElementById("copyReportBtn").addEventListener("click", copyReportText);
}

function renderAll() {
  renderTitles();
  renderGeneralForm();
  renderChecklist();
  renderCrossChecks("documents");
  renderCrossChecks("people");
  renderDashboard();
  renderReport();
}

bindEvents();
applyVisualModel(visualModel);
renderAll();
initStartScreen();
