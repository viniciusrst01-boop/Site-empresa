const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const querystring = require("querystring");

loadLocalEnv();

const {
  canAddCompanyUser,
  consumePasswordResetToken,
  countRecentFailedLogins,
  countRecentPasswordResetRequests,
  createCompany,
  createPasswordResetToken,
  createUser,
  deleteCompanyUser,
  ensureInitialized,
  findUser,
  getBackupSnapshot,
  getCompany,
  getCompanyData,
  listCompanyData,
  listCompanyUsers,
  listAdminOverview,
  recordAuditLog,
  resetUserPassword,
  setCompanyData,
  syncConfiguredUsers,
  updateAdminCompany,
  updateAdminUser,
  updateCompanyUser,
  updateCompany,
  updateUserProfile,
  validateSessionUser,
} = require("./db");
const { createExcelReport, createPdfReport } = require("./exporters");

const port = Number(process.env.PORT || 4180);
const host = process.env.HOST || "127.0.0.1";
const root = __dirname;
const publicDir = path.join(root, "public");
const sessionSecret = process.env.SESSION_SECRET || "qualitypro-dev-secret-change-me";
const sessionTtlHours = Math.max(1, Math.min(Number(process.env.SESSION_TTL_HOURS) || 8, 24));
const loginUser = process.env.SGQ_LOGIN_USER || process.env.SGQ_USER_EMAIL || "";
const loginPassword = process.env.SGQ_USER_PASSWORD || "";
const adminUser = process.env.SGQ_ADMIN_USER || "viniciusrst";
const extraLogins = parseExtraLogins(process.env.SGQ_EXTRA_LOGINS || "");
const configuredLogins = getAllowedLogins();
const publicAppUrl = String(
  process.env.PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : ""),
).replace(/\/$/, "");
const sgqModuleIds = [
  "contexto",
  "lideranca",
  "riscos",
  "documentos",
  "auditorias",
  "nao-conformidades",
  "equipamentos",
];
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
    if (key && process.env[key] === undefined) {
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
      sessionVersion: Number(user.sessionVersion || 1),
      sessionId: crypto.randomBytes(16).toString("base64url"),
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * sessionTtlHours,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function readSession(req) {
  const token = parseCookies(req.headers.cookie).sgq_session;
  if (!token || !token.includes(".")) return null;

  const [payload, signature] = token.split(".");
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature || "");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.expiresAt || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

async function validateSession(session) {
  if (!session) return null;
  const user = await validateSessionUser(
    session.userId,
    session.companyId,
    session.sessionVersion,
  );
  if (!user) return null;
  return {
    ...session,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    companyId: user.companyId,
  };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    ...headers,
  });
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
}

function generateTemporaryPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

function requestIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "";
}

function requestUserAgent(req) {
  return String(req.headers["user-agent"] || "").slice(0, 500);
}

