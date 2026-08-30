const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const querystring = require("querystring");
const {
  createCompany,
  createUser,
  ensureInitialized,
  findUser,
  getCompany,
  getCompanyData,
  listAdminOverview,
  resetUserPassword,
  setCompanyData,
  syncConfiguredUsers,
  updateAdminCompany,
  updateAdminUser,
  updateCompany,
  updateUserProfile,
} = require("./db");

loadLocalEnv();

const port = Number(process.env.PORT || 4180);
const host = process.env.HOST || "127.0.0.1";
const root = __dirname;
const publicDir = path.join(root, "public");
const sessionSecret = process.env.SESSION_SECRET || "qualitypro-dev-secret-change-me";
const loginUser = process.env.SGQ_LOGIN_USER || process.env.SGQ_USER_EMAIL || "";
const loginPassword = process.env.SGQ_USER_PASSWORD || "";
const adminUser = process.env.SGQ_ADMIN_USER || "viniciusrst";
const extraLogins = parseExtraLogins(process.env.SGQ_EXTRA_LOGINS || "");
const configuredLogins = getAllowedLogins();
let bootstrapPromise;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const index = trimmed.indexOf("=");
    if (index === -1) return;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

function parseExtraLogins(rawValue) {
  return rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(":");
      if (parts.length < 2) return null;

      return {
        user: parts[0],
        password: parts[1],
        companyName: parts.slice(2).join(":") || "",
      };
    })
    .filter(Boolean);
}

function getAllowedLogins() {
  const primaryLogin =
    loginUser && loginPassword
      ? [{ user: loginUser, password: loginPassword, companyName: process.env.SGQ_COMPANY_NAME || "" }]
      : [];

  return [...primaryLogin, ...extraLogins];
}

function findValidLogin(username, password) {
  return findUser(username, password);
}

