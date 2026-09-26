const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sgq-satisfaction-approval-"));
Object.assign(process.env, {
  SGQ_DATABASE_MODE: "local",
  SGQ_DATA_DIR: dataDir,
  SGQ_LOGIN_USER: "approval.owner@example.com",
  SGQ_USER_PASSWORD: "Approval-Test-123",
  SGQ_COMPANY_NAME: "Approval Test",
  SGQ_ADMIN_USER: "unused-admin",
  SGQ_EXTRA_LOGINS: "",
  SESSION_SECRET: "satisfaction-approval-test-secret-long-and-isolated",
});

const db = require("../db");
const { createSatisfactionApproval } = require("../satisfaction-approval");

const version = (number, status) => ({ versao: number, status, perguntas: [{ id: "P1", texto: "Como foi sua experiência?", tipo: "escala" }], aprovador: "", dataAprovacao: "", historico: [] });

test("aprovação externa de satisfação aprova ou contesta uma revisão sem expor o estado da empresa", async () => {
  let time = Date.now();
  const service = createSatisfactionApproval({ secret: process.env.SESSION_SECRET, appUrl: "https://sgq.example.test", now: () => time });
  await db.syncConfiguredUsers([{ user: process.env.SGQ_LOGIN_USER, password: process.env.SGQ_USER_PASSWORD, companyName: "Approval Test" }]);
  const user = await db.findUser(process.env.SGQ_LOGIN_USER, process.env.SGQ_USER_PASSWORD);
  const companyId = user.companyId;
  await db.mutateSupplierData(companyId, (data) => {
    data.state = { satisfaction: { qps_sat_form: { versoes: [version("01", "Vigente"), version("02", "Rascunho")] } } };
  });

  const approver = { id: 7, name: "Diretora de Qualidade", email: "diretoria@example.test" };
  const requester = { id: user.id, name: "Responsável pelo formulário", email: process.env.SGQ_LOGIN_USER };
  const request = await service.request(companyId, { version: "02", approver, requester });
  const token = new URL(request.link).hash.slice(1);
  const publicRecord = await service.read(token);
  assert.deepEqual(publicRecord, {
    version: "02", status: "Pendente", approver: approver.name, requestedBy: requester.name,
    requestedAt: publicRecord.requestedAt, decidedAt: null, considerations: "",
  });
  assert.equal(publicRecord.versoes, undefined);
  assert.equal((await db.getCompanyData(companyId, "state")).satisfaction.qps_sat_form.versoes[1].status, "Aguardando aprovação");

  time += 1000;
  const approved = await service.decide(token, { decision: "approved" });
  assert.equal(approved.record.status, "Aprovado");
  const afterApproval = (await db.getCompanyData(companyId, "state")).satisfaction.qps_sat_form.versoes;
  assert.equal(afterApproval[0].status, "Obsoleto");
  assert.equal(afterApproval[1].status, "Vigente");
  assert.equal(afterApproval[1].aprovador, approver.name);
  await assert.rejects(service.decide(token, { decision: "approved" }), { status: 409, message: "approval_already_decided" });

  await db.mutateSupplierData(companyId, (data) => { data.state.satisfaction.qps_sat_form.versoes.push(version("03", "Rascunho")); });
  const contestedRequest = await service.request(companyId, { version: "03", approver, requester });
  const contestedToken = new URL(contestedRequest.link).hash.slice(1);
  const contested = await service.decide(contestedToken, { decision: "contested", considerations: "Inclua a pergunta sobre prazo de entrega." });
  assert.equal(contested.record.status, "Contestado");
  const afterContestation = (await db.getCompanyData(companyId, "state")).satisfaction.qps_sat_form.versoes[2];
  assert.equal(afterContestation.status, "Rascunho");
  assert.equal(afterContestation.contestacao.texto, "Inclua a pergunta sobre prazo de entrega.");
  await assert.rejects(service.read(`${contestedToken.slice(0, -4)}test`), { status: 401, message: "invalid_approval_link" });
});
