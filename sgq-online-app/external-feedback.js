const crypto = require('node:crypto');
const db = require('./db');
const mailer = require('./mailer');
const DAY = 86400000;
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function string(value, max = 4000) {
  if (typeof value !== 'string' || value.length > max) throw fail('Campo inválido.');
  return value.trim();
}
function attachments(files = []) {
  if (!Array.isArray(files) || files.length > 5) throw fail('Limite de cinco anexos.');
  let total = 0;
  return files.map(file => {
    if (!file || typeof file !== 'object') throw fail('Anexo antigo sem conteúdo. Anexe o arquivo novamente.');
    const name = string(file.name, 160);
    const content = string(file.content, 2800000);
    if (!name || !/^[A-Za-z0-9+/]*={0,2}$/.test(content)) throw fail('Anexo inválido.');
    const size = Buffer.from(content, 'base64').length;
    total += size;
    if (!size || total > 2 * 1024 * 1024) throw fail('Os anexos devem somar no máximo 2 MB.');
    return { name, content, size };
  });
}
function createExternalFeedback({ secret, appUrl, sendEmail = mailer.sendEmail, now = Date.now }) {
  const sign = payload => crypto.createHmac('sha256', secret).update(`external-feedback:${payload}`).digest('base64url');
  const tokenFor = (companyId, entry) => {
    const payload = Buffer.from(JSON.stringify([companyId, entry.nonce])).toString('base64url');
    return `${payload}.${sign(payload)}`;
  };
  function auth(token) {
    if (typeof token !== 'string' || token.length > 1500) throw fail('Link inválido.', 401);
    const [payload, signature, extra] = token.split('.');
    const expected = sign(payload || '');
    if (extra || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw fail('Link inválido.', 401);
    let values;
    try { values = JSON.parse(Buffer.from(payload, 'base64url')); } catch { throw fail('Link inválido.', 401); }
    if (!Array.isArray(values)) throw fail('Link inválido.', 401);
    const [companyId, nonce] = values;
    if (!Number.isSafeInteger(companyId) || companyId < 1 || typeof nonce !== 'string') throw fail('Link inválido.', 401);
    return { companyId, nonce };
  }
  function resolve(data, nonce) {
    const entry = data.externalFeedbackPrivate?.entries?.find(e => e.nonce === nonce);
    if (!entry || entry.deletedAt || entry.expiresAt <= now()) throw fail('Este link expirou ou foi revogado.', 410);
    return entry;
  }
  function record(entry) {
    return { ...entry.record, emailDelivery: entry.delivery || 'pending',
      ...(entry.kind === 'survey' ? { status: entry.respondedAt ? 'Respondida' : entry.sentAt ? (now() - entry.sentAt >= 7 * DAY ? 'Não respondida' : 'Enviada') : 'Envio pendente', reenviado: Boolean(entry.remindedAt) } : { statusRetorno: entry.verdict || (entry.respondedAt ? 'Respondida' : entry.sentAt ? 'Enviada' : 'Envio pendente') }) };
  }
  function mergeSurveys(data) {
    const surveys = (data.externalFeedbackPrivate?.entries || []).filter(e => e.kind === 'survey');
    if (!surveys.length) return;
    data.state ||= {};
    data.state.satisfaction ||= {};
    const rows = data.state.satisfaction.qps_sat_pesquisas || [];
    const ids = new Set(surveys.map(e => e.record.id));
    data.state.satisfaction.qps_sat_pesquisas = [...rows.filter(r => !ids.has(r.id)), ...surveys.filter(e => !e.deletedAt).map(record)];
  }
  async function request(companyId, kind, input, requester) {
    if (!['survey', 'supplier'].includes(kind)) throw fail('Tipo inválido.');
    if (!mailer.isEmail(requester?.email)) throw fail('Cadastre um e-mail válido para receber o retorno.');
    const id = string(input.id, 100);
    const email = string(input.email, 254).toLowerCase();
    if (!/^[A-Za-z0-9_-]+$/.test(id)) throw fail('Identificador inválido.');
    if (!mailer.isEmail(email)) throw fail('E-mail inválido.');
    const entry = await db.mutateSupplierData(companyId, data => {
      data.externalFeedbackPrivate ||= { entries: [] };
      const old = data.externalFeedbackPrivate.entries.find(e => e.kind === kind && e.record.id === id);
      if (old) {
        if (old.deletedAt) throw fail('Registro excluído.', 410);
        if (old.email !== email || (kind === 'supplier' && old.record.descricao !== input.descricao)) throw fail('Este envio já foi registrado. Crie um novo comunicado para alterar o conteúdo.', 409);
        return structuredClone(old);
      }
      let saved;
      if (kind === 'survey') {
        const version = data.state?.satisfaction?.qps_sat_form?.versoes?.find(v => v.status === 'Vigente' && v.versao === input.formVersao);
        if (!version || !version.perguntas?.length) throw fail('Não há formulário vigente para esta pesquisa.', 409);
        saved = { id, email, seq: Number(input.seq) || 1, empresa: string(input.empresa, 250), responsavel: string(input.responsavel || '', 200), cnpj: string(input.cnpj || '', 40), formVersao: version.versao, perguntas: structuredClone(version.perguntas), respostas: null, dataResposta: '', dataEnvio: new Date(now()).toISOString().slice(0, 10), prazo: new Date(now() + 7 * DAY).toISOString().slice(0, 10), historico: [] };
        const rows = [...(data.state.satisfaction.qps_sat_pesquisas || []), ...data.externalFeedbackPrivate.entries.filter(e => e.kind === 'survey').map(e => e.record)];
        saved.seq = rows.reduce((max, row) => Math.max(max, Number.isSafeInteger(row.seq) ? row.seq : 0), 0) + 1;
      } else {
        saved = { id, email, fornId: string(input.fornId || '', 100), fornNome: string(input.fornNome || '', 250), avalId: string(input.avalId || '', 100), origem: string(input.origem || '', 250), descricao: string(input.descricao, 10000), prazo: string(input.prazo || '', 10), anexos: attachments(input.anexos), resposta: null, dataEnvio: new Date(now()).toISOString().slice(0, 10), dataRegistro: new Date(now()).toISOString().slice(0, 10) };
        if (!saved.descricao) throw fail('Escreva o comunicado.');
      }
      const value = { kind, record: saved, email, requester, nonce: crypto.randomBytes(32).toString('base64url'), createdAt: now(), expiresAt: now() + 90 * DAY };
      data.externalFeedbackPrivate.entries.push(value);
      mergeSurveys(data);
      return structuredClone(value);
    });
    await deliver(companyId, entry.nonce);
    const latest = await db.mutateSupplierData(companyId, data => structuredClone(resolve(data, entry.nonce)));
    return { record: record(latest), delivery: latest.delivery, link: `${appUrl}/external-feedback#${tokenFor(companyId, latest)}` };
  }
  async function read(token) {
    const { companyId, nonce } = auth(token);
    return db.mutateSupplierData(companyId, data => {
      const e = resolve(data, nonce);
      return { kind: e.kind, responded: Boolean(e.respondedAt), company: e.record.empresa || e.record.fornNome, description: e.record.descricao || '', questions: e.record.perguntas || [], deadline: e.record.prazo, files: (e.record.anexos || []).map(({ name, size }, index) => ({ name, size, index })) };
    });
  }
  async function download(token, index) {
    const { companyId, nonce } = auth(token);
    return db.mutateSupplierData(companyId, data => {
      const file = resolve(data, nonce).record.anexos?.[index];
      if (!file) throw fail('Arquivo não encontrado.', 404);
      return file;
    });
  }
  async function respond(token, body) {
    const { companyId, nonce } = auth(token);
    await db.mutateSupplierData(companyId, data => {
      const e = resolve(data, nonce);
      if (e.respondedAt) throw fail('A resposta já foi registrada.', 409);
      if (e.kind === 'survey') {
        const answers = {};
        for (const q of e.record.perguntas) {
          const value = body.answers?.[q.id];
          if (q.tipo === 'texto') answers[q.id] = string(value || '', 4000);
          else { if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 10) throw fail('Responda todas as notas com valores de 0 a 10.'); answers[q.id] = value; }
        }
        e.record.respostas = answers;
        e.record.dataResposta = new Date(now()).toISOString().slice(0, 10);
      } else {
        const actions = string(body.actions, 10000);
        if (!actions) throw fail('Descreva as ações tomadas.');
        e.record.resposta = { acoes: actions, data: new Date(now()).toISOString().slice(0, 10), anexos: attachments(body.files) };
      }
      e.respondedAt = now();
      if (e.kind === 'survey') e.record.historico.push({ ts: new Date(now()).toISOString(), texto: 'Resposta do cliente registrada.' });
      mergeSurveys(data);
    });
    await deliver(companyId, nonce);
    return { ok: true };
  }
  async function list(companyId, kind) {
    const data = await db.getCompanyData(companyId, 'externalFeedbackPrivate');
    return (data?.entries || []).filter(e => e.kind === kind && !e.deletedAt).map(e => ({ ...record(e), responseLink: `${appUrl}/external-feedback#${tokenFor(companyId, e)}` }));
  }
  async function update(companyId, kind, input, remove = false) {
    return db.mutateSupplierData(companyId, data => {
      const entries = data.externalFeedbackPrivate?.entries || [];
      const entry = entries.find(e => e.kind === kind && e.record.id === input.id);
      if (!entry) throw fail('Registro não encontrado.', 404);
      if (remove) {
        entry.deletedAt = now();
        mergeSurveys(data);
        return { ok: true };
      }
      if (kind !== 'supplier' || !entry.respondedAt || !['Procedente', 'Não procedente'].includes(input.verdict)) throw fail('Julgamento inválido.');
      entry.verdict = input.verdict;
      return { record: record(entry) };
    });
  }
  async function deliver(companyId, onlyNonce) {
    const entries = (await db.getCompanyData(companyId, 'externalFeedbackPrivate'))?.entries || [];
    const results = [];
    for (const item of entries) {
      if (onlyNonce && item.nonce !== onlyNonce) continue;
      const job = await db.mutateSupplierData(companyId, data => {
        const e = data.externalFeedbackPrivate.entries.find(e => e.nonce === item.nonce);
        const type = e.respondedAt ? (!e.returnSentAt ? 'return' : null) : !e.sentAt ? 'invite' : !e.remindedAt && now() - e.sentAt >= 7 * DAY ? 'reminder' : null;
        if (!type || e.deletedAt || e.expiresAt <= now() || e.leaseUntil > now()) return null;
        e.leaseUntil = now() + 60000;
        return { e: structuredClone(e), type };
      });
      if (!job) continue;
      const { e, type } = job;
      const isReturn = type === 'return';
      const title = e.kind === 'survey' ? 'Pesquisa de satisfação' : 'Comunicado ao fornecedor';
      const link = `${appUrl}/external-feedback#${tokenFor(companyId, e)}`;
      const content = isReturn ? `<p>A resposta de ${escape(e.record.empresa || e.record.fornNome)} foi registrada.</p>${e.record.resposta ? `<p>${escape(e.record.resposta.acoes)}</p>` : ''}<p><a href="${escape(appUrl)}/app">Consultar no SGQ</a></p>` : `<p>${type === 'reminder' ? 'Ainda aguardamos sua resposta.' : 'Solicitamos sua participação.'}</p><p>${escape(e.record.descricao || e.record.empresa)}</p><p>Prazo: ${escape(e.record.prazo)}</p><p><a href="${escape(link)}">${e.kind === 'survey' ? 'Responder pesquisa' : 'Consultar evidências e responder'}</a></p><p>Link individual válido por 90 dias. Não compartilhe.</p>`;
      let result;
      try { result = appUrl ? await sendEmail({ to: isReturn ? e.requester.email : e.email, subject: `${type === 'reminder' ? 'Lembrete: ' : isReturn ? 'Resposta recebida: ' : ''}${title} - ${e.record.id}`, html: `<h2>${escape(title)}</h2>${content}`, tag: `external_${e.kind}_${type}`, idempotencyKey: `feedback:${e.nonce}:${type}` }) : { status: 'not_configured' }; }
      catch { result = { status: 'failed' }; }
      await db.mutateSupplierData(companyId, data => {
        const current = data.externalFeedbackPrivate.entries.find(entry => entry.nonce === e.nonce);
        if (!current) return;
        current.leaseUntil = 0;
        current[isReturn ? 'returnDelivery' : type === 'reminder' ? 'reminderDelivery' : 'delivery'] = result.status;
        if (result.id) { current.messageIds ||= {}; current.messageIds[type] = result.id; }
        if (result.status === 'sent') {
          current[isReturn ? 'returnSentAt' : type === 'reminder' ? 'remindedAt' : 'sentAt'] = now();
          if (current.kind === 'survey' && !isReturn) current.record.historico.push({ ts: new Date(now()).toISOString(), texto: type === 'reminder' ? 'Lembrete enviado por e-mail.' : 'Pesquisa enviada por e-mail.' });
        }
        mergeSurveys(data);
      });
      results.push({ id: e.record.id, type, ...result });
    }
    return results;
  }
  async function runNotifications() {
    const results = [];
    for (const target of await db.listNotificationTargets(true)) results.push(...await deliver(target.company.id));
    return results;
  }
  return { request, read, respond, download, list, update, deliver, runNotifications, mergeSurveys };
}
module.exports = { createExternalFeedback };