async function bootstrapDatabase() {
  if (!bootstrapPromise) {
    bootstrapPromise = ensureInitialized().then(() => syncConfiguredUsers(configuredLogins));
  }

  return bootstrapPromise;
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

function createSession(user) {
  const payload = Buffer.from(
    JSON.stringify({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      companyId: user.companyId,
      expiresAt: Date.now() + 1000 * 60 * 60 * 12,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function readSession(req) {
  const token = parseCookies(req.headers.cookie).sgq_session;
  if (!token || !token.includes(".")) return null;

  const [payload, signature] = token.split(".");
  if (signature !== sign(payload)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.expiresAt || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
}

function generateTemporaryPassword() {
  return crypto.randomBytes(5).toString("base64url");
}

function isAdminSession(session) {
  return String(session?.username || "").toLowerCase() === String(adminUser || "").toLowerCase();
}

function redirect(res, location) {
  send(res, 302, "", { Location: location });
}

function isUniqueError(error) {
  return error?.code === "23505";
}

function serveFile(res, filePath) {
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(publicDir)) {
    send(res, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  fs.readFile(normalized, (error, data) => {
    if (error) {
      send(res, 404, "Arquivo não encontrado", {
        "Content-Type": "text/plain; charset=utf-8",
      });
      return;
    }

    const ext = path.extname(normalized).toLowerCase();
    send(res, 200, data, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 100_000) req.destroy();
    });
    req.on("end", () => resolve(body));
  });
}

async function readJsonBody(req) {
  const rawBody = await readBody(req);
  if (!rawBody) return {};
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

function loginPage(error = "") {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#050b16" />
  <title>Login - QualityPro Cloud</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/login.css" />
</head>
<body>
  <main class="login-page">
    <section class="login-card">
      <img class="login-logo" src="/assets/qualitypro-cloud-logo-transparent.png" alt="QualityPro Cloud" />
      <p class="kicker">QualityPro Cloud</p>
      <h1>Acesse seu SGQ Online</h1>
      <p class="intro">Entre para acessar o painel inicial do Sistema de Gestão da Qualidade.</p>
      ${error ? `<p class="login-error">${error}</p>` : ""}
      <form method="post" action="/login" class="login-form">
        <label>
          <span>Usuário</span>
          <input name="username" type="text" autocomplete="username" required autofocus />
        </label>
        <label>
          <span>Senha</span>
          <input name="password" type="password" autocomplete="current-password" required placeholder="Digite a senha" />
        </label>
        <button type="submit">Entrar no sistema</button>
      </form>
      <p class="hint">Acesso restrito a usuários autorizados.</p>
    </section>
  </main>
</body>
</html>`;
}

async function handleRequest(req, res) {
  try {
    await bootstrapDatabase();
  } catch (error) {
    console.error("Falha ao inicializar banco de dados:", error);
    sendJson(res, 500, { error: "database_unavailable" });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const session = readSession(req);

  if (url.pathname.startsWith("/api/")) {
    await handleApiRequest(req, res, url, session);
    return;
  }

  if (url.pathname === "/login" && req.method === "GET") {
    send(res, 200, loginPage(), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (url.pathname === "/login" && req.method === "POST") {
    const body = querystring.parse(await readBody(req));
    const validLogin = await findValidLogin(body.username, body.password);

    if (!validLogin) {
      send(res, 401, loginPage("Usuário ou senha inválidos."), {
        "Content-Type": "text/html; charset=utf-8",
      });
      return;
    }

    send(res, 302, "", {
      Location: "/app",
      "Set-Cookie": `sgq_session=${encodeURIComponent(createSession(validLogin))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`,
    });
    return;
  }

  if (url.pathname === "/logout" && req.method === "POST") {
    send(res, 302, "", {
      Location: "/login",
      "Set-Cookie": "sgq_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    });
    return;
  }

  if (url.pathname === "/" || url.pathname === "/app") {
    if (!session) {
      redirect(res, "/login");
      return;
    }
    serveFile(res, path.join(publicDir, "app.html"));
    return;
  }

  if (url.pathname === "/login.css") {
    serveFile(res, path.join(publicDir, "login.css"));
    return;
  }

  if (
    url.pathname === "/assets/qualitypro-cloud-logo.png" ||
    url.pathname === "/assets/qualitypro-cloud-logo-transparent.png" ||
    url.pathname === "/assets/qualitypro-cloud-logo-light.png"
  ) {
    serveFile(res, path.join(publicDir, url.pathname));
    return;
  }

  if (!session) {
    redirect(res, "/login");
    return;
  }

  serveFile(res, path.join(publicDir, url.pathname));
}

async function handleApiRequest(req, res, url, session) {
  if (!session) {
    sendJson(res, 401, { error: "unauthorized" });
    return;
  }

  const companyId = session.companyId;

  if (url.pathname === "/api/bootstrap" && req.method === "GET") {
    const savedState = await getCompanyData(companyId, "state");
    const savedContext = await getCompanyData(companyId, "context");
    const savedRisk = await getCompanyData(companyId, "risk");
    const savedLeadership = await getCompanyData(companyId, "leadership");
    let company = await getCompany(companyId);

    if (savedState?.company?.name && savedState.company.name !== company?.name) {
      company = await updateCompany(companyId, {
        name: savedState.company.name,
        cnpj: savedState.company.cnpj,
        scope: savedState.company.scope,
        certification: savedState.company.certification,
        plan: savedState.settings?.companyAccess || company?.plan,
      });
    }

    sendJson(res, 200, {
      user: {
        id: session.userId,
        username: session.username,
        name: session.displayName,
        role: session.role,
        companyId,
        isAdmin: isAdminSession(session),
      },
      company,
      needsOnboarding: !savedState,
      state: savedState,
      context: savedContext,
      risk: savedRisk,
      leadership: savedLeadership,
    });
    return;
  }

  if (url.pathname === "/api/onboarding" && req.method === "POST") {
    const body = await readJsonBody(req);
    if (!body || typeof body !== "object") {
      sendJson(res, 400, { error: "invalid_payload" });
      return;
    }

    const user = await updateUserProfile(session.userId, {
      displayName: body.user?.name,
      role: body.user?.role || session.role,
    });
    const company = await updateCompany(companyId, {
      name: body.company?.name,
      cnpj: body.company?.cnpj,
      scope: body.company?.scope,
      certification: body.company?.certification,
      plan: body.company?.plan,
    });

    await setCompanyData(companyId, "state", body.state);
    await setCompanyData(companyId, "context", body.context);
    await setCompanyData(companyId, "risk", body.risk);
    await setCompanyData(companyId, "leadership", body.leadership);

    sendJson(res, 200, { ok: true, user, company });
    return;
  }

  if (url.pathname === "/api/company" && req.method === "PATCH") {
    const body = await readJsonBody(req);
    if (!body || typeof body !== "object" || !body.name) {
      sendJson(res, 400, { error: "invalid_company" });
      return;
    }

    const company = await updateCompany(companyId, {
      name: body.name,
      cnpj: body.cnpj,
      scope: body.scope,
      certification: body.certification,
      plan: body.plan,
    });

    if (!company) {
      sendJson(res, 404, { error: "company_not_found" });
      return;
    }

    const savedState = (await getCompanyData(companyId, "state")) || {};
    const companyExtras = { ...body };
    delete companyExtras.plan;
    const nextState = {
      ...savedState,
      company: {
        ...(savedState.company || {}),
        ...companyExtras,
        name: company.name,
        cnpj: company.cnpj,
        scope: company.scope,
        certification: company.certification,
      },
      settings: {
        ...(savedState.settings || {}),
        companyAccess: company.plan,
      },
    };
    await setCompanyData(companyId, "state", nextState);

    sendJson(res, 200, { ok: true, company, state: nextState });
    return;
  }

  if (url.pathname === "/api/admin/overview" && req.method === "GET") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    sendJson(res, 200, await listAdminOverview());
    return;
  }

  if (url.pathname === "/api/admin/company" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    if (!body?.name) {
      sendJson(res, 400, { error: "invalid_company" });
      return;
    }

    try {
      const company = await createCompany(body);
      if (!company) {
        sendJson(res, 400, { error: "invalid_company" });
        return;
      }
      sendJson(res, 201, { ok: true, company });
    } catch (error) {
      sendJson(res, isUniqueError(error) ? 409 : 500, {
        error: isUniqueError(error) ? "company_exists" : "company_create_failed",
      });
    }
    return;
  }

  if (url.pathname === "/api/admin/company" && req.method === "PATCH") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    const targetCompanyId = Number(body?.companyId);
    if (!targetCompanyId || !body?.name) {
      sendJson(res, 400, { error: "invalid_company" });
      return;
    }

    try {
      const company = await updateAdminCompany(targetCompanyId, body);
      if (!company) {
        sendJson(res, 404, { error: "company_not_found" });
        return;
      }
      const savedState = (await getCompanyData(targetCompanyId, "state")) || {};
      await setCompanyData(targetCompanyId, "state", {
        ...savedState,
        company: {
          ...(savedState.company || {}),
          name: company.name,
          cnpj: company.cnpj,
          scope: company.scope,
          certification: company.certification,
        },
        settings: {
          ...(savedState.settings || {}),
          companyAccess: company.plan,
        },
      });
      sendJson(res, 200, { ok: true, company });
    } catch (error) {
      sendJson(res, isUniqueError(error) ? 409 : 500, {
        error: isUniqueError(error) ? "company_exists" : "company_update_failed",
      });
    }
    return;
  }

  if (url.pathname === "/api/admin/user" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    if (!body?.companyId || !body?.username || !body?.displayName || !body?.password) {
      sendJson(res, 400, { error: "invalid_user" });
      return;
    }

    try {
      const user = await createUser(body);
      if (!user) {
        sendJson(res, 400, { error: "invalid_user" });
        return;
      }
      sendJson(res, 201, { ok: true, user });
    } catch (error) {
      sendJson(res, isUniqueError(error) ? 409 : 500, {
        error: isUniqueError(error) ? "user_exists" : "user_create_failed",
      });
    }
    return;
  }

  if (url.pathname === "/api/admin/user" && req.method === "PATCH") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    const targetUserId = Number(body?.userId);
    if (!targetUserId || !body?.companyId || !body?.username || !body?.displayName) {
      sendJson(res, 400, { error: "invalid_user" });
      return;
    }

    if (targetUserId === Number(session.userId) && body.status === "Bloqueado") {
      sendJson(res, 400, { error: "cannot_block_self" });
      return;
    }

    try {
      const user = await updateAdminUser(targetUserId, body);
      if (!user) {
        sendJson(res, 404, { error: "user_not_found" });
        return;
      }
      sendJson(res, 200, { ok: true, user });
    } catch (error) {
      sendJson(res, isUniqueError(error) ? 409 : 500, {
        error: isUniqueError(error) ? "user_exists" : "user_update_failed",
      });
    }
    return;
  }

  if (url.pathname === "/api/admin/reset-password" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    const userId = Number(body?.userId);
    if (!userId) {
      sendJson(res, 400, { error: "invalid_user" });
      return;
    }

    const temporaryPassword = generateTemporaryPassword();
    const user = await resetUserPassword(userId, temporaryPassword);
    if (!user) {
      sendJson(res, 404, { error: "user_not_found" });
      return;
    }

    sendJson(res, 200, { ok: true, user, temporaryPassword });
    return;
  }

  if (url.pathname === "/api/data" && req.method === "POST") {
    const body = await readJsonBody(req);
    if (!body || typeof body.key !== "string") {
      sendJson(res, 400, { error: "invalid_payload" });
      return;
    }

    if (!["state", "context", "risk", "leadership"].includes(body.key)) {
      sendJson(res, 400, { error: "invalid_key" });
      return;
    }

    await setCompanyData(companyId, body.key, body.value);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "not_found" });
}

if (require.main === module) {
  const server = http.createServer(handleRequest);

  server.listen(port, host, () => {
    console.log(`SGQ Online rodando em http://${host}:${port}`);
    console.log(`Usuário configurado: ${loginUser}`);
  });
}

module.exports = handleRequest;
