const { healthObservation } = require('../sgq-health');

const SEED = 'quality-pro-demo-v2';
const companyName = 'Quality Pro Solutions';
const sectors = ['Direção', 'Gestão da Qualidade', 'Consultoria e Operações', 'Comercial', 'Administrativo e Financeiro', 'Atendimento ao Cliente'];
const processNames = ['Direcionamento estratégico', 'Gestão do SGQ', 'Execução de consultorias', 'Propostas e contratos', 'Compras e infraestrutura', 'Atendimento e acompanhamento'];
const clients = ['Alpha Componentes Industriais', 'Orion Equipamentos', 'VerdeVale Alimentos', 'Integra Medical', 'NovaForma Embalagens', 'Lumina Tecnologia', 'Horizonte Logística', 'Prisma Serviços Industriais', 'Aurora Projetos', 'Vértice Serviços'];
const suppliers = ['NovaTech Serviços Empresariais', 'Prime Office Suprimentos', 'Atlas Treinamentos Corporativos', 'Nexa Cloud Sistemas', 'Sigma Serviços Contábeis', 'Horizonte Soluções Gráficas', 'Ponto Seguro Infraestrutura', 'Rota Certa Mobilidade'];
const risks = ['Indisponibilidade de consultores', 'Uso de modelo desatualizado', 'Interrupção de energia', 'Atrasos de deslocamento por chuvas', 'Perda de registros de projeto', 'Requisitos contratuais incompletos', 'Capacitação insuficiente', 'Dependência de fornecedor de nuvem', 'Ampliação de auditorias remotas', 'Padronização de propostas', 'Treinamento de consultores associados', 'Automação de verificação documental'];
const ncDescriptions = ['Checklist de diagnóstico sem revisão técnica', 'Prazo de entrega do relatório não atendido', 'Critério de aceitação ausente na proposta', 'Registro de treinamento incompleto', 'Versão obsoleta do modelo de plano de ação', 'Falha no registro de acompanhamento do cliente'];
const id = (prefix, n) => `${prefix}-${String(n + 1).padStart(4, '0')}`;

