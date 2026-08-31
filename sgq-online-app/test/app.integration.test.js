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

  const userResponse = await api(baseUrl, "/api/admin/user", adminCookie, {
    method: "POST",
    body: JSON.stringify({
      companyId,
      username: "colaborador.teste",
      displayName: "Colaborador Teste",
      role: "Qualidade",
      status: "Ativo",
      password: "Colab-Teste-123",
    }),
  });
  assert.equal(userResponse.status, 201);
  const createdUser = (await userResponse.json()).user;
  const collaboratorCookie = await login(baseUrl, "colaborador.teste", "Colab-Teste-123");

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
