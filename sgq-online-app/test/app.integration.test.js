const assert = require("node:assert/strict");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");

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
  return response.headers.get("set-cookie").split(";")[0];
}

function api(baseUrl, pathname, cookie, options = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Cookie: cookie,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
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
      SESSION_SECRET: "segredo-de-teste-com-tamanho-suficiente-123456",
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
      username: "colaborador.teste",
      displayName: "Colaborador Teste",
      role: "Qualidade",
      status: "Ativo",
      password: "Colab-Teste-123",
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
  const createdUser = (await userResponse.json()).user;
  const collaboratorCookie = await login(baseUrl, "colaborador.teste", "Colab-Teste-123");

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
      username: "sem.permissao",
      displayName: "Sem Permissão",
      password: "Senha-Teste-123",
    }),
  });
  assert.equal(deniedUserCreate.status, 403);

  const delegatedAdminResponse = await api(baseUrl, "/api/company/users", adminCookie, {
    method: "POST",
    body: JSON.stringify({
      username: "admin.empresa",
      displayName: "Admin Empresa",
      role: "Administrador",
      status: "Ativo",
      password: "Admin-Empresa-123",
    }),
  });
  assert.equal(delegatedAdminResponse.status, 201);
  const delegatedCookie = await login(baseUrl, "admin.empresa", "Admin-Empresa-123");
  const delegatedBootstrap = await api(baseUrl, "/api/bootstrap", delegatedCookie);
  const delegatedPayload = await delegatedBootstrap.json();
  assert.equal(delegatedPayload.user.canManageCompany, false);
  assert.equal(delegatedPayload.user.permissions.manageUsers, true);

  const delegatedUserCreate = await api(baseUrl, "/api/company/users", delegatedCookie, {
    method: "POST",
    body: JSON.stringify({
      username: "criado.pelo.admin",
      displayName: "Criado pelo Admin",
      role: "Colaborador",
      status: "Ativo",
      password: "Senha-Teste-123",
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
    body: new URLSearchParams({ username: "colaborador.teste" }),
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

  const blockResponse = await api(baseUrl, "/api/admin/user", adminCookie, {
    method: "PATCH",
    body: JSON.stringify({
      userId: createdUser.id,
      companyId,
      username: createdUser.username,
      displayName: createdUser.displayName,
      role: createdUser.role,
      status: "Bloqueado",
    }),
  });
  assert.equal(blockResponse.status, 200);

  const revokedResponse = await api(baseUrl, "/api/bootstrap", collaboratorCookie);
  assert.equal(revokedResponse.status, 401, stderr);
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
