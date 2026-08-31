const assert = require("node:assert/strict");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");
const {
  NobleCryptoPlugin,
  ScureBase32Plugin,
  generateSync,
} = require("otplib");

const csrfTokens = new Map();
const otpCrypto = new NobleCryptoPlugin();
const otpBase32 = new ScureBase32Plugin();

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(baseUrl, child) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Servidor encerrou com código ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
    } catch {
      // Aguarda o processo abrir a porta.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Servidor de teste não iniciou a tempo");
}

async function login(baseUrl, username, password) {
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/app");
  const cookie = response.headers.get("set-cookie").split(";")[0];
  const bootstrap = await fetch(`${baseUrl}/api/bootstrap`, { headers: { Cookie: cookie } });
  assert.equal(bootstrap.status, 200);
  csrfTokens.set(cookie, (await bootstrap.json()).csrfToken);
  return cookie;
}

function api(baseUrl, pathname, cookie, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  return fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Cookie: cookie,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(!["GET", "HEAD", "OPTIONS"].includes(method) && csrfTokens.get(cookie)
        ? { "X-CSRF-Token": csrfTokens.get(cookie) }
        : {}),
      ...(options.headers || {}),
    },
  });
}

async function acceptInvitation(invitationLink, password) {
  const url = new URL(invitationLink);
  const response = await fetch(`${url.origin}/accept-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: url.searchParams.get("token"),
      password,
      passwordConfirmation: password,
    }),
  });
  assert.equal(response.status, 200);
}

async function loginWithMfa(baseUrl, username, password, secret) {
  const loginResponse = await fetch(`${baseUrl}/login`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });
  assert.equal(loginResponse.status, 302);
  assert.equal(loginResponse.headers.get("location"), "/mfa");
  const challengeCookie = loginResponse.headers.get("set-cookie").split(";")[0];
  const code = generateSync({ secret, crypto: otpCrypto, base32: otpBase32 });
  const mfaResponse = await fetch(`${baseUrl}/mfa`, {
    method: "POST",
    redirect: "manual",
    headers: {
      Cookie: challengeCookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ code }),
  });
  assert.equal(mfaResponse.status, 302);
  assert.equal(mfaResponse.headers.get("location"), "/app");
  const sessionCookie = mfaResponse.headers.getSetCookie()
    .map((value) => value.split(";")[0])
    .find((value) => value.startsWith("sgq_session="));
  const bootstrap = await fetch(`${baseUrl}/api/bootstrap`, { headers: { Cookie: sessionCookie } });
  assert.equal(bootstrap.status, 200);
  csrfTokens.set(sessionCookie, (await bootstrap.json()).csrfToken);
  return sessionCookie;
}

test("admin, exportações, backup e revogação de sessão funcionam", async (t) => {
  const port = await freePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sgq-online-test-"));
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      SGQ_DATABASE_MODE: "local",
      SGQ_DATA_DIR: dataDir,
      SGQ_LOGIN_USER: "testadmin",
      SGQ_USER_PASSWORD: "Admin-Teste-123",
      SGQ_COMPANY_NAME: "Empresa de Teste",
      SGQ_ADMIN_USER: "testadmin",
      SGQ_EXTRA_LOGINS: "",
      SGQ_EXPOSE_TEST_TOKENS: "true",
      CRON_SECRET: "cron-secret-test-123456",
      SESSION_SECRET: "segredo-de-teste-com-tamanho-suficiente-123456",
      BACKUP_ENCRYPTION_KEY: "chave-de-backup-de-teste-com-tamanho-suficiente",
      SGQ_BACKUP_DIR: path.join(dataDir, "backups"),
      STRIPE_MOCK_MODE: "true",
      STRIPE_PRICE_ESSENTIAL: "price_essential_test",
      STRIPE_PRICE_PROFESSIONAL: "price_professional_test",
      STRIPE_PRICE_PREMIUM: "price_premium_test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  t.after(() => {
    if (child.exitCode === null) child.kill();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  await waitForServer(baseUrl, child);
  const adminCookie = await login(baseUrl, "testadmin", "Admin-Teste-123");

  const csrfRejected = await fetch(`${baseUrl}/api/data`, {
    method: "POST",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ key: "risk", value: { riscos: [] } }),
  });
  assert.equal(csrfRejected.status, 403);
  assert.equal((await csrfRejected.json()).error, "invalid_csrf_token");

  const overviewResponse = await api(baseUrl, "/api/admin/overview", adminCookie);
  assert.equal(overviewResponse.status, 200);
  const overview = await overviewResponse.json();
  assert.equal(overview.summary.companies, 1);
  assert.equal(overview.summary.activeAccesses, 1);
  assert.ok(overview.logs.some((log) => log.eventType === "login_success"));
  const companyId = overview.companies[0].id;

  const userResponse = await api(baseUrl, "/api/company/users", adminCookie, {
    method: "POST",
    body: JSON.stringify({
      username: "colaborador.teste@example.com",
      displayName: "Colaborador Teste",
      role: "Qualidade",
      status: "Pendente",
      currentPassword: "Admin-Teste-123",
      permissions: {
        modules: true,
        reports: false,
        manageUsers: false,
        moduleAccess: {
          contexto: "view",
          lideranca: "none",
          riscos: "edit",
          documentos: "view",
          auditorias: "view",
          "nao-conformidades": "view",
          equipamentos: "none",
        },
      },
    }),
  });
  assert.equal(userResponse.status, 201);
  const createdPayload = await userResponse.json();
  const createdUser = createdPayload.user;
  assert.equal(createdPayload.invitation.delivery, "not_configured");
  assert.ok(createdPayload.invitation.invitationLink);
  const resendInvitation = await api(baseUrl, "/api/admin/invite", adminCookie, {
    method: "POST",
    body: JSON.stringify({ userId: createdUser.id, currentPassword: "Admin-Teste-123" }),
  });
  assert.equal(resendInvitation.status, 200);
  const resentPayload = await resendInvitation.json();
  await acceptInvitation(resentPayload.invitation.invitationLink, "Colab-Teste-123");
  const collaboratorCookie = await login(baseUrl, "colaborador.teste@example.com", "Colab-Teste-123");

  const collaboratorBootstrap = await api(baseUrl, "/api/bootstrap", collaboratorCookie);
  assert.equal(collaboratorBootstrap.status, 200);
  const collaboratorPayload = await collaboratorBootstrap.json();
  assert.equal(collaboratorPayload.user.permissions.moduleAccess.contexto, "view");
  assert.equal(collaboratorPayload.user.permissions.moduleAccess.riscos, "edit");
  assert.equal(collaboratorPayload.leadership, null);

  const deniedContextSave = await api(baseUrl, "/api/data", collaboratorCookie, {
    method: "POST",
    body: JSON.stringify({ key: "context", value: { swot: [] } }),
  });
  assert.equal(deniedContextSave.status, 403);

  const allowedRiskSave = await api(baseUrl, "/api/data", collaboratorCookie, {
    method: "POST",
    body: JSON.stringify({ key: "risk", value: { riscos: [] } }),
  });
  assert.equal(allowedRiskSave.status, 200);

  const deniedReports = await api(baseUrl, "/api/export?format=pdf", collaboratorCookie);
  assert.equal(deniedReports.status, 403);

  const deniedUserCreate = await api(baseUrl, "/api/company/users", collaboratorCookie, {
    method: "POST",
    body: JSON.stringify({
      username: "sem.permissao@example.com",
      displayName: "Sem Permissão",
    }),
  });
  assert.equal(deniedUserCreate.status, 403);

  const delegatedAdminResponse = await api(baseUrl, "/api/company/users", adminCookie, {
    method: "POST",
    body: JSON.stringify({
      username: "admin.empresa@example.com",
      displayName: "Admin Empresa",
      role: "Administrador",
      status: "Pendente",
      currentPassword: "Admin-Teste-123",
    }),
  });
  assert.equal(delegatedAdminResponse.status, 201);
  const delegatedAdminPayload = await delegatedAdminResponse.json();
  await acceptInvitation(delegatedAdminPayload.invitation.invitationLink, "Admin-Empresa-123");
  const delegatedCookie = await login(baseUrl, "admin.empresa@example.com", "Admin-Empresa-123");
  const delegatedBootstrap = await api(baseUrl, "/api/bootstrap", delegatedCookie);
  const delegatedPayload = await delegatedBootstrap.json();
  assert.equal(delegatedPayload.user.canManageCompany, false);
  assert.equal(delegatedPayload.user.permissions.manageUsers, true);

  const delegatedUserCreate = await api(baseUrl, "/api/company/users", delegatedCookie, {
    method: "POST",
    body: JSON.stringify({
      username: "criado.pelo.admin@example.com",
      displayName: "Criado pelo Admin",
      role: "Colaborador",
      status: "Pendente",
      currentPassword: "Admin-Empresa-123",
    }),
  });
  assert.equal(delegatedUserCreate.status, 201);

  const delegatedCompanyEdit = await api(baseUrl, "/api/company", delegatedCookie, {
    method: "PATCH",
    body: JSON.stringify({ name: "Empresa não autorizada" }),
  });
  assert.equal(delegatedCompanyEdit.status, 403);

  const resetRequest = await fetch(`${baseUrl}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: "colaborador.teste@example.com" }),
  });
  assert.equal(resetRequest.status, 200);
  assert.match(await resetRequest.text(), /instruções serão enviadas/i);

  const pdfResponse = await api(baseUrl, "/api/export?format=pdf", adminCookie);
  assert.equal(pdfResponse.status, 200);
  assert.equal(Buffer.from(await pdfResponse.arrayBuffer()).subarray(0, 4).toString(), "%PDF");

  const xlsxResponse = await api(baseUrl, "/api/export?format=xlsx", adminCookie);
  assert.equal(xlsxResponse.status, 200);
  assert.equal(Buffer.from(await xlsxResponse.arrayBuffer()).subarray(0, 2).toString("hex"), "504b");

  const backupResponse = await api(baseUrl, "/api/admin/backup", adminCookie);
  assert.equal(backupResponse.status, 200);
  const backupText = await backupResponse.text();
  assert.doesNotMatch(backupText, /password_hash/i);
  assert.match(backupText, /Empresa de Teste/);

  const billingResponse = await api(baseUrl, "/api/billing", adminCookie);
  assert.equal(billingResponse.status, 200);
  assert.equal((await billingResponse.json()).plans.length, 3);

  const checkoutResponse = await api(baseUrl, "/api/billing/checkout", adminCookie, {
    method: "POST",
    body: JSON.stringify({ plan: "professional", currentPassword: "Admin-Teste-123" }),
  });
  assert.equal(checkoutResponse.status, 200);
  assert.match((await checkoutResponse.json()).url, /mock_checkout=success/);

  const subscriptionEvent = {
    id: "evt_subscription_trial",
    type: "customer.subscription.updated",
    livemode: false,
    data: {
      object: {
        id: "sub_mock_company",
        customer: `cus_mock_${companyId}`,
        status: "trialing",
        trial_end: Math.floor(Date.now() / 1000) + 14 * 86400,
        cancel_at_period_end: false,
        metadata: { companyId: String(companyId), planKey: "professional" },
        items: { data: [{ price: { id: "price_professional_test" }, current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }] },
      },
    },
  };
  const webhookResponse = await fetch(`${baseUrl}/api/billing/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscriptionEvent),
  });
  assert.equal(webhookResponse.status, 200);
  const billingAfterWebhook = await api(baseUrl, "/api/billing", adminCookie);
  const billingAfterWebhookPayload = await billingAfterWebhook.json();
  assert.equal(
    billingAfterWebhookPayload.company.billingSubscriptionId,
    "sub_mock_company",
    JSON.stringify(billingAfterWebhookPayload.company),
  );
  const duplicateWebhook = await fetch(`${baseUrl}/api/billing/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscriptionEvent),
  });
  assert.equal((await duplicateWebhook.json()).duplicate, true);

  const changePlanResponse = await api(baseUrl, "/api/billing/change-plan", adminCookie, {
    method: "POST",
    body: JSON.stringify({ plan: "premium", currentPassword: "Admin-Teste-123" }),
  });
  const changedPlanPayload = await changePlanResponse.json();
  assert.equal(changePlanResponse.status, 200, JSON.stringify(changedPlanPayload));
  assert.equal(changedPlanPayload.company.plan, "Plano Premium");

  const failedInvoiceEvent = {
    id: "evt_invoice_failed",
    type: "invoice.payment_failed",
    livemode: false,
    data: { object: { id: "in_failed", customer: `cus_mock_${companyId}`, status: "open", amount_due: 9900, currency: "brl" } },
  };
  assert.equal((await fetch(`${baseUrl}/api/billing/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(failedInvoiceEvent),
  })).status, 200);
  assert.equal((await api(baseUrl, "/api/bootstrap", collaboratorCookie)).status, 401);

  const paidInvoiceEvent = {
    id: "evt_invoice_paid",
    type: "invoice.payment_succeeded",
    livemode: false,
    data: { object: { id: "in_paid", customer: `cus_mock_${companyId}`, status: "paid", amount_paid: 9900, currency: "brl" } },
  };
  assert.equal((await fetch(`${baseUrl}/api/billing/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paidInvoiceEvent),
  })).status, 200);
  assert.equal((await api(baseUrl, "/api/bootstrap", collaboratorCookie)).status, 200);

  const automaticBackup = await api(baseUrl, "/api/admin/backups/run", adminCookie, {
    method: "POST",
    body: JSON.stringify({ currentPassword: "Admin-Teste-123" }),
  });
  assert.equal(automaticBackup.status, 200, stderr);
  const automaticBackupPayload = await automaticBackup.json();
  assert.equal(automaticBackupPayload.snapshot.verificationStatus, "verified");

  const verifyBackup = await api(baseUrl, "/api/admin/backups/verify", adminCookie, {
    method: "POST",
    body: JSON.stringify({ snapshotId: automaticBackupPayload.snapshot.id, currentPassword: "Admin-Teste-123" }),
  });
  assert.equal(verifyBackup.status, 200);
  assert.equal((await verifyBackup.json()).counts.companies, 1);

  const clientError = await api(baseUrl, "/api/monitor/client-error", adminCookie, {
    method: "POST",
    body: JSON.stringify({ message: "Erro visual de teste", view: "gerenciamento", source: "integration" }),
  });
  assert.equal(clientError.status, 202);
  const operationsResponse = await api(baseUrl, "/api/admin/operations", adminCookie);
  assert.equal(operationsResponse.status, 200);
  const operations = await operationsResponse.json();
  assert.equal(operations.health.services.database.ok, true);
  assert.equal(operations.backups[0].verificationStatus, "verified");
  assert.ok(operations.incidents.some((incident) => incident.eventType === "client_error"));
  assert.ok(operations.billingEvents.some((event) => event.eventType === "invoice.payment_succeeded"));

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);

  const blockResponse = await api(baseUrl, "/api/admin/user", adminCookie, {
    method: "PATCH",
    body: JSON.stringify({
      userId: createdUser.id,
      companyId,
      username: createdUser.username,
      displayName: createdUser.displayName,
      role: createdUser.role,
      status: "Bloqueado",
      currentPassword: "Admin-Teste-123",
    }),
  });
  assert.equal(blockResponse.status, 200);

  const revokedResponse = await api(baseUrl, "/api/bootstrap", collaboratorCookie);
  assert.equal(revokedResponse.status, 401, stderr);

  const alertState = await api(baseUrl, "/api/data", adminCookie, {
    method: "POST",
    body: JSON.stringify({
      key: "risk",
      value: {
        riscos: [{ id: "RIS-ALERTA", status: "Em Tratamento", prazo: new Date().toISOString().slice(0, 10) }],
      },
    }),
  });
  assert.equal(alertState.status, 200);
  const cronResponse = await fetch(`${baseUrl}/api/cron/notifications`, {
    headers: { Authorization: "Bearer cron-secret-test-123456" },
  });
  assert.equal(cronResponse.status, 200);
  const cronResult = await cronResponse.json();
  assert.equal(cronResult.companies, 1);
  assert.ok(cronResult.recipients >= 1);

  const setupResponse = await api(baseUrl, "/api/security/mfa/setup", adminCookie, {
    method: "POST",
    body: JSON.stringify({ currentPassword: "Admin-Teste-123" }),
  });
  assert.equal(setupResponse.status, 200);
  const setup = await setupResponse.json();
  assert.match(setup.qrCode, /^data:image\/png;base64,/);
  const enableCode = generateSync({ secret: setup.secret, crypto: otpCrypto, base32: otpBase32 });
  const enableResponse = await api(baseUrl, "/api/security/mfa/enable", adminCookie, {
    method: "POST",
    body: JSON.stringify({ code: enableCode, currentPassword: "Admin-Teste-123" }),
  });
  assert.equal(enableResponse.status, 200);
  assert.equal((await enableResponse.json()).recoveryCodes.length, 8);

  const secondAdminCookie = await loginWithMfa(baseUrl, "testadmin", "Admin-Teste-123", setup.secret);
  const sessionsResponse = await api(baseUrl, "/api/security", adminCookie);
  assert.equal(sessionsResponse.status, 200);
  const sessions = (await sessionsResponse.json()).sessions;
  assert.equal(sessions.length, 2);
  const secondSession = sessions.find((item) => !item.current);
  assert.ok(secondSession?.id);

  const revokeSecond = await api(baseUrl, "/api/security/sessions", adminCookie, {
    method: "DELETE",
    body: JSON.stringify({ sessionId: secondSession.id, currentPassword: "Admin-Teste-123" }),
  });
  assert.equal(revokeSecond.status, 200);
  assert.equal((await api(baseUrl, "/api/bootstrap", secondAdminCookie)).status, 401);
});

