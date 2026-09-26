const crypto = require("node:crypto");
const db = require("./db");

const DAY = 86400000;
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function createSatisfactionApproval({ secret, appUrl, now = () => Date.now() }) {
  const sign = (payload) => crypto.createHmac("sha256", secret).update(`satisfaction-approval:${payload}`).digest("base64url");
  const makeToken = (companyId, version, nonce) => {
    const payload = Buffer.from(JSON.stringify([companyId, version, nonce])).toString("base64url");
    return `${payload}.${sign(payload)}`;
  };

  function parseToken(token) {
    if (typeof token !== "string" || token.length > 1200) throw error("invalid_approval_link", 401);
    const [payload, signature, extra] = token.split(".");
    const expected = sign(payload || "");
    if (extra || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw error("invalid_approval_link", 401);
    try {
      const [companyId, version, nonce] = JSON.parse(Buffer.from(payload, "base64url"));
      if (!Number.isSafeInteger(companyId) || companyId < 1 || typeof version !== "string" || !/^\d{2,}$/.test(version) || typeof nonce !== "string") throw new Error();
      return { companyId, version, nonce };
    } catch {
      throw error("invalid_approval_link", 401);
    }
  }

  function resolve(data, auth) {
    const form = data.state?.satisfaction?.qps_sat_form;
    const version = form?.versoes?.find((item) => item?.versao === auth.version);
    const approval = version?.aprovacaoExterna;
    if (!form || !version || !approval || approval.nonce !== auth.nonce || approval.expiresAt <= now()) throw error("approval_link_unavailable", 410);
    return { form, version, approval };
  }

  function addHistory(version, texto) {
    version.historico ||= [];
    version.historico.push({ ts: new Date(now()).toISOString(), texto });
  }

  function project(version, approval) {
    return {
      version: version.versao,
      status: approval.status,
      approver: approval.approver?.name || "Alta Direção",
      requestedBy: approval.requester?.name || "",
      requestedAt: approval.requestedAt,
      decidedAt: approval.decidedAt || null,
      considerations: approval.considerations || "",
    };
  }

  async function request(companyId, { version: requestedVersion, approver, requester }) {
    if (!approver?.id || !approver?.name || !approver?.email || !requester?.name || !requester?.email) throw error("invalid_approval_request");
    const versionId = String(requestedVersion || "");
    if (!/^\d{2,}$/.test(versionId)) throw error("invalid_approval_request");
    const createdAt = new Date(now()).toISOString();
    const result = await db.mutateSupplierData(companyId, (data) => {
      const form = data.state?.satisfaction?.qps_sat_form;
      const version = form?.versoes?.find((item) => item?.versao === versionId);
      if (!version || version.status !== "Rascunho") throw error("approval_not_available", 409);
      const nonce = crypto.randomBytes(32).toString("base64url");
      const approval = {
        nonce,
        status: "Pendente",
        requestedAt: createdAt,
        expiresAt: now() + 30 * DAY,
        approver: { id: String(approver.id), name: String(approver.name).slice(0, 180), email: String(approver.email).slice(0, 254) },
        requester: { id: String(requester.id || ""), name: String(requester.name).slice(0, 180), email: String(requester.email).slice(0, 254) },
        deliveryStatus: "pending",
      };
      version.status = "Aguardando aprovação";
      version.aprovacaoExterna = approval;
      delete version.contestacao;
      addHistory(version, `Rev. <b>${escape(version.versao)}</b> enviada para aprovação de <b>${escape(approval.approver.name)}</b> por <b>${escape(approval.requester.name)}</b>.`);
      return { approval: structuredClone(approval), link: `${appUrl}/satisfaction-approval#${makeToken(companyId, version.versao, nonce)}`, satisfaction: structuredClone(data.state.satisfaction) };
    });
    return result;
  }

  async function markDelivery(companyId, versionId, nonce, deliveryStatus) {
    return db.mutateSupplierData(companyId, (data) => {
      const version = data.state?.satisfaction?.qps_sat_form?.versoes?.find((item) => item?.versao === versionId);
      if (version?.aprovacaoExterna?.nonce === nonce) version.aprovacaoExterna.deliveryStatus = deliveryStatus;
      return structuredClone(data.state?.satisfaction || {});
    });
  }

  async function read(token) {
    const auth = parseToken(token);
    return db.mutateSupplierData(auth.companyId, (data) => {
      const { version, approval } = resolve(data, auth);
      return project(version, approval);
    });
  }

  async function decide(token, body) {
    const auth = parseToken(token);
    const decision = body?.decision;
    const considerations = typeof body?.considerations === "string" ? body.considerations.trim().slice(0, 4000) : "";
    if (!["approved", "contested"].includes(decision) || (decision === "contested" && !considerations)) throw error("invalid_approval_decision");
    return db.mutateSupplierData(auth.companyId, (data) => {
      const { form, version, approval } = resolve(data, auth);
      if (approval.status !== "Pendente") throw error("approval_already_decided", 409);
      const decidedAt = new Date(now()).toISOString();
      approval.status = decision === "approved" ? "Aprovado" : "Contestado";
      approval.decidedAt = decidedAt;
      approval.considerations = decision === "contested" ? considerations : "";
      if (decision === "approved") {
        form.versoes.forEach((item) => {
          if (item.status === "Vigente") {
            item.status = "Obsoleto";
            addHistory(item, `Substituída pela rev. ${escape(version.versao)} — tornou-se Obsoleta.`);
          }
        });
        version.status = "Vigente";
        version.aprovador = approval.approver.name;
        version.dataAprovacao = decidedAt.slice(0, 10);
        addHistory(version, `Aprovada por <b>${escape(approval.approver.name)}</b> — rev. ${escape(version.versao)} tornou-se <b>Vigente</b>.`);
      } else {
        version.status = "Rascunho";
        version.contestacao = { texto: considerations, por: approval.approver.name, em: decidedAt };
        addHistory(version, `<b>${escape(approval.approver.name)}</b> contestou a aprovação: ${escape(considerations)}.`);
      }
      return { companyId: auth.companyId, record: project(version, approval), requester: structuredClone(approval.requester), approver: structuredClone(approval.approver) };
    });
  }

  return { request, markDelivery, read, decide };
}

module.exports = { createSatisfactionApproval };