function sessionCookie(req, token, maxAgeSeconds) {
  const isSecure =
    Boolean(process.env.VERCEL) || String(req.headers["x-forwarded-proto"] || "").toLowerCase() === "https";
  const secure = isSecure ? "; Secure" : "";
  return `sgq_session=${token ? encodeURIComponent(token) : ""}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
}

async function auditRequest(req, session, eventType, outcome = "success", metadata = {}) {
  return recordAuditLog({
    companyId: session?.companyId || null,
    userId: session?.userId || null,
    username: session?.username || metadata.username || "",
    eventType,
    outcome,
    ipAddress: requestIp(req),
    userAgent: requestUserAgent(req),
    metadata,
  });
}

function safeFilename(value) {
  return String(value || "empresa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "empresa";
}

function sendDownload(res, contentType, filename, buffer) {
  send(res, 200, buffer, {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": String(buffer.length),
    "Cache-Control": "no-store",
  });
}

function isAdminSession(session) {
  return String(session?.username || "").toLowerCase() === String(adminUser || "").toLowerCase();
}

async function isCompanyOwnerSession(session) {
  if (isAdminSession(session)) return true;
  return isCompanyOwnerUser(session.companyId, session.userId, session.role);
}

async function isCompanyOwnerUser(companyId, userId, role = "") {
  const users = await listCompanyUsers(companyId);
  const firstUser = users.sort((a, b) => Number(a.id) - Number(b.id))[0];
  return Boolean(
    firstUser &&
    Number(firstUser.id) === Number(userId) &&
    String(role || firstUser.role || "").toLowerCase().includes("administrador"),
  );
}

function redirect(res, location) {
  send(res, 302, "", { Location: location });
}

function isUniqueError(error) {
  return error?.code === "23505";
}

async function listUsersWithCompanySettings(companyId) {
  const users = await listCompanyUsers(companyId);
  const settings = (await getCompanyData(companyId, "userSettings")) || {};
  return users.map((user) => {
    const userSettings = settings[user.id] || {};
    return {
      ...user,
      ...userSettings,
      permissions: normalizePermissions(user.role, userSettings.permissions),
    };
  });
}

async function saveCompanyUserSettings(companyId, userId, values) {
  const settings = (await getCompanyData(companyId, "userSettings")) || {};
  const permissions = normalizePermissions(values.role, values.permissions);
  settings[userId] = {
    ...(settings[userId] || {}),
    department: values.department || "",
    permissions,
  };
  await setCompanyData(companyId, "userSettings", settings);
}

function defaultModuleAccessForRole(role) {
  const normalizedRole = String(role || "").toLowerCase();
  const editAll = ["administrador", "gestor", "qualidade"].includes(normalizedRole);
  return Object.fromEntries(
    sgqModuleIds.map((moduleId) => {
      if (editAll) return [moduleId, "edit"];
      if (normalizedRole === "auditor" && moduleId === "auditorias") return [moduleId, "edit"];
      return [moduleId, "view"];
    }),
  );
}

function defaultPermissionsForRole(role) {
  const normalizedRole = String(role || "").toLowerCase();
  return {
    modules: true,
    reports: ["administrador", "gestor", "qualidade"].includes(normalizedRole),
    manageUsers: normalizedRole === "administrador",
    moduleAccess: defaultModuleAccessForRole(role),
  };
}

function normalizePermissions(role, values = {}) {
  const defaults = defaultPermissionsForRole(role);
  const source = values && typeof values === "object" ? values : {};
  const sourceModules = source.moduleAccess && typeof source.moduleAccess === "object"
    ? source.moduleAccess
    : {};
  const moduleAccess = Object.fromEntries(
    sgqModuleIds.map((moduleId) => {
      const access = String(sourceModules[moduleId] || defaults.moduleAccess[moduleId]).toLowerCase();
      return [moduleId, ["none", "view", "edit"].includes(access) ? access : defaults.moduleAccess[moduleId]];
    }),
  );
  const modules = source.modules === undefined ? defaults.modules : Boolean(source.modules);
  if (!modules) {
    sgqModuleIds.forEach((moduleId) => {
      moduleAccess[moduleId] = "none";
    });
  }
  return {
    modules,
    reports: source.reports === undefined ? defaults.reports : Boolean(source.reports),
    manageUsers: source.manageUsers === undefined ? defaults.manageUsers : Boolean(source.manageUsers),
    moduleAccess,
  };
}

async function getSessionPermissions(session, canManage = null) {
  const managesCompany = canManage ?? (await isCompanyOwnerSession(session));
  if (managesCompany) {
    return {
      modules: true,
      reports: true,
      manageUsers: true,
      moduleAccess: Object.fromEntries(sgqModuleIds.map((moduleId) => [moduleId, "edit"])),
    };
  }
  const settings = (await getCompanyData(session.companyId, "userSettings")) || {};
  return normalizePermissions(session.role, settings[session.userId]?.permissions || {});
}

async function canManageCompanyUsers(session) {
  const permissions = await getSessionPermissions(session);
  return Boolean(permissions.manageUsers);
}

function canEditModule(permissions, moduleId) {
  return Boolean(
    permissions?.modules &&
    sgqModuleIds.includes(moduleId) &&
    permissions.moduleAccess?.[moduleId] === "edit",
  );
}

function canViewModule(permissions, moduleId) {
  return Boolean(
    permissions?.modules &&
    sgqModuleIds.includes(moduleId) &&
    ["view", "edit"].includes(permissions.moduleAccess?.[moduleId]),
  );
}

function filterStateForPermissions(savedState, permissions) {
  if (!savedState || typeof savedState !== "object") return savedState;
  const nextState = { ...savedState };
  const stateFields = {
    documentos: "documents",
    auditorias: "audits",
    "nao-conformidades": "ncs",
    equipamentos: "equipment",
  };
  Object.entries(stateFields).forEach(([moduleId, field]) => {
    if (!canViewModule(permissions, moduleId)) delete nextState[field];
  });
  return nextState;
}

async function removeCompanyUserSettings(companyId, userId) {
  const settings = (await getCompanyData(companyId, "userSettings")) || {};
  delete settings[userId];
  await setCompanyData(companyId, "userSettings", settings);
}

async function buildCompanyReport(companyId) {
  const [company, users, dataRows] = await Promise.all([
    getCompany(companyId),
    listUsersWithCompanySettings(companyId),
    listCompanyData(companyId),
  ]);
  const modules = Object.fromEntries(dataRows.map((row) => [row.key, row.value]));
  return {
    generatedAt: new Date().toISOString(),
    company,
    users: users.map((user) => ({
      id: user.id,
      nome: user.displayName,
      login: user.username,
      perfil: user.role,
      departamento: user.department || "",
      status: user.status,
      ultimoAcesso: user.lastLoginAt,
      criadoEm: user.created_at,
    })),
    modules,
  };
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
      <a class="login-link" href="/forgot-password">Esqueci minha senha</a>
      <p class="hint">Acesso restrito a usuários autorizados.</p>
    </section>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function passwordPage({ mode, token = "", message = "", error = "" } = {}) {
  const isReset = mode === "reset";
  const isComplete = mode === "complete";
  const title = isComplete ? "Senha atualizada" : isReset ? "Crie uma nova senha" : "Recupere seu acesso";
  const intro = isComplete
    ? "Sua senha foi redefinida e todas as sessões anteriores foram encerradas."
    : isReset
    ? "Informe uma nova senha com pelo menos 8 caracteres. O link só pode ser usado uma vez."
    : "Digite seu login ou e-mail. Se a conta existir, enviaremos as instruções ou registraremos a solicitação para o administrador.";
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#050b16" />
  <title>${escapeHtml(title)} - QualityPro Cloud</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/login.css" />
</head>
<body>
  <main class="login-page">
    <section class="login-card">
      <img class="login-logo" src="/assets/qualitypro-cloud-logo-transparent.png" alt="QualityPro Cloud" />
      <p class="kicker">Acesso seguro</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="intro">${escapeHtml(intro)}</p>
      ${message ? `<p class="login-message">${escapeHtml(message)}</p>` : ""}
      ${error ? `<p class="login-error">${escapeHtml(error)}</p>` : ""}
      ${isComplete ? "" : isReset ? `
        <form method="post" action="/reset-password" class="login-form">
          <input name="token" type="hidden" value="${escapeHtml(token)}" />
          <label><span>Nova senha</span><input name="password" type="password" autocomplete="new-password" minlength="8" required /></label>
          <label><span>Confirmar senha</span><input name="passwordConfirmation" type="password" autocomplete="new-password" minlength="8" required /></label>
          <button type="submit">Redefinir senha</button>
        </form>
      ` : `
        <form method="post" action="/forgot-password" class="login-form">
          <label><span>Login / e-mail</span><input name="username" type="text" autocomplete="username" required autofocus /></label>
          <button type="submit">Solicitar recuperação</button>
        </form>
      `}
      <a class="login-link" href="/login">Voltar para o login</a>
    </section>
  </main>
</body>
</html>`;
}

