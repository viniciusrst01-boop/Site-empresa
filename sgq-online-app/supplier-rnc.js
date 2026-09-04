const crypto = require("node:crypto");
const { isDeepStrictEqual } = require("node:util");
const db = require("./db");
const mailer = require("./mailer");

const DAY = 86400000;
const CAUSES = ["metodo", "maquina", "maoObra", "material", "medicao", "meioAmbiente", "causaRaiz"];
const NC_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const text = (value, max = 4000) => {
  if (typeof value !== "string" || value.length > max) throw error("invalid_field");
  return value.trim();
};
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function createSupplierRnc({ secret, appUrl, sendEmail = mailer.sendEmail, now = () => Date.now() }) {
  const sign = (payload) => crypto.createHmac("sha256", secret).update(`supplier-rnc:${payload}`).digest("base64url");
  const makeToken = (companyId, entry) => {
    const payload = Buffer.from(JSON.stringify([companyId, entry.ncId, entry.nonce])).toString("base64url");
    return `${payload}.${sign(payload)}`;
  };
  function parseToken(token) {
    if (typeof token !== "string" || token.length > 1200) throw error("invalid_supplier_link", 401);
    const [payload, signature, extra] = token.split(".");
    const expected = sign(payload || "");
    if (extra || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw error("invalid_supplier_link", 401);
    try {
      const [companyId, ncId, nonce] = JSON.parse(Buffer.from(payload, "base64url"));
      if (!Number.isSafeInteger(companyId) || companyId < 1 || typeof ncId !== "string" || typeof nonce !== "string") throw new Error();
      return { companyId, ncId, nonce };
    } catch { throw error("invalid_supplier_link", 401); }
  }
  function resolve(data, auth) {
    const entry = data.supplierRncPrivate?.entries?.find((item) => item.ncId === auth.ncId && item.nonce === auth.nonce);
    const row = data.state?.ncs?.find((item) => item.id === auth.ncId);
    if (!entry || !row || row.origem !== "Fornecedor" || row.fornecedorEmail !== entry.email || entry.expiresAt <= now() || row.encerradoEm || row.status === "Encerrado") throw error("supplier_link_unavailable", 410);
    return { entry, row };
  }
  function project(row, entry) {
    return {
      id: row.id, descricao: row.descricao, fornecedor: row.origemRef,
      version: row.supplierVersion || 0,
      ishikawa: Object.fromEntries(CAUSES.map((key) => [key, row.ishikawa?.[key] || ""])),
      acoes: (row.acoes || []).filter((action) => action.supplier).map(({ id, desc, prazo, responsavel, status, evidenceIds = [] }) => ({ id, desc, prazo, responsavel, status, evidenceIds })),
      evidences: (entry.files || []).map(({ id, name, size }) => ({ id, name, size })),
      ncEvidences: (row.evidencias || []).filter((file) => file && NC_IMAGE_TYPES.has(file.type)).map(({ id, name, size, type }) => ({ id, name, size, type })),
      respondedAt: entry.respondedAt || null,
    };
  }
  function prepareState(data, submitted, ncEditable) {
    const previous = data.state || {};
    if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) throw error("invalid_state");
    const next = structuredClone(submitted);
    const entries = data.supplierRncPrivate?.entries || [];
    if (!ncEditable) {
      if (previous.ncs) next.ncs = previous.ncs;
      if (previous.ncCatalogs) next.ncCatalogs = previous.ncCatalogs;
      next.supplierStateVersion = previous.supplierStateVersion || 0;
      data.state = next;
      return;
    }
    if (next.ncs === undefined) next.ncs = previous.ncs || [];
    if (!Array.isArray(next.ncs)) throw error("invalid_ncs");
    const ids = new Set();
    for (const row of next.ncs) {
      if (!row || typeof row.id !== "string" || row.id.length > 100 || ids.has(row.id)) throw error("invalid_nc_id");
      ids.add(row.id);
      const old = previous.ncs?.find((item) => item.id === row.id);
      const existing = entries.find((item) => item.ncId === row.id);
      if (old && Number(old.supplierVersion || 0) !== Number(row.supplierVersion || 0)) throw error("supplier_response_conflict", 409);
      if (row.origem === "Fornecedor" && (row.fornecedorEmail || !old || old.origem !== "Fornecedor")) {
        row.fornecedorEmail = text(row.fornecedorEmail || "", 254).toLowerCase();
        if (!mailer.isEmail(row.fornecedorEmail)) throw error("invalid_supplier_email");
        if (!existing || existing.email !== row.fornecedorEmail) {
          if (existing) entries.splice(entries.indexOf(existing), 1);
          entries.push({ ncId: row.id, email: row.fornecedorEmail, nonce: crypto.randomBytes(32).toString("base64url"), createdAt: now(), expiresAt: now() + 90 * DAY, files: existing?.files || [] });
        }
      }
      if (existing || entries.some((item) => item.ncId === row.id)) {
        row.supplierVersion = Number(old?.supplierVersion || 0) + (isDeepStrictEqual(old, row) ? 0 : 1);
        // Delivery/response metadata is owned by the server.
        row.fornecedorRespostaEm = old?.fornecedorRespostaEm || "";
      }
    }
    // Removing a RNC also revokes its link. Stale deletions must not erase a response.
    for (const old of previous.ncs || []) {
      if (!ids.has(old.id) && old.fornecedorRespostaEm && next.supplierStateVersion !== previous.supplierStateVersion) throw error("supplier_response_conflict", 409);
    }
    next.supplierStateVersion = previous.supplierStateVersion || 0;
    data.state = next;
    data.supplierRncPrivate = { entries: entries.filter((entry) => next.ncs.some((row) => row.id === entry.ncId && row.origem === "Fornecedor")) };
  }
  async function read(token) {
    const auth = parseToken(token);
    return db.mutateSupplierData(auth.companyId, (data) => { const { row, entry } = resolve(data, auth); return project(row, entry); });
  }
  async function respond(token, body) {
    const auth = parseToken(token);
    if (!body || Object.keys(body).some((key) => !["version", "ishikawa", "acoes"].includes(key))) throw error("invalid_supplier_response");
    if (!body.ishikawa || Object.keys(body.ishikawa).some((key) => !CAUSES.includes(key)) || !Array.isArray(body.acoes) || body.acoes.length > 30) throw error("invalid_supplier_response");
    const ishikawa = Object.fromEntries(CAUSES.map((key) => [key, text(body.ishikawa[key] ?? "")]));
    if (!Object.values(ishikawa).some(Boolean) && !body.acoes.length) throw error("empty_supplier_response");
    return db.mutateSupplierData(auth.companyId, (data) => {
      const { row, entry } = resolve(data, auth);
      if (entry.respondedAt) throw error("supplier_response_already_submitted", 409);
      if (body.version !== (row.supplierVersion || 0)) throw error("supplier_response_conflict", 409);
      const seen = new Set();
      const actions = body.acoes.map((action) => {
        if (!action || Object.keys(action).some((key) => !["id", "desc", "prazo", "responsavel", "status", "evidenceIds"].includes(key))) throw error("invalid_action");
        const old = (row.acoes || []).find((item) => item.id === action.id && item.supplier);
        if (action.id && !old) throw error("invalid_action");
        const id = old?.id || `AC-${crypto.randomUUID()}`;
        if (seen.has(id)) throw error("invalid_action");
        seen.add(id);
        const evidenceIds = action.evidenceIds || [];
        if (!Array.isArray(evidenceIds) || evidenceIds.length > 10 || evidenceIds.some((id) => !(entry.files || []).some((file) => file.id === id))) throw error("invalid_evidence");
        const result = { id, desc: text(action.desc), prazo: text(action.prazo, 120), responsavel: text(action.responsavel, 200), status: text(action.status, 120), evidenceIds: [...new Set(evidenceIds)], supplier: true };
        if (![result.desc, result.prazo, result.responsavel, result.status].every(Boolean)) throw error("incomplete_action");
        result.evidencia = evidenceIds.map((id) => entry.files.find((file) => file.id === id).name).join(", ");
        result.concluidaEm = result.status === "Concluída" ? old?.concluidaEm || new Date(now()).toISOString().slice(0, 10) : "";
        return result;
      });
      row.ishikawa = ishikawa;
      row.acoes = [...(row.acoes || []).filter((action) => !action.supplier), ...actions];
      row.supplierVersion = (row.supplierVersion || 0) + 1;
      data.state.supplierStateVersion = (data.state.supplierStateVersion || 0) + 1;
      entry.respondedAt = new Date(now()).toISOString();
      row.fornecedorRespostaEm = entry.respondedAt;
      row.status = row.acoes.length ? (row.acoes.every((action) => action.status === "Concluída") ? "Aguardando eficácia" : "Ações em andamento") : "Aguardando análise";
      row.eficaciaIniciadaEm = row.status === "Aguardando eficácia" ? row.eficaciaIniciadaEm || entry.respondedAt.slice(0, 10) : "";
      row.historico ||= [];
      row.historico.push({ ts: entry.respondedAt, texto: `Fornecedor ${entry.email} respondeu a análise de causa e as ações corretivas.` });
      return project(row, entry);
    });
  }
  async function upload(token, body) {
    const auth = parseToken(token);
    const name = text(body?.name, 180).replace(/[\\/\r\n]/g, "_");
    if (!/\.(pdf|png|jpe?g|webp|txt|csv|xlsx?|docx?)$/i.test(name) || typeof body?.base64 !== "string" || body.base64.length > 2800000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.base64)) throw error("invalid_evidence");
    const bytes = Buffer.from(body.base64, "base64");
    if (!bytes.length || bytes.length > 2 * 1024 * 1024 || bytes.toString("base64") !== body.base64) throw error("invalid_evidence");
    return db.mutateSupplierData(auth.companyId, (data) => {
      const { entry } = resolve(data, auth);
      entry.files ||= [];
      if (entry.files.length >= 10) throw error("evidence_limit");
      const file = { id: crypto.randomUUID(), name, size: bytes.length, base64: body.base64 };
      entry.files.push(file);
      return { id: file.id, name, size: file.size };
    });
  }
  async function download(token, fileId) {
    const auth = parseToken(token);
    return db.mutateSupplierData(auth.companyId, (data) => {
      const { entry } = resolve(data, auth);
      const file = entry.files?.find((item) => item.id === fileId);
      if (!file) throw error("evidence_not_found", 404);
      return file;
    });
  }
  async function remove(token, fileId) {
    const auth = parseToken(token);
    return db.mutateSupplierData(auth.companyId, (data) => {
      const { entry } = resolve(data, auth);
      if (entry.respondedAt) throw error("supplier_response_already_submitted", 409);
      const index = (entry.files || []).findIndex((item) => item.id === fileId);
      if (index < 0) throw error("evidence_not_found", 404);
      const [file] = entry.files.splice(index, 1);
      return { ok: true, id: file.id };
    });
  }
  async function downloadNcEvidence(token, fileId) {
    const auth = parseToken(token);
    const metadata = await db.mutateSupplierData(auth.companyId, (data) => {
      const { row } = resolve(data, auth);
      const file = row.evidencias?.find((item) => item?.id === fileId && NC_IMAGE_TYPES.has(item.type));
      if (!file) throw error("nc_evidence_not_found", 404);
      return { id: file.id, name: file.name, size: file.size, type: file.type };
    });
    const stored = await db.getCompanyData(auth.companyId, `ncAttachment:${metadata.id}`);
    if (!stored?.base64 || stored.type !== metadata.type || stored.name !== metadata.name || !NC_IMAGE_TYPES.has(stored.type)) throw error("nc_evidence_not_found", 404);
    return { ...metadata, base64: stored.base64 };
  }
  async function deliver(companyId) {
    const privateData = await db.getCompanyData(companyId, "supplierRncPrivate");
    const results = [];
    for (const item of privateData?.entries || []) {
      const job = await db.mutateSupplierData(companyId, (data) => {
        let resolved;
        try { resolved = resolve(data, { ncId: item.ncId, nonce: item.nonce }); } catch { return null; }
        const { entry, row } = resolved;
        const kind = !entry.sentAt ? "invite" : !entry.respondedAt && !entry.remindedAt && now() - entry.sentAt >= 7 * DAY ? "reminder" : null;
        if (!kind || entry.leaseUntil > now()) return null;
        entry.leaseUntil = now() + 60000;
        return { entry: structuredClone(entry), kind, id: row.id };
      });
      if (!job) continue;
      const link = `${appUrl}/supplier-rnc#${makeToken(companyId, job.entry)}`;
      const reminder = job.kind === "reminder";
      let result;
      try {
        result = !appUrl ? { status: "not_configured" } : await sendEmail({
          to: job.entry.email,
          subject: `${reminder ? "Lembrete: " : "Resposta solicitada: "}${job.id}`,
          html: `<h2>${escape(job.id)}</h2><p>${reminder ? "Já se passaram sete dias e não obtivemos resposta referente à RNC. A pontuação do fornecedor poderá ser afetada para fins comerciais." : "Solicitamos sua análise de causa e as ações corretivas para esta não conformidade."}</p><p><a href="${escape(link)}">Responder RNC</a></p><p>O acesso é exclusivo a esta RNC. O link expira em 90 dias a partir da emissão.</p>`,
          tag: "supplier_rnc", idempotencyKey: `supplier-${job.entry.nonce}-${job.kind}`,
        });
      } catch { result = { status: "failed" }; }
      await db.mutateSupplierData(companyId, (data) => {
        const entry = data.supplierRncPrivate?.entries.find((entry) => entry.nonce === job.entry.nonce);
        if (!entry) return;
        entry.leaseUntil = 0;
        entry.deliveryStatus = result.status;
        if (result.status === "sent") entry[reminder ? "remindedAt" : "sentAt"] = now();
      });
      results.push({ ncId: job.id, kind: job.kind, status: result.status });
    }
    return results;
  }
  async function runNotifications() {
    const results = [];
    for (const target of await db.listNotificationTargets(true)) results.push(...await deliver(target.company.id));
    return results;
  }
  return { prepareState, read, respond, upload, download, remove, downloadNcEvidence, deliver, runNotifications };
}

module.exports = { createSupplierRnc };