test("token de recuperação expira após um uso e troca a senha", async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sgq-password-reset-test-"));
  const envBefore = {
    SGQ_DATABASE_MODE: process.env.SGQ_DATABASE_MODE,
    SGQ_DATA_DIR: process.env.SGQ_DATA_DIR,
    DATABASE_URL: process.env.DATABASE_URL,
  };
  process.env.SGQ_DATABASE_MODE = "local";
  process.env.SGQ_DATA_DIR = dataDir;
  delete process.env.DATABASE_URL;
  const dbPath = require.resolve("../db");
  delete require.cache[dbPath];
  const db = require("../db");

  t.after(() => {
    delete require.cache[dbPath];
    Object.entries(envBefore).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  await db.syncConfiguredUsers([{
    user: "recuperacao.teste",
    password: "Senha-Antiga-123",
    companyName: "Empresa Recuperação",
  }]);
  const request = await db.createPasswordResetToken("recuperacao.teste", 30);
  assert.ok(request?.token);
  const updated = await db.consumePasswordResetToken(request.token, "Senha-Nova-456");
  assert.equal(updated.username, "recuperacao.teste");
  assert.equal(await db.findUser("recuperacao.teste", "Senha-Antiga-123"), null);
  assert.ok(await db.findUser("recuperacao.teste", "Senha-Nova-456"));
  assert.equal(await db.consumePasswordResetToken(request.token, "Outra-Senha-789"), null);
});