function resetLinkForRequest(req, token) {
  const fallbackProtocol = req.socket?.encrypted ? "https" : "http";
  const forwardedProtocol = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const origin = publicAppUrl || `${forwardedProtocol || fallbackProtocol}://${req.headers.host}`;
  return `${origin}/reset-password?token=${encodeURIComponent(token)}`;
}

async function sendPasswordResetEmail(username, link) {
  const apiKey = process.env.RESEND_API_KEY || "";
  const from = process.env.PASSWORD_RESET_FROM || "";
  if (!publicAppUrl || !apiKey || !from || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
    return "admin_required";
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [username],
      subject: "Redefinição de senha - QualityPro Cloud",
      html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${escapeHtml(link)}">Criar nova senha</a></p><p>Este link expira em 30 minutos e só pode ser usado uma vez.</p>`,
    }),
  });
  return response.ok ? "sent" : "delivery_failed";
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
  const rawSession = readSession(req);
  const session = await validateSession(rawSession);

  if (url.pathname.startsWith("/api/")) {
    await handleApiRequest(req, res, url, session);
    return;
  }

  if (url.pathname === "/forgot-password" && req.method === "GET") {
    send(res, 200, passwordPage({ mode: "forgot" }), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (url.pathname === "/forgot-password" && req.method === "POST") {
    const body = querystring.parse(await readBody(req));
    const username = String(body.username || "").trim();
    const ipAddress = requestIp(req);
    const recentRequests = await countRecentPasswordResetRequests(username, ipAddress, 15);
    if (recentRequests >= 3) {
      await auditRequest(req, null, "password_reset_rate_limited", "blocked", { username });
      send(res, 429, passwordPage({
        mode: "forgot",
        error: "Muitas solicitações. Aguarde 15 minutos antes de tentar novamente.",
      }), {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "900",
      });
      return;
    }

    const reset = await createPasswordResetToken(username, 30);
    let delivery = "account_not_found";
    if (reset) {
      try {
        delivery = await sendPasswordResetEmail(reset.user.username, resetLinkForRequest(req, reset.token));
      } catch (error) {
        console.error("Falha ao enviar recuperação de senha:", error);
        delivery = "delivery_failed";
      }
    }
    await auditRequest(req, reset?.user || null, "password_reset_requested", "success", {
      username,
      delivery,
    });
    send(res, 200, passwordPage({
      mode: "forgot",
      message: "Se a conta estiver ativa, as instruções serão enviadas ao e-mail cadastrado ou a solicitação ficará disponível para o administrador.",
    }), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (url.pathname === "/reset-password" && req.method === "GET") {
    const token = String(url.searchParams.get("token") || "");
    send(res, token ? 200 : 400, passwordPage({
      mode: "reset",
      token,
      error: token ? "" : "Link de recuperação inválido.",
    }), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (url.pathname === "/reset-password" && req.method === "POST") {
    const body = querystring.parse(await readBody(req));
    const token = String(body.token || "");
    const password = String(body.password || "");
    const confirmation = String(body.passwordConfirmation || "");
    if (password.length < 8 || password !== confirmation) {
      send(res, 400, passwordPage({
        mode: "reset",
        token,
        error: password.length < 8
          ? "A senha deve ter pelo menos 8 caracteres."
          : "As senhas informadas não coincidem.",
      }), { "Content-Type": "text/html; charset=utf-8" });
      return;
    }

    const user = await consumePasswordResetToken(token, password);
    if (!user) {
      await auditRequest(req, null, "password_reset_failed", "failed");
      send(res, 400, passwordPage({
        mode: "reset",
        token: "",
        error: "Este link é inválido, já foi utilizado ou expirou.",
      }), { "Content-Type": "text/html; charset=utf-8" });
      return;
    }
    await auditRequest(req, user, "password_reset_completed", "success");
    send(res, 200, passwordPage({ mode: "complete", message: "Acesse o sistema com sua nova senha." }), {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": sessionCookie(req, "", 0),
    });
    return;
  }

  if (url.pathname === "/login" && req.method === "GET") {
    send(res, 200, loginPage(), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (url.pathname === "/login" && req.method === "POST") {
    const body = querystring.parse(await readBody(req));
    const username = String(body.username || "").trim();
    const ipAddress = requestIp(req);
    const recentFailures = await countRecentFailedLogins(username, ipAddress, 15);

    if (recentFailures >= 5) {
      await auditRequest(req, null, "login_rate_limited", "blocked", { username });
      send(res, 429, loginPage("Muitas tentativas. Aguarde 15 minutos e tente novamente."), {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "900",
      });
      return;
    }

    const validLogin = await findValidLogin(username, body.password);

    if (!validLogin) {
      await auditRequest(req, null, "login_failed", "failed", { username });
      send(res, 401, loginPage("Usuário ou senha inválidos."), {
        "Content-Type": "text/html; charset=utf-8",
      });
      return;
    }

    await auditRequest(req, validLogin, "login_success", "success");

    send(res, 302, "", {
      Location: "/app",
      "Set-Cookie": sessionCookie(
        req,
        createSession(validLogin),
        Math.round(sessionTtlHours * 60 * 60),
      ),
    });
    return;
  }

  if (url.pathname === "/logout" && req.method === "POST") {
    if (session) await auditRequest(req, session, "logout", "success");
    send(res, 302, "", {
      Location: "/login",
      "Set-Cookie": sessionCookie(req, "", 0),
    });
    return;
  }

  if (url.pathname === "/" || url.pathname === "/app") {
    if (!session) {
      send(res, 302, "", { Location: "/login", "Set-Cookie": sessionCookie(req, "", 0) });
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
    send(res, 302, "", { Location: "/login", "Set-Cookie": sessionCookie(req, "", 0) });
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

  if (url.pathname === "/api/export" && req.method === "GET") {
    const permissions = await getSessionPermissions(session);
    if (!permissions.reports) {
      sendJson(res, 403, { error: "reports_forbidden" });
      return;
    }
    const format = String(url.searchParams.get("format") || "pdf").toLowerCase();
    const report = await buildCompanyReport(companyId);
    const companyName = safeFilename(report.company?.name);
    const date = new Date().toISOString().slice(0, 10);

    if (format === "xlsx") {
      const buffer = await createExcelReport(report);
      await auditRequest(req, session, "company_export", "success", { format });
      sendDownload(
        res,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `relatorio-sgq-${companyName}-${date}.xlsx`,
        buffer,
      );
      return;
    }

    if (format === "json") {
      const backup = await getBackupSnapshot(companyId);
      const buffer = Buffer.from(JSON.stringify(backup, null, 2), "utf8");
      await auditRequest(req, session, "company_backup", "success", { format });
      sendDownload(res, "application/json; charset=utf-8", `backup-${companyName}-${date}.json`, buffer);
      return;
    }

    if (format !== "pdf") {
      sendJson(res, 400, { error: "invalid_format" });
      return;
    }

    const buffer = await createPdfReport(report);
    await auditRequest(req, session, "company_export", "success", { format });
    sendDownload(res, "application/pdf", `relatorio-sgq-${companyName}-${date}.pdf`, buffer);
    return;
  }

  if (url.pathname === "/api/admin/backup" && req.method === "GET") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    const requestedCompanyId = Number(url.searchParams.get("companyId")) || null;
    const backup = await getBackupSnapshot(requestedCompanyId);
    const buffer = Buffer.from(JSON.stringify(backup, null, 2), "utf8");
    await auditRequest(req, session, "admin_backup", "success", {
      scope: requestedCompanyId ? "company" : "database",
      companyId: requestedCompanyId,
    });
    const scope = requestedCompanyId ? `empresa-${requestedCompanyId}` : "banco-completo";
    sendDownload(
      res,
      "application/json; charset=utf-8",
      `backup-sgq-${scope}-${new Date().toISOString().slice(0, 10)}.json`,
      buffer,
    );
    return;
  }

  if (url.pathname === "/api/bootstrap" && req.method === "GET") {
    const savedState = await getCompanyData(companyId, "state");
    const savedContext = await getCompanyData(companyId, "context");
    const savedRisk = await getCompanyData(companyId, "risk");
    const savedLeadership = await getCompanyData(companyId, "leadership");
    let company = await getCompany(companyId);
    const canManageCompany = await isCompanyOwnerSession(session);
    const permissions = await getSessionPermissions(session, canManageCompany);

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
        canManageCompany,
        permissions,
      },
      company,
      needsOnboarding: !savedState && canManageCompany,
      state: filterStateForPermissions(savedState, permissions),
      context: canViewModule(permissions, "contexto") ? savedContext : null,
      risk: canViewModule(permissions, "riscos") ? savedRisk : null,
      leadership: canViewModule(permissions, "lideranca") ? savedLeadership : null,
    });
    return;
  }

  if (url.pathname === "/api/onboarding" && req.method === "POST") {
    if (!(await isCompanyOwnerSession(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

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

    await auditRequest(req, session, "onboarding_completed", "success");

    sendJson(res, 200, { ok: true, user, company });
    return;
  }

  if (url.pathname === "/api/company" && req.method === "PATCH") {
    if (!(await isCompanyOwnerSession(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

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
      billingStatus: body.billingStatus,
      accessLimit: body.accessLimit,
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

    await auditRequest(req, session, "company_updated", "success", { companyId });

    sendJson(res, 200, { ok: true, company, state: nextState });
    return;
  }

  if (url.pathname === "/api/company/users" && req.method === "GET") {
    const users = await listUsersWithCompanySettings(companyId);
    const canManageUsers = await canManageCompanyUsers(session);
    sendJson(res, 200, {
      users: canManageUsers
        ? users
        : users.filter((user) => Number(user.id) === Number(session.userId)),
    });
    return;
  }

  if (url.pathname === "/api/company/users" && req.method === "POST") {
    const ownsCompany = await isCompanyOwnerSession(session);
    if (!(await canManageCompanyUsers(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    if (!body?.username || !body?.displayName || !body?.password) {
      sendJson(res, 400, { error: "invalid_user" });
      return;
    }
    if (!ownsCompany && (String(body.role).toLowerCase() === "administrador" || body.permissions?.manageUsers)) {
      sendJson(res, 403, { error: "cannot_grant_admin" });
      return;
    }

    if (!(await canAddCompanyUser(companyId))) {
      sendJson(res, 409, { error: "access_limit_reached" });
      return;
    }

    try {
      const user = await createUser({
        companyId,
        username: body.username,
        displayName: body.displayName,
        role: body.role || "Colaborador",
        status: body.status || "Pendente",
        password: body.password,
      });
      if (!user) {
        sendJson(res, 400, { error: "invalid_user" });
        return;
      }
      await saveCompanyUserSettings(companyId, user.id, body);
      await auditRequest(req, session, "company_user_created", "success", {
        targetUserId: user.id,
        targetUsername: user.username,
      });
      sendJson(res, 201, {
        ok: true,
        user: {
          ...user,
          department: body.department || "",
          permissions: body.permissions || {},
        },
      });
    } catch (error) {
      sendJson(res, isUniqueError(error) ? 409 : 500, {
        error: isUniqueError(error) ? "user_exists" : "user_create_failed",
      });
    }
    return;
  }

  if (url.pathname === "/api/company/users" && req.method === "PATCH") {
    const ownsCompany = await isCompanyOwnerSession(session);
    if (!(await canManageCompanyUsers(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    const targetUserId = Number(body?.userId);
    if (!targetUserId || !body?.username || !body?.displayName) {
      sendJson(res, 400, { error: "invalid_user" });
      return;
    }
    if (!ownsCompany) {
      const target = (await listCompanyUsers(companyId)).find((user) => Number(user.id) === targetUserId);
      if (target && (await isCompanyOwnerUser(companyId, target.id, target.role))) {
        sendJson(res, 403, { error: "cannot_edit_company_owner" });
        return;
      }
    }
    if (!ownsCompany && (String(body.role).toLowerCase() === "administrador" || body.permissions?.manageUsers)) {
      sendJson(res, 403, { error: "cannot_grant_admin" });
      return;
    }

    if (targetUserId === Number(session.userId) && body.status === "Bloqueado") {
      sendJson(res, 400, { error: "cannot_block_self" });
      return;
    }

    try {
      const user = await updateCompanyUser(companyId, targetUserId, body);
      if (!user) {
        sendJson(res, 404, { error: "user_not_found" });
        return;
      }
      if (body.password) await resetUserPassword(targetUserId, body.password);
      await saveCompanyUserSettings(companyId, user.id, body);
      await auditRequest(req, session, "company_user_updated", "success", {
        targetUserId: user.id,
        targetUsername: user.username,
        status: user.status,
      });
      sendJson(res, 200, {
        ok: true,
        user: {
          ...user,
          department: body.department || "",
          permissions: body.permissions || {},
        },
      });
    } catch (error) {
      sendJson(res, isUniqueError(error) ? 409 : 500, {
        error: isUniqueError(error) ? "user_exists" : "user_update_failed",
      });
    }
    return;
  }

  if (url.pathname === "/api/company/users" && req.method === "DELETE") {
    const ownsCompany = await isCompanyOwnerSession(session);
    if (!(await canManageCompanyUsers(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    const targetUserId = Number(body?.userId);
    if (!targetUserId) {
      sendJson(res, 400, { error: "invalid_user" });
      return;
    }
    if (!ownsCompany) {
      const target = (await listCompanyUsers(companyId)).find((user) => Number(user.id) === targetUserId);
      if (target && (await isCompanyOwnerUser(companyId, target.id, target.role))) {
        sendJson(res, 403, { error: "cannot_delete_company_owner" });
        return;
      }
    }
    if (targetUserId === Number(session.userId)) {
      sendJson(res, 400, { error: "cannot_delete_self" });
      return;
    }

    const user = await deleteCompanyUser(companyId, targetUserId);
    if (!user) {
      sendJson(res, 404, { error: "user_not_found" });
      return;
    }
    await removeCompanyUserSettings(companyId, targetUserId);
    await auditRequest(req, session, "company_user_deleted", "success", {
      targetUserId,
      targetUsername: user.username,
    });
    sendJson(res, 200, { ok: true, user });
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
      await auditRequest(req, session, "admin_company_created", "success", {
        targetCompanyId: company.id,
        companyName: company.name,
      });
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
      await auditRequest(req, session, "admin_company_updated", "success", {
        targetCompanyId,
        companyName: company.name,
        billingStatus: company.billingStatus,
        accessLimit: company.accessLimit,
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

    if (!(await canAddCompanyUser(body.companyId))) {
      sendJson(res, 409, { error: "access_limit_reached" });
      return;
    }

    try {
      const user = await createUser(body);
      if (!user) {
        sendJson(res, 400, { error: "invalid_user" });
        return;
      }
      await auditRequest(req, session, "admin_user_created", "success", {
        targetUserId: user.id,
        targetUsername: user.username,
        targetCompanyId: user.companyId,
      });
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

    if (!(await canAddCompanyUser(body.companyId, targetUserId))) {
      sendJson(res, 409, { error: "access_limit_reached" });
      return;
    }

    try {
      const user = await updateAdminUser(targetUserId, body);
      if (!user) {
        sendJson(res, 404, { error: "user_not_found" });
        return;
      }
      await auditRequest(req, session, "admin_user_updated", "success", {
        targetUserId: user.id,
        targetUsername: user.username,
        targetCompanyId: user.companyId,
        status: user.status,
      });
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

    await auditRequest(req, session, "admin_password_reset", "success", {
      targetUserId: user.id,
      targetUsername: user.username,
    });

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

    const permissions = await getSessionPermissions(session);
    const keyModules = { context: "contexto", risk: "riscos", leadership: "lideranca" };
    const requestedModule = keyModules[body.key] || String(body.moduleId || "");
    const ownsCompany = await isCompanyOwnerSession(session);
    if (!ownsCompany && !canEditModule(permissions, requestedModule)) {
      sendJson(res, 403, { error: "module_edit_forbidden", moduleId: requestedModule });
      return;
    }

    if (body.key === "state" && !ownsCompany) {
      const stateFields = {
        documentos: "documents",
        auditorias: "audits",
        "nao-conformidades": "ncs",
        equipamentos: "equipment",
      };
      const field = stateFields[requestedModule];
      if (!field || !body.value || typeof body.value !== "object") {
        sendJson(res, 403, { error: "state_edit_forbidden" });
        return;
      }
      const currentState = (await getCompanyData(companyId, "state")) || {};
      body.value = { ...currentState, [field]: body.value[field] };
    }

    await setCompanyData(companyId, body.key, body.value);
    await auditRequest(req, session, "module_data_updated", "success", {
      dataKey: body.key,
      moduleId: requestedModule || null,
    });
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