function buildScenario(users, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || new Date(`${today}T12:00:00Z`).toISOString().slice(0, 10) !== today) throw new Error('Data de referência inválida');
  const admin = users.find(u => u.username.toLowerCase() === 'viniciusrst');
  const hugo = users.find(u => u.username.toLowerCase() === 'hugo.melo');
  if (!admin || !hugo || hugo.status !== 'Ativo') throw new Error('Administrador global e hugo.melo ativo são necessários; nenhum usuário será criado ou ativado');
  const operational = users.filter(u => u.id !== admin.id);
  const active = [hugo, ...operational.filter(u => u.id !== hugo.id && u.status === 'Ativo')];
  const owner = n => active[n % active.length].display_name;
  const date = (offset, day = 3) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + offset); d.setUTCDate(day);
    return d.toISOString().slice(0, 10);
  };
  const past = (offset, day = 3) => { const value = date(offset, day); return value > today ? today : value; };
  const shift = (value, days) => { const d = new Date(`${value}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
  const registry = {
    direcao: active.map((u, n) => ({ id: n + 1, nome: u.display_name, cargo: n ? 'Gestor da Qualidade' : 'Diretor Geral', email: `direcao${n + 1}@qualitypro.example`, telefone: '(11) 5555-0101', responsabilidades: n ? 'Acompanhar processos, recursos, atendimento e melhoria contínua.' : 'Definir política, objetivos e recursos do SGQ.' })),
    setores: sectors.map((nome, n) => ({ id: n + 1, nome, responsavel: owner(n), colaboradores: [2, 3, 12, 4, 4, 3][n], descricao: processNames[n] })),
    fornecedores: suppliers.map((nome, n) => ({ id: n + 1, nome, cnpj: '', categoria: ['Serviços de TI', 'Suprimentos', 'Treinamento', 'Computação em nuvem', 'Contabilidade', 'Serviços gráficos', 'Infraestrutura', 'Transporte'][n], contato: `fornecedor${n + 1}@qualitypro.example` })),
    clientes: clients.map((nome, n) => ({ id: n + 1, nome, cnpj: '', segmento: ['Indústria', 'Serviços', 'Tecnologia'][n % 3], contato: `cliente${n + 1}@qualitypro.example` })),
  };
  const company = { name: companyName, tradeName: companyName, cnpj: '00.000.000/0001-00', segment: 'Consultoria em Gestão da Qualidade', size: 'pequena', cep: '00000-000', cityUf: 'São Paulo / SP', address: 'Avenida da Qualidade, 1250 - Sala 804', district: 'Centro Empresarial', phone: '(11) 5555-0101', email: 'contato@qualitypro.example', site: 'https://qualitypro.example', legalResponsibleName: hugo.display_name, legalResponsibleRole: 'Diretor Geral', logo: '', scope: 'Consultoria, implantação e manutenção de SGQ, auditorias e acompanhamento de processos. Operação nacional desde 2019, com 28 colaboradores.', certification: 'ISO 9001:2015', registry };
  const context = {
    swot: ['Equipe experiente em consultoria', 'Metodologia de diagnóstico padronizada', 'Concentração de conhecimento', 'Controles manuais de agenda', 'Demanda por auditorias remotas', 'Parcerias para capacitação', 'Eventos climáticos extremos', 'Interrupção de serviços de nuvem'].map((descricao, n) => ({ id: id('SWOT', n), descricao, quadrante: ['Força', 'Fraqueza', 'Oportunidade', 'Ameaça'][Math.floor(n / 2)], prioridade: n % 2 ? 'Média' : 'Alta', planoNecessario: n < 2 ? 'Não' : 'Sim', planoAcao: n < 2 ? '' : 'Revisar capacidade, preparar contingência e acompanhar resultados em reunião mensal.', responsavel: owner(n), status: ['Concluído', 'Em andamento', 'Não iniciado'][n % 3] })),
    partes: ['Clientes', 'Colaboradores', 'Fornecedores', 'Direção', 'Órgãos reguladores', 'Certificadores'].map((parte, n) => ({ id: id('PI', n), parte, necessidade: ['Entregas conformes ao contrato', 'Capacitação e condições de trabalho', 'Requisitos claros de contratação', 'Sustentabilidade da operação', 'Atendimento aos requisitos aplicáveis', 'Evidências confiáveis do SGQ'][n], expectativa: 'Continuidade, comunicação transparente e cumprimento dos acordos.', monitoramento: 'Revisão de contratos, reuniões e verificação de registros.', frequencia: 'Trimestral' })),
    escopo: { unidades: 'São Paulo, com atendimento nacional presencial e remoto.', produtos: 'Relatórios e materiais técnicos de consultoria.', servicos: company.scope, exclusoes: 'Nenhuma exclusão declarada nesta avaliação fictícia.', justificativas: 'Escopo avaliado de acordo com os serviços contratados.', statusAprovacao: 'Aprovado', aprovador: owner(0), aprovadorCargo: 'Diretor Geral', dataAprovacao: past(-2), dataAtualizacao: past(-2), revisao: '02', historico: [0, 1, 2].map(n => ({ revisao: `0${n}`, data: past(-11 + n * 4), aprovador: owner(0), descricao: ['Definição inicial do escopo.', 'Inclusão de auditorias remotas.', 'Revisão de continuidade operacional.'][n] })) },
    processos: processNames.map((nome, n) => ({ id: id('PROC', n), codigo: id('PR', n), nome, categoria: n === 0 ? 'Estratégico' : n === 4 ? 'Apoio' : 'Operacional', responsavel: owner(n), cargo: n % active.length ? 'Gestor da Qualidade' : 'Diretor Geral', status: 'Ativo', objetivo: `Garantir conformidade em ${nome.toLowerCase()}.`, indicadores: ['Cumprimento dos prazos acordados'], riscos: [risks[n]], entradas: ['Requisitos dos clientes', 'Planejamento aprovado'], saidas: ['Registros verificados', 'Entregas aprovadas'] })),
  };
  const risk = {
    riscos: risks.map((texto, n) => ({ id: id('RIS', n), processo: processNames[n % 6], texto, tipo: n < 8 ? 'Risco' : 'Oportunidade', probabilidade: n % 4 + 1, impacto: n % 3 + 3, status: ['Em Tratamento', 'Monitorando', 'Concluído'][n % 3], causa: 'Variação na capacidade e dependência de recursos compartilhados.', consequencia: 'Impacto nos prazos e na conformidade dos serviços.', planoAcao: 'Revisar o planejamento, designar substituto e verificar entregas.', responsavel: owner(n), prazo: date(n < 9 ? -8 + n : 1), progresso: [40, 70, 100][n % 3] })),
    objetivos: ['Cumprir prazos de consultoria', 'Reduzir retrabalho', 'Qualificar a equipe', 'Melhorar acompanhamento dos clientes'].map((objetivo, n) => ({ id: id('OBJ', n), objetivo, indicador: ['Entregas no prazo', 'Entregas sem retrabalho', 'Participação em treinamento', 'Reuniões de acompanhamento realizadas'][n], meta: '>= 95%', resultadoAtual: `${[92, 97, 88, 96][n]}%`, tendenciaDirecao: 'up', status: n % 2 ? 'Atingido' : 'Em andamento', prazoRevisao: date(2), responsavel: owner(n), responsavelCargo: n % active.length ? 'Gestor da Qualidade' : 'Diretor Geral', planejamento: { oQue: objetivo, recursos: 'Horas de consultoria e treinamento interno.', como: 'Conferência dos registros de entrega na análise mensal.' } })),
    mudancas: ['Padronizar proposta comercial', 'Adotar checklist de revisão', 'Atualizar plano de continuidade', 'Reorganizar agenda de consultores', 'Revisar contratação de nuvem', 'Ampliar treinamento remoto'].map((mudanca, n) => ({ id: id('MD', n), mudanca, proposito: 'Melhorar a confiabilidade e a continuidade dos serviços.', areaImpactada: sectors[n], status: ['Concluída', 'Em execução', 'Em planejamento'][n % 3], prioridade: n % 2 ? 'Média' : 'Alta', dataPrevista: date(n < 3 ? -7 + n : 1), responsavel: owner(n), recursos: { descricao: 'Capacitação e revisão de procedimentos.', valor: 1000 + n * 500 } })),
  };
  const policyText = 'A Quality Pro Solutions se compromete com serviços de consultoria confiáveis, satisfação dos clientes, atendimento aos requisitos aplicáveis, desenvolvimento das pessoas e melhoria contínua do SGQ.';
  const leadership = {
    _seedVersion: 2,
    acoes: Array.from({ length: 24 }, (_, n) => ({ id: id('AD', n), data: past(-11 + Math.floor(n / 2), n % 2 ? 5 : 2), horaInicio: '09:00', horaFim: '10:00', local: 'Sala de reuniões / videoconferência', tipo: ['Reunião Estratégica', 'Análise de Indicadores', 'Decisão Estratégica', 'Alocação de Recursos'][n % 4], descricao: `Análise ${n + 1}: capacidade de consultoria, prazos, ocorrências e continuidade operacional.`, participantes: active.map(u => u.display_name).join(', '), participantIds: active.map(u => String(u.id)), responsavel: owner(n), status: n === 23 ? 'Programada' : n % 7 === 0 ? 'Não Realizada' : 'Concluída', evidencia: '', evidenciaArquivos: [] })),
    posicionamento: { missao: 'Apoiar organizações na melhoria de seus processos.', visao: 'Ser referência em consultoria de gestão da qualidade.', valores: ['Ética', 'Transparência', 'Competência', 'Melhoria contínua'], aprovadoPor: owner(0), dataAtualizacao: past(-1) },
    plano: risks.slice(0, 8).map((r, n) => ({ id: id('P5W2H', n), oQue: `Tratar: ${r.toLowerCase()}`, porQue: 'Preservar qualidade e continuidade dos serviços.', onde: sectors[n % 6], quando: date(n < 4 ? -5 + n : 1), quem: owner(n), como: 'Revisar procedimento, capacitar equipe e conferir resultados.', quanto: 600 + n * 200, status: ['Concluído', 'Atrasado', 'Em Andamento', 'Não Iniciado'][n % 4] })),
    politica: { texto: policyText, revisao: '02', status: 'Vigente', dataAprovacao: past(-2), proximaRevisao: date(10), aprovador: owner(0), aprovadorCargo: 'Diretor Geral', historico: [0, 1, 2].map(n => ({ revisao: `0${n}`, data: past(-11 + n * 4), descricao: ['Publicação inicial.', 'Revisão do compromisso com clientes.', 'Inclusão da continuidade operacional.'][n], texto: policyText, status: 'Vigente', aprovador: owner(0), aprovadorCargo: 'Diretor Geral', proximaRevisao: date(10) })) },
    comunicacao: Array.from({ length: 12 }, (_, n) => ({ id: id('COMPOL', n), data: past(-11 + n), forma: ['Reunião de Equipe', 'Treinamento', 'Integração'][n % 3], setor: sectors[n % 6], qtdPessoas: [2, 3, 12, 4, 4, 3][n % 6], evidencia: '', evidenciaArquivos: [] })),
    cargos: operational.map((u, n) => ({ id: id('CARGO', n), nome: u.display_name, cargo: u.id === hugo.id ? 'Diretor Geral' : u.role === 'Administrador' ? 'Gestor da Qualidade' : u.role, departamento: u.id === hugo.id ? sectors[0] : sectors[1], substituto: owner(u.id === hugo.id ? 1 : 0), status: u.status === 'Ativo' ? 'Ativo' : 'Inativo', descricao: 'Atuação na consultoria e no acompanhamento do SGQ.', responsabilidades: ['Acompanhar processos e registros do setor'], autoridades: ['Executar as atividades autorizadas para seu perfil'] })),
    raci: ['Definir política', 'Tratar não conformidades', 'Revisar contratos', 'Planejar recursos'].map((atividade, n) => ({ id: id('RACI', n), atividade, diretorGeral: 'A', qualidade: 'R', comercial: 'C', financeiro: 'I' })),
    delegacoes: active.length > 1 ? [{ id: 'DEL-0001', titular: owner(0), substituto: owner(1), cargo: 'Diretor Geral', periodoIni: date(-3, 10), periodoFim: date(-3, 20), motivo: 'Ausência programada para capacitação.', status: 'Encerrada' }] : [],
    aprovacoes: [], compromissos: [],
  };
  company.name = 'Quality Pro Solutions Gestão da Qualidade Ltda.';
  context.processos.forEach(row => { if (row.categoria === 'Apoio') row.categoria = 'Suporte'; });
  risk.riscos.forEach(row => { if (row.status === 'Concluído') row.status = 'Tratado'; });
  context.escopo.dataAprovacao = context.escopo.dataAtualizacao = context.escopo.historico.at(-1).data;
  leadership.politica.dataAprovacao = leadership.politica.historico.at(-1).data;
  leadership.acoes.at(-1).data = date(1, 5);
  const ncs = Array.from({ length: 36 }, (_, n) => {
    const opened = past(-11 + Math.floor(n / 3), n % 3 + 1);
    const stage = n < 27 ? (n % 8 === 0 ? 1 : 3) : n % 4;
    const completed = shift(opened, 1) <= today ? shift(opened, 1) : today;
    const closed = shift(completed, 1) <= today ? shift(completed, 1) : today;
    const origem = n % 3 ? 'Interno' : 'Cliente';
    return { id: `RNC-${opened.slice(0, 4)}-${String(n + 1).padStart(4, '0')}`, dataOrigem: opened, codigoItem: id('CONS', n), origem, origemRef: origem === 'Cliente' ? clients[n % clients.length] : '', cliente: origem === 'Cliente' ? clients[n % clients.length] : '', fornecedor: '', setor: sectors[n % 6], processo: processNames[n % 6], gravidade: ['Menor', 'Média', 'Maior'][n % 3], reincidente: n % 8 === 0, descricao: `${ncDescriptions[n % 6]} no projeto de consultoria ${n + 1}.`, evidencia: '', evidencias: [], rncClientePdf: '', rncClienteArquivos: [], status: ['Aguardando análise', 'Ações em andamento', 'Aguardando eficácia', 'Encerrado'][stage], ishikawa: { metodo: stage ? 'Critério de revisão não estava explícito.' : '', maquina: '', maoObra: '', material: '', medicao: '', meioAmbiente: '', causaRaiz: stage ? 'Ausência de verificação padronizada antes da entrega.' : '' }, acoes: stage ? [{ id: id('AC', n), desc: 'Revisar checklist e aplicar conferência independente na entrega.', prazo: shift(opened, 14), responsavel: owner(n), status: stage > 1 ? 'Concluída' : shift(opened, 14) < today ? 'Atrasada' : 'Em andamento', concluidaEm: stage > 1 ? completed : '', evidencia: '', evidencias: [] }] : [], eficaciaIniciadaEm: stage > 1 ? completed : '', encerradoEm: stage === 3 ? closed : '', historico: [{ ts: `${opened}T12:00:00Z`, texto: 'Abertura do registro de demonstração.' }, ...(stage ? [{ ts: `${completed}T12:00:00Z`, texto: 'Causa avaliada e ação corretiva registrada.' }] : []), ...(stage === 3 ? [{ ts: `${closed}T15:00:00Z`, texto: 'Eficácia verificada e ocorrência encerrada.' }] : [])] };
  });
  const climate = { determination: { relevant: 'Sim', justification: 'Chuvas intensas e interrupções de energia podem afetar deslocamentos, auditorias presenciais e disponibilidade dos registros dos projetos.', stakeholderRequirement: 'Sim', stakeholderDetail: 'Clientes solicitam continuidade das entregas e comunicação sobre alterações de agenda; fornecedores de nuvem precisam garantir disponibilidade e recuperação dos registros.', status: 'Em revisão', owner: owner(0), reviewedAt: today, nextReview: date(6) }, issues: ['Interrupção de energia', 'Chuvas intensas em deslocamentos', 'Indisponibilidade do provedor de nuvem', 'Calor extremo em visitas', 'Requisitos de continuidade dos clientes', 'Falha logística de fornecedores'].map((description, n) => ({ id: id('CLI', n), description, relevant: n === 3 ? 'Parcial' : 'Sim', impact: 'Interrupção ou atraso nos serviços de consultoria contratados.', action: ['Testar acesso remoto e recuperação de registros.', 'Preparar agenda alternativa de atendimento.', 'Revisar contingência com fornecedor.'][n % 3], owner: owner(n), role: n % active.length ? 'Gestor da Qualidade' : 'Diretor Geral', due: date(n < 3 ? -4 + n : 1), status: ['Concluída', 'Monitorando', 'Em andamento', 'Não iniciada'][n % 4], evidence: '' })) };
  const documents = [
    ['POL-QUA-001', 'Política da Qualidade', 'Política da Qualidade', '03', -3, 5, 'Gestão da Qualidade', 'Vigente', '360 dias'],
    ['MAN-SGQ-001', 'Manual do Sistema de Gestão da Qualidade', 'Manual da Qualidade', '04', -5, 10, 'Direção', 'Vigente', '360 dias'],
    ['PR-QUA-001', 'Controle de informação documentada', 'Procedimento', '02', -2, 8, 'Gestão da Qualidade', 'Vigente', '360 dias'],
    ['PR-OPS-002', 'Planejamento e execução de consultorias', 'Procedimento', '05', -1, 12, 'Consultoria e Operações', 'Em Revisão', '180 dias'],
    ['IT-OPS-003', 'Validação de entregas técnicas', 'Instrução de Trabalho', '02', -13, 4, 'Consultoria e Operações', 'Vigente', '360 dias'],
    ['FR-QUA-004', 'Checklist de auditoria interna', 'Formulário', '01', -1, 3, 'Gestão da Qualidade', 'Aguardando Aprovação', '180 dias'],
    ['FR-COM-005', 'Pesquisa de satisfação do cliente', 'Formulário', '03', -4, 15, 'Atendimento ao Cliente', 'Vigente', '360 dias'],
    ['IT-ADM-006', 'Rotina de cópia de segurança', 'Instrução de Trabalho', '01', -14, 10, 'Administrativo e Financeiro', 'Obsoleto', '360 dias'],
    ['PR-QUA-007', 'Tratamento de não conformidades', 'Procedimento', '03', -3, 9, 'Gestão da Qualidade', 'Vigente', '360 dias'],
  ].map(([code, title, type, version, offset, day, sector, status, revisionPeriod], n) => ({ id: id('DOC', n), kind: 'internal', code, title, type, version, revisionDate: past(offset, day), elaborationDate: past(offset - 5, day), owner: owner(n), sector, revisionPeriod, disposition: n % 4 === 0 ? 'Digital/Físico' : 'Digital', retention: n % 3 === 0 ? '5 anos' : 'Mantido', retentionLocation: 'QualityPro Cloud / Repositório do SGQ', controlledCopy: n % 4 === 0 ? 'Sim' : 'Não', copySector: n % 4 === 0 ? sector : '', copyOwner: n % 4 === 0 ? owner(n + 1) : '', copyDate: n % 4 === 0 ? past(offset, day) : '', approver: owner(0), approverRole: 'Diretor Geral', attachmentName: '', status }));
  documents.push(...[
    ['ISO-9001-2015', 'ABNT NBR ISO 9001:2015 - Sistemas de gestão da qualidade', 'ABNT', 'NBR ISO 9001:2015', '2015', 'Gestão da Qualidade', -2, 5, 2, 5, 'Vigente'],
    ['ISO-19011-2018', 'ABNT NBR ISO 19011:2018 - Diretrizes para auditoria', 'ABNT', 'NBR ISO 19011:2018', '2018', 'Gestão da Qualidade', -1, 10, 1, 10, 'Vigente'],
    ['EXT-CLI-001', 'Manual de requisitos do cliente Integra Medical', 'Cliente', 'Integra Medical', '06', 'Atendimento ao Cliente', -3, 8, -1, 8, 'Vigente'],
    ['LGPD-13709', 'Lei Geral de Proteção de Dados Pessoais', 'Órgão Governamental', 'Lei nº 13.709/2018', '2018', 'Administrativo e Financeiro', -4, 13, -13, 13, 'Vigente'],
    ['EXT-FOR-001', 'Termos de continuidade e segurança do provedor de nuvem', 'Fornecedor', 'Nexa Cloud Sistemas', '02', 'Consultoria e Operações', -2, 18, -1, 18, 'Em Revisão'],
  ].map(([code, title, source, sourceDetail, version, sector, revisionOffset, revisionDay, verificationOffset, verificationDay, status], n) => ({ id: id('EXT', n), kind: 'external', code, title, source, sourceDetail, version, revisionDate: past(revisionOffset, revisionDay), lastVerification: past(verificationOffset - 1, verificationDay), nextVerification: past(verificationOffset, verificationDay), sector, storageLocation: 'QualityPro Cloud / Documentos externos', receivedAt: past(revisionOffset - 1, revisionDay), disposition: 'Digital', controlledCopy: 'Não', attachmentName: '', status })));
  const auditStatuses = ['Concluída', 'Concluída', 'Concluída', 'Concluída', 'Concluída', 'Agendada', 'Agendada', 'Em andamento', 'Concluída', 'Agendada', 'Em andamento', 'Agendada'];
  const audits = Array.from({ length: 12 }, (_, n) => {
    const dataInicio = past(-11 + n, 12);
    const tipo = ['Interna', 'Externa', 'Cliente', 'Fornecedor'][n % 4];
    return {
      id: `AUD-DEMO-${dataInicio.slice(0, 4)}-${String(n + 1).padStart(3, '0')}`,
      descricao: `Auditoria ${tipo.toLowerCase()} ${n + 1} - ${sectors[n % sectors.length]}`,
      tipo,
      alvo: tipo === 'Cliente' ? clients[n % clients.length] : tipo === 'Fornecedor' ? suppliers[n % suppliers.length] : sectors[n % sectors.length],
      dataInicio,
      dataFim: shift(dataInicio, 1),
      responsavel: owner(n),
      equipe: active.filter((_, index) => index !== n % active.length).slice(0, 2).map(user => user.display_name),
      status: auditStatuses[n],
      evidencia: n < 5 ? `evidencia-auditoria-${n + 1}.pdf` : '',
      plano: [],
      relatorio: { blocos: [], consideracoes: '' },
      planoAcoes: [],
    };
  });
  const equipmentRows = [
    ['EQ-0001', 'Paquímetro digital 0-150 mm', 'Digital', 'Mitutoyo', 'CD-15APX-241', '0 a 150', '0,01', 'mm', 'Gestão da Qualidade', 'Em uso', -10, 12, 'CAL-2026-001', 'Metrolab Brasil', 'Erro máximo permitido de ±0,03 mm'],
    ['EQ-0002', 'Paquímetro digital 0-300 mm', 'Digital', 'Mitutoyo', 'CD-30APX-318', '0 a 300', '0,01', 'mm', 'Consultoria e Operações', 'Em uso', -9, 12, 'CAL-2026-002', 'Metrolab Brasil', 'Erro máximo permitido de ±0,04 mm'],
    ['EQ-0003', 'Paquímetro analógico 0-150 mm', 'Analógico', 'Starrett', '125ME-057', '0 a 150', '0,02', 'mm', 'Gestão da Qualidade', 'Em uso', -11, 12, 'CAL-2026-003', 'Calibra SP', 'Erro máximo permitido de ±0,04 mm'],
    ['EQ-0004', 'Micrômetro externo 0-25 mm', 'Analógico', 'Mitutoyo', '103-137-09', '0 a 25', '0,001', 'mm', 'Consultoria e Operações', 'Em uso', -8, 12, 'CAL-2026-004', 'Metrolab Brasil', 'Erro máximo permitido de ±0,004 mm'],
    ['EQ-0005', 'Micrômetro externo 25-50 mm', 'Analógico', 'Mitutoyo', '103-138-22', '25 a 50', '0,001', 'mm', 'Gestão da Qualidade', 'Em uso', -7, 12, 'CAL-2026-005', 'Metrolab Brasil', 'Erro máximo permitido de ±0,004 mm'],
    ['EQ-0006', 'Relógio comparador 0-10 mm', 'Analógico', 'Digimess', '110.200-810', '0 a 10', '0,01', 'mm', 'Consultoria e Operações', 'Em uso', -6, 12, 'CAL-2026-006', 'Calibra SP', 'Erro máximo permitido de ±0,02 mm'],
    ['EQ-0007', 'Altímetro digital 0-300 mm', 'Digital', 'Insize', '1150-300', '0 a 300', '0,01', 'mm', 'Gestão da Qualidade', 'Em calibração', -12, 12, 'CAL-2025-007', 'Metrologia Técnica', 'Erro máximo permitido de ±0,03 mm'],
    ['EQ-0008', 'Bloco padrão classe 1', 'Outro', 'Mitutoyo', 'BM-1-032', '0,5 a 100', '0,001', 'mm', 'Gestão da Qualidade', 'Em uso', -5, 24, 'CAL-2026-008', 'RBC Metrologia', 'Conforme certificado RBC vigente'],
    ['EQ-0009', 'Balança de precisão 0-3 kg', 'Digital', 'Marte', 'AD330-179', '0 a 3', '0,1', 'g', 'Administrativo e Financeiro', 'Em uso', -10, 12, 'CAL-2026-009', 'Metrolab Brasil', 'Erro máximo permitido de ±0,2 g'],
    ['EQ-0010', 'Balança plataforma 0-30 kg', 'Digital', 'Toledo', 'Prix-3-921', '0 a 30', '1', 'g', 'Consultoria e Operações', 'Em uso', -7, 12, 'CAL-2026-010', 'Pesagem Certificada', 'Erro máximo permitido de ±5 g'],
    ['EQ-0011', 'Termômetro infravermelho -50 a 550 °C', 'Digital', 'Fluke', '62MAX-608', '-50 a 550', '0,1', '°C', 'Consultoria e Operações', 'Em uso', -9, 12, 'CAL-2026-011', 'Termocal', 'Erro máximo permitido de ±1,5 °C'],
    ['EQ-0012', 'Termômetro de imersão -10 a 200 °C', 'Digital', 'Incoterm', 'TPI-711', '-10 a 200', '0,1', '°C', 'Atendimento ao Cliente', 'Em uso', -8, 12, 'CAL-2026-012', 'Termocal', 'Erro máximo permitido de ±0,5 °C'],
    ['EQ-0013', 'Termo-higrômetro digital', 'Digital', 'Instrutherm', 'HT-500', '-10 a 60', '0,1', '°C / %UR', 'Gestão da Qualidade', 'Em uso', -11, 12, 'CAL-2026-013', 'Clima Metrologia', 'Erro máximo permitido de ±0,5 °C e ±3 %UR'],
    ['EQ-0014', 'Manômetro 0-10 bar', 'Analógico', 'Wika', '232.50-104', '0 a 10', '0,1', 'bar', 'Consultoria e Operações', 'Em uso', -8, 12, 'CAL-2026-014', 'Pressão Técnica', 'Erro máximo permitido de ±1 % do fundo de escala'],
    ['EQ-0015', 'Manômetro digital 0-20 bar', 'Digital', 'Fluke', '700G-530', '0 a 20', '0,01', 'bar', 'Consultoria e Operações', 'Em uso', -6, 12, 'CAL-2026-015', 'Pressão Técnica', 'Erro máximo permitido de ±0,25 % da leitura'],
    ['EQ-0016', 'Torquímetro 20-200 N.m', 'Analógico', 'Gedore', 'TORCOFIX-200', '20 a 200', '1', 'N.m', 'Consultoria e Operações', 'Em uso', -9, 12, 'CAL-2026-016', 'Torque Lab', 'Erro máximo permitido de ±4 % da leitura'],
    ['EQ-0017', 'Multímetro digital True RMS', 'Digital', 'Fluke', '87V-714', '0 a 1000', '0,001', 'V / Ω', 'Administrativo e Financeiro', 'Em uso', -10, 12, 'CAL-2026-017', 'Eletrocal', 'Conforme especificação do fabricante'],
    ['EQ-0018', 'Luxímetro digital', 'Digital', 'Instrutherm', 'LD-300', '0 a 200000', '1', 'lux', 'Administrativo e Financeiro', 'Em uso', -7, 12, 'CAL-2026-018', 'Luminotec', 'Erro máximo permitido de ±5 %'],
    ['EQ-0019', 'Decibelímetro classe 2', 'Digital', 'Instrutherm', 'DEC-490', '30 a 130', '0,1', 'dB', 'Consultoria e Operações', 'Em uso', -6, 12, 'CAL-2026-019', 'Acústica Cal', 'Erro máximo permitido de ±1,5 dB'],
    ['EQ-0020', 'pHmetro portátil', 'Digital', 'Hanna', 'HI-98107-122', '0 a 14', '0,01', 'pH', 'Consultoria e Operações', 'Em uso', -5, 12, 'CAL-2026-020', 'Química Metrológica', 'Erro máximo permitido de ±0,1 pH'],
    ['EQ-0021', 'Condutivímetro portátil', 'Digital', 'Hanna', 'HI-98312-514', '0 a 3999', '1', 'µS/cm', 'Consultoria e Operações', 'Em uso', -8, 12, 'CAL-2026-021', 'Química Metrológica', 'Erro máximo permitido de ±2 % da leitura'],
    ['EQ-0022', 'Rugosímetro portátil', 'Digital', 'Mitutoyo', 'SJ-210-711', '0,05 a 40', '0,01', 'µm', 'Gestão da Qualidade', 'Em uso', -9, 12, 'CAL-2026-022', 'Metrologia Técnica', 'Erro máximo permitido de ±10 %'],
    ['EQ-0023', 'Durômetro portátil Rockwell', 'Digital', 'Time', 'TH-160-385', '20 a 70', '0,1', 'HRC', 'Consultoria e Operações', 'Em uso', -6, 12, 'CAL-2026-023', 'Dureza Lab', 'Conforme bloco de referência certificado'],
    ['EQ-0024', 'Medidor de espessura por ultrassom', 'Digital', 'Dakota', 'ZX-6-182', '0,6 a 500', '0,01', 'mm', 'Consultoria e Operações', 'Em uso', -7, 12, 'CAL-2026-024', 'Ultramed', 'Erro máximo permitido de ±0,1 mm'],
    ['EQ-0025', 'Trena metálica 5 m', 'Analógico', 'Starrett', 'TM-5M-339', '0 a 5', '1', 'mm', 'Consultoria e Operações', 'Em uso', -12, 24, 'CAL-2025-025', 'RBC Metrologia', 'Erro máximo permitido de ±1,2 mm'],
    ['EQ-0026', 'Cronômetro digital', 'Digital', 'Casio', 'HS-80TW-613', '0 a 24', '0,01', 'h', 'Gestão da Qualidade', 'Em uso', -8, 12, 'CAL-2026-026', 'Tempo Certo', 'Erro máximo permitido de ±0,01 s/h'],
    ['EQ-0027', 'Goniômetro universal 0-360°', 'Analógico', 'Mitutoyo', '187-907-464', '0 a 360', '5', 'minutos de arco', 'Consultoria e Operações', 'Fora de uso', -13, 12, 'CAL-2025-027', 'Metrolab Brasil', 'Aguardando avaliação de manutenção'],
    ['EQ-0028', 'Medidor de camada por indução', 'Digital', 'PosiTector', '6000-830', '0 a 1500', '1', 'µm', 'Consultoria e Operações', 'Reprovado', -13, 12, 'CAL-2025-028', 'Metalcal', 'Desvio acima do critério de aceitação'],
    ['EQ-0029', 'Esquadro de precisão 150 mm', 'Outro', 'Starrett', 'K53-150-551', '0 a 150', '0,01', 'mm', 'Gestão da Qualidade', 'Em uso', -11, 12, 'CAL-2026-029', 'RBC Metrologia', 'Esquadro máximo de 0,02 mm/100 mm'],
    ['EQ-0030', 'Medidor de força digital 0-500 N', 'Digital', 'Instron', 'DFG-500-710', '0 a 500', '0,1', 'N', 'Consultoria e Operações', 'Em calibração', -12, 12, 'CAL-2025-030', 'Força Cal', 'Erro máximo permitido de ±0,5 % da leitura'],
  ];
  const equipment = equipmentRows.map(([id, descricao, modelo, marca, serie, faixa, resolucao, unidade, setor, situacao, lastOffset, periodicidade, certificado, laboratorio, criterio], n) => ({ id, codigo: id, descricao, modelo, marca, serie, faixa, resolucao, unidade, setor, responsavel: owner(n), situacao, ultimaCalib: past(lastOffset, n % 24 + 1), periodicidade: String(periodicidade), proximaCalib: n < 3 ? past(-1, n + 1) : n < 7 ? date(0, n + 11) : n === 27 ? past(-2, 6) : date(2 + n % 7, n % 24 + 1), certificado, laboratorio, criterio, anexo: '' }));
  const equipmentDistributions = [0, 1, 5, 10, 13, 18, 21, 23, 25, 28].map((index, n) => ({ id: id('DST', n), equipId: equipment[index].id, solicitante: owner(n + 1), setor: sectors[(n + 2) % sectors.length], saida: past(-5 + n, n % 20 + 1), retornoPrev: date(n % 2 ? 1 : 0, n % 20 + 4), retornoReal: n < 5 ? past(-4 + n, n % 20 + 3) : '', obs: ['Verificação dimensional de item recebido.', 'Auditoria interna e inspeção de processo.', 'Conferência de condição ambiental.', 'Avaliação técnica em visita ao cliente.'][n % 4] }));
  const state = { company, users: operational.map(u => ({ name: u.display_name, email: u.username, role: u.id === hugo.id ? 'Administrador' : u.role, status: u.status })), settings: { emailAlerts: false, weeklyReport: false, companyAccess: 'Plano Professional', theme: 'dark', operationalStatus: 'updated' }, documents, audits, equipment, equipmentDistributions, ncs, ncCatalogs: { clientes: [], fornecedores: [], setores: [], processos: [] }, notifications: [], supplierStateVersion: 0, climate };
  // Build historical observations with the application's calculator from each dated base state.
  // The test scenario includes deterministic Context and Risk activity to demonstrate the consolidated actions trend.
  const observations = [];
  for (let day = date(-11, 1); day <= today; day = shift(day, 1)) {
    const historical = { documents: documents.filter(document => (document.kind === 'external' ? document.receivedAt : document.elaborationDate) <= day), audits: audits.filter(audit => audit.dataInicio <= day), ncs: ncs.filter(nc => nc.dataOrigem <= day).map(nc => ({ status: nc.encerradoEm && nc.encerradoEm <= day ? 'Encerrado' : 'Aguardando análise' })) };
    observations.push(healthObservation('state', historical, `${day}T18:00:00Z`));
  }
  for (let month = 0; month < 12; month += 1) {
    const observedOn = past(-11 + month, 15);
    const contextActions = 2 + Math.floor(month / 4);
    const riskActions = 5 + Math.floor(month / 2);
    observations.push(healthObservation('context', {
      swot: Array.from({ length: contextActions }, (_, n) => ({ id: `HSWOT-${month}-${n}`, planoNecessario: 'Sim', status: 'Em andamento' })),
    }, `${observedOn}T18:00:00Z`));
    observations.push(healthObservation('risk', {
      riscos: Array.from({ length: riskActions }, (_, n) => ({ id: `HRIS-${month}-${n}`, status: 'Em Tratamento' })),
      objetivos: [],
      mudancas: [],
    }, `${observedOn}T18:00:00Z`));
  }
  return { admin, hugo, operational, company, state, context, risk, leadership, observations, period: { from: date(-11, 1), to: today }, seed: SEED };
}

module.exports = { buildScenario, SEED, companyName };
