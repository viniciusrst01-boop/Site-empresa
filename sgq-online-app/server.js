const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const querystring = require("querystring");
const QRCode = require("qrcode");

loadLocalEnv();

const {
  canAddCompanyUser,
  checkDatabaseHealth,
  consumeInvitationToken,
  consumeMfaRecoveryCode,
  consumePasswordResetToken,
  countRecentFailedLogins,
  countRecentMfaFailures,
  countRecentPasswordResetRequests,
  createCompany,
  createBackupSnapshot,
  createInvitationToken,
  createPasswordResetToken,
  createUser,
  deleteCompanyUser,
  deleteBackupSnapshotRecord,
  ensureInitialized,
  findUser,
  findCompanyByBillingIdentifiers,
  getBackupSnapshot,
  getRecoveryBackupSnapshot,
  getCompany,
  getCompanyData,
  getInvitationByToken,
  getUser,
  getUserSecurity,
  hasRecentCompanyEvent,
  listCompanyData,
  listBackupSnapshots,
  listBillingEvents,
  listCompanyUsers,
  listAdminOverview,
  listNotificationTargets,
  listUserSessions,
  listSystemEvents,
  recordBillingEvent,
  recordSystemEvent,
  recordAuditLog,
  registerUserSession,
  resetUserPassword,
  revokeOtherUserSessions,
  revokeUserSession,
  setCompanyData,
  setUserMfa,
  syncConfiguredUsers,
  testRecoveryRestore,
  updateAdminCompany,
  updateBackupSnapshot,
  updateCompanyBilling,
  updateAdminUser,
  updateCompanyUser,
  updateCompany,
  updateUserProfile,
  validateSessionUser,
  validateUserSession,
  verifyUserPassword,
} = require("./db");
const { createExcelReport, createPdfReport } = require("./exporters");
const {
  changeSubscriptionPlan,
  constructWebhookEvent,
  createCheckout,
  createPortal,
  isBillingConfigured,
  listInvoices,
  planCatalog,
  subscriptionBillingData,
} = require("./billing");
const {
  backupStorageMode,
  deleteBackupArtifact,
  retentionCutoff,
  verifyBackupArtifact,
  writeBackupArtifact,
} = require("./backup");
const {
  createMfaSetup,
  decryptValue,
  encryptValue,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyTotp,
} = require("./security");
const {
  deadlineAlertEmail,
  invitationEmail,
  isEmail,
  operationalAlertEmail,
  passwordResetEmail,
  sendEmail,
} = require("./mailer");

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

async function createSession(user, req) {
  const session = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    companyId: user.companyId,
    sessionVersion: Number(user.sessionVersion || 1),
    sessionId: crypto.randomBytes(16).toString("base64url"),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * sessionTtlHours,
  };
  await registerUserSession({
    sessionId: session.sessionId,
    userId: session.userId,
    companyId: session.companyId,
    ipAddress: requestIp(req),
    userAgent: requestUserAgent(req),
    expiresAt: session.expiresAt,
  });
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
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
  const [user, activeSession, company] = await Promise.all([
    validateSessionUser(session.userId, session.companyId, session.sessionVersion),
    validateUserSession(session.sessionId, session.userId, session.companyId),
    getCompany(session.companyId),
  ]);
  if (!user || !activeSession || !company || !billingAllowsAccess(company, session)) return null;
  return {
    ...session,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    companyId: user.companyId,
  };
}

function createMfaChallenge(user) {
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    companyId: user.companyId,
    sessionVersion: Number(user.sessionVersion || 1),
    expiresAt: Date.now() + 5 * 60 * 1000,
  })).toString("base64url");
  return `${payload}.${sign(`mfa:${payload}`)}`;
}

function readMfaChallenge(req) {
  const token = parseCookies(req.headers.cookie).sgq_mfa_challenge;
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = Buffer.from(sign(`mfa:${payload}`));
  const received = Buffer.from(signature || "");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
  try {
    const challenge = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return challenge.expiresAt > Date.now() ? challenge : null;
  } catch {
    return null;
  }
}

function csrfTokenForSession(session) {
  return session?.sessionId ? sign(`csrf:${session.sessionId}`) : "";
}

function isValidCsrf(req, session) {
  const token = String(req.headers["x-csrf-token"] || "");
  const expectedValue = csrfTokenForSession(session);
  const expected = Buffer.from(expectedValue);
  const received = Buffer.from(token);
  return Boolean(
    token &&
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
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

function mfaChallengeCookie(req, token, maxAgeSeconds) {
  const isSecure =
    Boolean(process.env.VERCEL) || String(req.headers["x-forwarded-proto"] || "").toLowerCase() === "https";
  const secure = isSecure ? "; Secure" : "";
  return `sgq_mfa_challenge=${token ? encodeURIComponent(token) : ""}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
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
  if (!canViewModule(permissions, "nao-conformidades")) delete nextState.ncCatalogs;
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

function readRawBody(req, maxBytes = 2_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("request_body_too_large"));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readBody(req) {
  return (await readRawBody(req, 100_000)).toString("utf8");
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

function invitationPage({ token = "", invitation = null, complete = false, error = "" } = {}) {
  const title = complete ? "Acesso ativado" : "Crie seu acesso";
  const intro = complete
    ? "Seu convite foi confirmado. Entre usando o e-mail e a senha que você acabou de criar."
    : invitation
      ? `${invitation.user.displayName}, você foi convidado para acessar os dados de ${invitation.companyName}.`
      : "Confirme o convite recebido por e-mail.";
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
      <p class="kicker">Primeiro acesso</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="intro">${escapeHtml(intro)}</p>
      ${error ? `<p class="login-error">${escapeHtml(error)}</p>` : ""}
      ${complete || !invitation ? "" : `
        <form method="post" action="/accept-invite" class="login-form">
          <input name="token" type="hidden" value="${escapeHtml(token)}" />
          <label><span>E-mail</span><input type="email" value="${escapeHtml(invitation.user.username)}" disabled /></label>
          <label><span>Nova senha</span><input name="password" type="password" minlength="8" autocomplete="new-password" required /></label>
          <label><span>Confirmar senha</span><input name="passwordConfirmation" type="password" minlength="8" autocomplete="new-password" required /></label>
          <button type="submit">Ativar meu acesso</button>
        </form>
      `}
      <a class="login-link" href="/login">Ir para o login</a>
    </section>
  </main>
</body>
</html>`;
}

function mfaPage(error = "") {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#050b16" />
  <title>Verificação em duas etapas - QualityPro Cloud</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/login.css" />
</head>
<body>
  <main class="login-page">
    <section class="login-card">
      <img class="login-logo" src="/assets/qualitypro-cloud-logo-transparent.png" alt="QualityPro Cloud" />
      <p class="kicker">Acesso protegido</p>
      <h1>Verificação em duas etapas</h1>
      <p class="intro">Digite o código de seis números do aplicativo autenticador ou um código de recuperação.</p>
      ${error ? `<p class="login-error">${escapeHtml(error)}</p>` : ""}
      <form method="post" action="/mfa" class="login-form">
        <label><span>Código de verificação</span><input name="code" type="text" inputmode="numeric" autocomplete="one-time-code" required autofocus /></label>
        <button type="submit">Confirmar acesso</button>
      </form>
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
  if (!publicAppUrl || !isEmail(username)) return "admin_required";
  const result = await sendEmail({
    to: username,
    subject: "Redefinição de senha - QualityPro Cloud",
    html: passwordResetEmail(link),
    tag: "password_reset",
  });
  return result.status === "sent" ? "sent" : result.status === "not_configured" ? "admin_required" : "delivery_failed";
}

function invitationLinkForRequest(req, token) {
  const fallbackProtocol = req.socket?.encrypted ? "https" : "http";
  const forwardedProtocol = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const origin = publicAppUrl || `${forwardedProtocol || fallbackProtocol}://${req.headers.host}`;
  return `${origin}/accept-invite?token=${encodeURIComponent(token)}`;
}

async function sendUserInvitation(req, user, companyName, inviterName) {
  const invitation = await createInvitationToken(user.id, 48);
  if (!invitation) return { delivery: "token_failed" };
  const link = invitationLinkForRequest(req, invitation.token);
  const result = await sendEmail({
    to: user.username,
    subject: `Convite para o SGQ Online - ${companyName}`,
    html: invitationEmail({
      name: user.displayName,
      companyName,
      inviterName,
      link,
    }),
    tag: "user_invitation",
    idempotencyKey: `invite-${user.id}-${Date.now()}`,
  });
  return {
    delivery: result.status,
    expiresAt: invitation.expiresAt,
    ...(process.env.SGQ_EXPOSE_TEST_TOKENS === "true" ? { invitationLink: link } : {}),
  };
}

async function verifyMfaInput(userId, code) {
  const security = await getUserSecurity(userId);
  if (!security?.enabled || !security.secret) return false;
  const secret = decryptValue(security.secret, sessionSecret);
  if (verifyTotp(secret, code)) return true;
  return consumeMfaRecoveryCode(userId, hashRecoveryCode(code));
}

async function requireCurrentPassword(res, session, body) {
  if (await verifyUserPassword(session.userId, body?.currentPassword)) return true;
  sendJson(res, 403, { error: "password_confirmation_required" });
  return false;
}

function sessionDeviceLabel(userAgent) {
  const value = String(userAgent || "");
  const browser = /Edg\//.test(value)
    ? "Microsoft Edge"
    : /Chrome\//.test(value)
      ? "Google Chrome"
      : /Firefox\//.test(value)
        ? "Firefox"
        : /Safari\//.test(value)
          ? "Safari"
          : "Navegador";
  const system = /Windows/.test(value)
    ? "Windows"
    : /Android/.test(value)
      ? "Android"
      : /iPhone|iPad/.test(value)
        ? "iOS"
        : /Mac OS/.test(value)
          ? "macOS"
          : "Dispositivo";
  return `${browser} em ${system}`;
}

function parseDeadline(value) {
  const text = String(value || "").trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const brazil = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00Z`);
  if (brazil) return new Date(`${brazil[3]}-${brazil[2]}-${brazil[1]}T12:00:00Z`);
  return null;
}

function collectDeadlineAlerts(data) {
  const alerts = [];
  const seen = new Set();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const closed = /conclu|finaliz|encerr|cancel|aprovad|realizad|inativ/i;
  const pending = /pendent|andamento|tratamento|programad|planejad|atrasad|venc/i;
  const dateFields = ["prazo", "dataPrevista", "prazoRevisao", "vencimento", "validade", "proximaCalibracao", "dataProxima"];

  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const status = String(value.status || value.situacao || value.statusAprovacao || "");
    if (!closed.test(status)) {
      const dateValue = dateFields.map((field) => value[field]).find(Boolean);
      const deadline = parseDeadline(dateValue);
      const identifier = value.id || value.codigo || value.titulo || value.objetivo || value.descricao || value.mudanca || value.nome;
      if (identifier && deadline && deadline <= limit) {
        const days = Math.ceil((deadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        const detail = days < 0 ? `atrasado há ${Math.abs(days)} dia(s)` : days === 0 ? "vence hoje" : `vence em ${days} dia(s)`;
        const key = `${identifier}:${dateValue}`;
        if (!seen.has(key)) {
          seen.add(key);
          alerts.push({ label: String(identifier).slice(0, 140), detail });
        }
      } else if (identifier && pending.test(status) && !dateValue) {
        const key = `${identifier}:${status}`;
        if (!seen.has(key)) {
          seen.add(key);
          alerts.push({ label: String(identifier).slice(0, 140), detail: status || "Pendente" });
        }
      }
    }
    Object.values(value).forEach(visit);
  }

  visit(data);
  return alerts.slice(0, 50);
}

async function runDeadlineAlerts(req) {
  const targets = await listNotificationTargets();
  const summary = { companies: 0, recipients: 0, sent: 0, failed: 0 };
  for (const target of targets) {
    if (target.data.state?.settings?.emailAlerts === false) continue;
    if (await hasRecentCompanyEvent(target.company.id, "deadline_alert_sent", 20)) continue;
    const items = collectDeadlineAlerts(target.data);
    if (!items.length) continue;
    summary.companies += 1;
    for (const user of target.users) {
      summary.recipients += 1;
      const result = await sendEmail({
        to: user.username,
        subject: `${items.length} pendência(s) no SGQ - ${target.company.name}`,
        html: deadlineAlertEmail({ companyName: target.company.name, items }),
        tag: "deadline_alert",
        idempotencyKey: `deadline-${target.company.id}-${user.id}-${new Date().toISOString().slice(0, 10)}`,
      });
      if (result.status === "sent") summary.sent += 1;
      else summary.failed += 1;
    }
    await recordAuditLog({
      companyId: target.company.id,
      eventType: "deadline_alert_sent",
      outcome: summary.sent ? "success" : "failed",
      ipAddress: requestIp(req),
      userAgent: requestUserAgent(req),
      metadata: { items: items.length, recipients: target.users.length },
    });
  }
  if (summary.failed > 0) {
    await reportOperationalFailure({
      severity: "warning",
      component: "email",
      eventType: "deadline_email_delivery_failed",
      title: "Falha no envio de alertas de prazo",
      message: `${summary.failed} de ${summary.recipients} mensagem(ns) não foram entregues.`,
      metadata: summary,
    });
  }
  return summary;
}

function billingAllowsAccess(company, sessionOrUser = null) {
  if (isAdminSession(sessionOrUser)) return true;
  return !["Inadimplente", "Cancelado"].includes(String(company?.billingStatus || "Ativo"));
}

async function sendOperationalAlert({ title, component, message }) {
  const alertEmail = process.env.ALERT_EMAIL || (isEmail(adminUser) ? adminUser : "");
  if (!alertEmail) return { status: "not_configured" };
  return sendEmail({
    to: alertEmail,
    subject: `[SGQ Online] ${title}`,
    html: operationalAlertEmail({ title, component, message, occurredAt: new Date().toISOString() }),
    tag: "operational_alert",
    idempotencyKey: `ops-${component}-${new Date().toISOString().slice(0, 13)}`,
  });
}

async function reportOperationalFailure({ severity = "error", component, eventType, title, message, metadata = {} }) {
  const event = await recordSystemEvent({ severity, component, eventType, message, metadata }).catch(() => null);
  const delivery = await sendOperationalAlert({ title, component, message }).catch((error) => ({
    status: "failed",
    error: error.message,
  }));
  if (delivery.status !== "sent") {
    console.error(`Alerta operacional não entregue (${component}): ${delivery.status || "failed"}`);
  }
  return { event, delivery };
}

async function runAutomaticBackup(req = null) {
  let record = null;
  try {
    const snapshot = await getRecoveryBackupSnapshot();
    const artifact = await writeBackupArtifact(snapshot);
    record = await createBackupSnapshot({
      ...artifact,
      status: "completed",
      verificationStatus: "pending",
      metadata: { ...artifact.metadata, source: "automatic" },
    });
    const verification = await verifyBackupArtifact(record, { restoreTest: testRecoveryRestore });
    record = await updateBackupSnapshot(record.id, {
      verificationStatus: "verified",
      errorMessage: "",
      metadata: { ...record.metadata, counts: verification.counts, restoreTest: verification.restoreTest },
    });

    const cutoff = retentionCutoff();
    let removed = 0;
    const snapshots = await listBackupSnapshots(200);
    for (const oldSnapshot of snapshots) {
      if (Number(oldSnapshot.id) === Number(record.id)) continue;
      if (new Date(oldSnapshot.createdAt).getTime() >= cutoff) continue;
      try {
        if (oldSnapshot.status === "completed") await deleteBackupArtifact(oldSnapshot);
      } finally {
        await deleteBackupSnapshotRecord(oldSnapshot.id);
        removed += 1;
      }
    }

    await recordAuditLog({
      eventType: "automatic_backup_completed",
      outcome: "success",
      ipAddress: req ? requestIp(req) : "",
      userAgent: req ? requestUserAgent(req) : "",
      metadata: { snapshotId: record.id, checksum: record.checksum, removed },
    });
    return { ok: true, snapshot: record, removed };
  } catch (error) {
    if (record) {
      await updateBackupSnapshot(record.id, {
        status: "failed",
        verificationStatus: "failed",
        errorMessage: error.message,
      }).catch(() => null);
    } else {
      await createBackupSnapshot({
        storageKey: "",
        status: "failed",
        verificationStatus: "failed",
        errorMessage: error.message,
        metadata: { source: "automatic" },
      }).catch(() => null);
    }
    await reportOperationalFailure({
      severity: "critical",
      component: "backup",
      eventType: "automatic_backup_failed",
      title: "Falha no backup automático",
      message: error.message,
    }).catch(() => null);
    throw error;
  }
}

async function verifyStoredBackup(snapshotId) {
  const record = (await listBackupSnapshots(200)).find((item) => Number(item.id) === Number(snapshotId));
  if (!record || record.status !== "completed") throw new Error("backup_not_found");
  try {
    const verification = await verifyBackupArtifact(record, { restoreTest: testRecoveryRestore });
    const updated = await updateBackupSnapshot(record.id, {
      verificationStatus: "verified",
      errorMessage: "",
      metadata: {
        ...record.metadata,
        counts: verification.counts,
        restoreTest: verification.restoreTest,
        manuallyVerified: true,
      },
    });
    return { snapshot: updated, ...verification };
  } catch (error) {
    await updateBackupSnapshot(record.id, {
      verificationStatus: "failed",
      errorMessage: error.message,
    });
    await reportOperationalFailure({
      severity: "critical",
      component: "backup",
      eventType: "backup_verification_failed",
      title: "Falha no teste de restauração",
      message: error.message,
      metadata: { snapshotId: record.id },
    });
    throw error;
  }
}

async function getOperationalHealth() {
  let database;
  try {
    database = await checkDatabaseHealth();
  } catch (error) {
    database = { ok: false, latencyMs: null, mode: "unavailable", error: error.message };
  }
  const backups = await listBackupSnapshots(1).catch(() => []);
  const latestBackup = backups[0] || null;
  const backupFresh = Boolean(
    latestBackup?.status === "completed" &&
      latestBackup?.verificationStatus === "verified" &&
      Date.now() - new Date(latestBackup.createdAt).getTime() < 36 * 60 * 60 * 1000,
  );
  const services = {
    database,
    billing: { ok: isBillingConfigured(), configured: isBillingConfigured() },
    backup: {
      ok: backupStorageMode() !== "unavailable" && (!latestBackup || backupFresh),
      mode: backupStorageMode(),
      latest: latestBackup,
    },
    email: {
      ok: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
      operationalAlertsConfigured: Boolean(process.env.ALERT_EMAIL || isEmail(adminUser)),
    },
  };
  const productionRequired = Boolean(process.env.VERCEL);
  const ok = database.ok && (!productionRequired || (services.billing.ok && services.backup.ok));
  return { ok, checkedAt: new Date().toISOString(), services };
}

async function companyForBillingObject(object) {
  const metadataCompanyId = Number(object?.metadata?.companyId || object?.client_reference_id);
  if (metadataCompanyId) return getCompany(metadataCompanyId);
  const customerId = typeof object?.customer === "string" ? object.customer : object?.customer?.id || "";
  const subscriptionId =
    typeof object?.subscription === "string" ? object.subscription : object?.subscription?.id || object?.id || "";
  return findCompanyByBillingIdentifiers({ customerId, subscriptionId });
}

async function processBillingWebhook(event) {
  const object = event?.data?.object || {};
  const existing = (await listBillingEvents(null, 200)).find(
    (item) => item.stripeEventId === String(event?.id || ""),
  );
  if (existing) return { duplicate: true, company: existing.companyId ? await getCompany(existing.companyId) : null };

  let company = await companyForBillingObject(object);
  const type = String(event?.type || "");
  if (type === "checkout.session.completed") {
    if (!company) throw new Error("billing_company_not_found");
    company = await updateCompanyBilling(company.id, {
      customerId: typeof object.customer === "string" ? object.customer : object.customer?.id,
      subscriptionId:
        typeof object.subscription === "string" ? object.subscription : object.subscription?.id,
      billingStatus: object.payment_status === "paid" ? "Ativo" : "Pendente",
    });
  } else if (type.startsWith("customer.subscription.")) {
    if (!company) throw new Error("billing_company_not_found");
    company = await updateCompanyBilling(company.id, subscriptionBillingData(object));
  } else if (type === "invoice.payment_succeeded" || type === "invoice.paid") {
    if (company) company = await updateCompanyBilling(company.id, { billingStatus: "Ativo" });
  } else if (type === "invoice.payment_failed") {
    if (company) company = await updateCompanyBilling(company.id, { billingStatus: "Inadimplente" });
  }

  const recorded = await recordBillingEvent({
    stripeEventId: event?.id,
    companyId: company?.id,
    eventType: type,
    status: object.status || object.payment_status || "",
    amountTotal: object.amount_paid ?? object.amount_due ?? object.amount_total,
    currency: object.currency,
    invoiceUrl: object.hosted_invoice_url || object.invoice_pdf || "",
    metadata: { livemode: Boolean(event?.livemode), objectId: object.id || "" },
  });
  await recordAuditLog({
    companyId: company?.id || null,
    eventType: "billing_webhook_processed",
    outcome: "success",
    metadata: { stripeEventId: event?.id, type, duplicate: !recorded.created },
  });
  return { duplicate: !recorded.created, company };
}

async function handleRequest(req, res) {
  try {
    await bootstrapDatabase();
  } catch (error) {
    console.error("Falha ao inicializar banco de dados:", error);
    await reportOperationalFailure({
      severity: "critical",
      component: "database",
      eventType: "database_initialization_failed",
      title: "Banco de dados indisponível",
      message: error.message,
    }).catch(() => null);
    sendJson(res, 500, { error: "database_unavailable" });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const rawSession = readSession(req);
  const session = await validateSession(rawSession);

  if (url.pathname === "/api/health" && req.method === "GET") {
    const health = await getOperationalHealth();
    sendJson(res, health.ok ? 200 : 503, { ok: health.ok, checkedAt: health.checkedAt });
    return;
  }

  if (url.pathname === "/api/billing/webhook" && req.method === "POST") {
    try {
      const rawBody = await readRawBody(req);
      const event = constructWebhookEvent(rawBody, req.headers["stripe-signature"] || "");
      const result = await processBillingWebhook(event);
      sendJson(res, 200, { received: true, duplicate: result.duplicate });
    } catch (error) {
      await reportOperationalFailure({
        severity: "error",
        component: "billing",
        eventType: "billing_webhook_failed",
        title: "Falha no webhook de cobrança",
        message: error.message,
      }).catch(() => null);
      sendJson(res, error.message.includes("signature") ? 400 : 500, { error: "billing_webhook_failed" });
    }
    return;
  }

  if (url.pathname === "/api/cron/notifications" && req.method === "GET") {
    const cronSecret = process.env.CRON_SECRET || "";
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      sendJson(res, 401, { error: "invalid_cron_secret" });
      return;
    }
    sendJson(res, 200, { ok: true, ...(await runDeadlineAlerts(req)) });
    return;
  }

  if (url.pathname === "/api/cron/backups" && req.method === "GET") {
    const cronSecret = process.env.CRON_SECRET || "";
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      sendJson(res, 401, { error: "invalid_cron_secret" });
      return;
    }
    try {
      const result = await runAutomaticBackup(req);
      sendJson(res, 200, { ok: true, snapshotId: result.snapshot.id, removed: result.removed });
    } catch {
      sendJson(res, 500, { error: "automatic_backup_failed" });
    }
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    await handleApiRequest(req, res, url, session);
    return;
  }

  if (url.pathname === "/accept-invite" && req.method === "GET") {
    const token = String(url.searchParams.get("token") || "");
    const invitation = token ? await getInvitationByToken(token) : null;
    send(res, invitation ? 200 : 400, invitationPage({
      token,
      invitation,
      error: invitation ? "" : "Este convite é inválido, já foi utilizado ou expirou.",
    }), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (url.pathname === "/accept-invite" && req.method === "POST") {
    const body = querystring.parse(await readBody(req));
    const token = String(body.token || "");
    const password = String(body.password || "");
    const confirmation = String(body.passwordConfirmation || "");
    const invitation = token ? await getInvitationByToken(token) : null;
    if (!invitation || password.length < 8 || password !== confirmation) {
      send(res, 400, invitationPage({
        token,
        invitation,
        error: !invitation
          ? "Este convite é inválido, já foi utilizado ou expirou."
          : password.length < 8
            ? "A senha deve ter pelo menos 8 caracteres."
            : "As senhas informadas não coincidem.",
      }), { "Content-Type": "text/html; charset=utf-8" });
      return;
    }
    const user = await consumeInvitationToken(token, password);
    if (!user) {
      await auditRequest(req, null, "invitation_failed", "failed", { username: invitation.user.username });
      send(res, 400, invitationPage({ error: "Não foi possível ativar este convite." }), {
        "Content-Type": "text/html; charset=utf-8",
      });
      return;
    }
    await auditRequest(req, user, "invitation_accepted", "success");
    send(res, 200, invitationPage({ complete: true }), {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": sessionCookie(req, "", 0),
    });
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
      await reportOperationalFailure({
        severity: "warning",
        component: "security",
        eventType: "login_rate_limited",
        title: "Tentativas repetidas de login",
        message: `Acesso temporariamente bloqueado para ${username || "login não informado"}.`,
        metadata: { username, ipAddress },
      }).catch(() => null);
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

    const loginCompany = await getCompany(validLogin.companyId);
    if (!billingAllowsAccess(loginCompany, validLogin)) {
      await auditRequest(req, validLogin, "billing_access_blocked", "blocked", {
        billingStatus: loginCompany?.billingStatus || "",
      });
      send(res, 402, loginPage("A assinatura da empresa precisa ser regularizada pelo administrador."), {
        "Content-Type": "text/html; charset=utf-8",
      });
      return;
    }

    if (isAdminSession(validLogin) && validLogin.mfaEnabled) {
      await auditRequest(req, validLogin, "mfa_challenge_started", "success");
      send(res, 302, "", {
        Location: "/mfa",
        "Set-Cookie": mfaChallengeCookie(req, createMfaChallenge(validLogin), 300),
      });
      return;
    }

    await auditRequest(req, validLogin, "login_success", "success");

    send(res, 302, "", {
      Location: "/app",
      "Set-Cookie": sessionCookie(
        req,
        await createSession(validLogin, req),
        Math.round(sessionTtlHours * 60 * 60),
      ),
    });
    return;
  }

  if (url.pathname === "/mfa" && req.method === "GET") {
    if (!readMfaChallenge(req)) {
      redirect(res, "/login");
      return;
    }
    send(res, 200, mfaPage(), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (url.pathname === "/mfa" && req.method === "POST") {
    const challenge = readMfaChallenge(req);
    if (!challenge) {
      redirect(res, "/login");
      return;
    }
    const recentFailures = await countRecentMfaFailures(challenge.username, requestIp(req), 15);
    if (recentFailures >= 5) {
      await auditRequest(req, challenge, "mfa_rate_limited", "blocked");
      send(res, 429, mfaPage("Muitas tentativas. Aguarde 15 minutos e tente novamente."), {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "900",
      });
      return;
    }
    const body = querystring.parse(await readBody(req));
    if (!(await verifyMfaInput(challenge.userId, body.code))) {
      await auditRequest(req, challenge, "mfa_failed", "failed");
      send(res, 401, mfaPage("Código inválido. Verifique o aplicativo autenticador."), {
        "Content-Type": "text/html; charset=utf-8",
      });
      return;
    }
    const user = await validateSessionUser(
      challenge.userId,
      challenge.companyId,
      challenge.sessionVersion,
    );
    if (!user) {
      redirect(res, "/login");
      return;
    }
    const loginUserData = { ...user, companyId: user.companyId };
    await auditRequest(req, loginUserData, "mfa_verified", "success");
    await auditRequest(req, loginUserData, "login_success", "success");
    send(res, 302, "", {
      Location: "/app",
      "Set-Cookie": [
        sessionCookie(req, await createSession(loginUserData, req), Math.round(sessionTtlHours * 60 * 60)),
        mfaChallengeCookie(req, "", 0),
      ],
    });
    return;
  }

  if (url.pathname === "/logout" && req.method === "POST") {
    const body = querystring.parse(await readBody(req));
    if (session && String(body.csrfToken || "") !== csrfTokenForSession(session)) {
      send(res, 403, "Solicitação inválida.", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    if (session) {
      await revokeUserSession(session.userId, session.sessionId);
      await auditRequest(req, session, "logout", "success");
    }
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

  if (url.pathname === "/nc-tv") {
    if (!session) {
      send(res, 302, "", { Location: "/login", "Set-Cookie": sessionCookie(req, "", 0) });
      return;
    }
    serveFile(res, path.join(publicDir, "nc-tv.html"));
    return;
  }

  if (url.pathname === "/login.css") {
    serveFile(res, path.join(publicDir, "login.css"));
    return;
  }

  if (
    url.pathname === "/assets/qualitypro-cloud-logo.png" ||
    url.pathname === "/assets/qualitypro-cloud-logo-app.png" ||
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

  if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method) && !isValidCsrf(req, session)) {
    await auditRequest(req, session, "csrf_rejected", "blocked", { path: url.pathname });
    sendJson(res, 403, { error: "invalid_csrf_token" });
    return;
  }

  const companyId = session.companyId;

  if (url.pathname === "/api/security" && req.method === "GET") {
    const [security, sessions] = await Promise.all([
      getUserSecurity(session.userId),
      listUserSessions(session.userId),
    ]);
    sendJson(res, 200, {
      mfaAvailable: isAdminSession(session),
      mfaEnabled: Boolean(security?.enabled),
      sessions: sessions.map((item) => ({
        ...item,
        current: item.id === session.sessionId,
        device: sessionDeviceLabel(item.userAgent),
      })),
    });
    return;
  }

  if (url.pathname === "/api/security/mfa/setup" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "mfa_admin_only" });
      return;
    }
    const existingSecurity = await getUserSecurity(session.userId);
    if (existingSecurity?.enabled) {
      sendJson(res, 409, { error: "mfa_already_enabled" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    const setup = createMfaSetup(session.username);
    await setUserMfa(session.userId, {
      secret: encryptValue(setup.secret, sessionSecret),
      enabled: false,
      recoveryCodes: [],
    });
    await auditRequest(req, session, "mfa_setup_started", "success");
    sendJson(res, 200, {
      secret: setup.secret,
      qrCode: await QRCode.toDataURL(setup.uri, { width: 240, margin: 1 }),
    });
    return;
  }

  if (url.pathname === "/api/security/mfa/enable" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "mfa_admin_only" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    const security = await getUserSecurity(session.userId);
    const secret = decryptValue(security?.secret, sessionSecret);
    if (!secret || !verifyTotp(secret, body?.code)) {
      sendJson(res, 400, { error: "invalid_mfa_code" });
      return;
    }
    const recovery = generateRecoveryCodes();
    await setUserMfa(session.userId, {
      secret: security.secret,
      enabled: true,
      recoveryCodes: recovery.hashes,
    });
    await auditRequest(req, session, "mfa_enabled", "success");
    sendJson(res, 200, { ok: true, recoveryCodes: recovery.values });
    return;
  }

  if (url.pathname === "/api/security/mfa/disable" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "mfa_admin_only" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    if (!(await verifyMfaInput(session.userId, body?.code))) {
      sendJson(res, 400, { error: "invalid_mfa_code" });
      return;
    }
    await setUserMfa(session.userId, { secret: "", enabled: false, recoveryCodes: [] });
    await auditRequest(req, session, "mfa_disabled", "success");
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/security/sessions" && req.method === "DELETE") {
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    const targetSessionId = String(body?.sessionId || "");
    if (!targetSessionId || targetSessionId === session.sessionId) {
      sendJson(res, 400, { error: "cannot_revoke_current_session" });
      return;
    }
    const revoked = await revokeUserSession(session.userId, targetSessionId);
    if (!revoked) {
      sendJson(res, 404, { error: "session_not_found" });
      return;
    }
    await auditRequest(req, session, "session_revoked", "success", { targetSessionId });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/security/sessions/revoke-others" && req.method === "POST") {
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    const revoked = await revokeOtherUserSessions(session.userId, session.sessionId);
    await auditRequest(req, session, "other_sessions_revoked", "success", { count: revoked });
    sendJson(res, 200, { ok: true, revoked });
    return;
  }

  if (url.pathname === "/api/billing" && req.method === "GET") {
    const company = await getCompany(companyId);
    const [events, invoices] = await Promise.all([
      listBillingEvents(companyId, 20),
      company?.billingCustomerId ? listInvoices(company.billingCustomerId).catch(() => []) : [],
    ]);
    sendJson(res, 200, {
      configured: isBillingConfigured(),
      canManage: await isCompanyOwnerSession(session),
      plans: planCatalog(),
      company,
      invoices,
      events,
    });
    return;
  }

  if (url.pathname === "/api/billing/checkout" && req.method === "POST") {
    if (!(await isCompanyOwnerSession(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    if (!isBillingConfigured()) {
      sendJson(res, 503, { error: "billing_not_configured" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    const company = await getCompany(companyId);
    const origin = publicAppUrl || `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    try {
      const checkout = await createCheckout({
        company,
        owner: session,
        plan: body?.plan,
        successUrl: `${origin}/app?billing=success`,
        cancelUrl: `${origin}/app?billing=cancelled`,
      });
      await updateCompanyBilling(companyId, { customerId: checkout.customerId });
      await auditRequest(req, session, "billing_checkout_created", "success", { plan: body?.plan });
      sendJson(res, 200, { url: checkout.url });
    } catch (error) {
      await reportOperationalFailure({
        severity: "error",
        component: "billing",
        eventType: "billing_checkout_failed",
        title: "Falha ao iniciar cobrança",
        message: error.message,
        metadata: { companyId },
      });
      sendJson(res, 400, { error: error.message || "billing_checkout_failed" });
    }
    return;
  }

  if (url.pathname === "/api/billing/portal" && req.method === "POST") {
    if (!(await isCompanyOwnerSession(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    const company = await getCompany(companyId);
    const origin = publicAppUrl || `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    try {
      const portal = await createPortal({ customerId: company.billingCustomerId, returnUrl: `${origin}/app` });
      await auditRequest(req, session, "billing_portal_opened", "success");
      sendJson(res, 200, { url: portal.url });
    } catch (error) {
      await reportOperationalFailure({
        severity: "error",
        component: "billing",
        eventType: "billing_portal_failed",
        title: "Falha ao abrir portal de cobrança",
        message: error.message,
        metadata: { companyId },
      });
      sendJson(res, 400, { error: error.message || "billing_portal_failed" });
    }
    return;
  }

  if (url.pathname === "/api/billing/change-plan" && req.method === "POST") {
    if (!(await isCompanyOwnerSession(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    const company = await getCompany(companyId);
    try {
      const subscription = await changeSubscriptionPlan({
        subscriptionId: company.billingSubscriptionId,
        plan: body?.plan,
      });
      const updated = await updateCompanyBilling(companyId, subscriptionBillingData(subscription));
      await auditRequest(req, session, "billing_plan_changed", "success", {
        plan: updated.plan,
        priceId: updated.billingPriceId,
      });
      sendJson(res, 200, { ok: true, company: updated });
    } catch (error) {
      await reportOperationalFailure({
        severity: "error",
        component: "billing",
        eventType: "billing_plan_change_failed",
        title: "Falha ao alterar plano",
        message: error.message,
        metadata: { companyId },
      });
      sendJson(res, 400, { error: error.message || "billing_plan_change_failed" });
    }
    return;
  }

  if (url.pathname === "/api/admin/operations" && req.method === "GET") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    const [health, backups, incidents, billingEvents] = await Promise.all([
      getOperationalHealth(),
      listBackupSnapshots(30),
      listSystemEvents(50),
      listBillingEvents(null, 50),
    ]);
    sendJson(res, 200, { health, backups, incidents, billingEvents });
    return;
  }

  if (url.pathname === "/api/admin/backups/run" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    try {
      const result = await runAutomaticBackup(req);
      await auditRequest(req, session, "automatic_backup_manual_run", "success", {
        snapshotId: result.snapshot.id,
      });
      sendJson(res, 200, result);
    } catch {
      sendJson(res, 500, { error: "automatic_backup_failed" });
    }
    return;
  }

  if (url.pathname === "/api/admin/backups/verify" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    try {
      const result = await verifyStoredBackup(Number(body?.snapshotId));
      await auditRequest(req, session, "backup_restore_tested", "success", {
        snapshotId: result.snapshot.id,
        counts: result.counts,
      });
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "backup_verification_failed" });
    }
    return;
  }

  if (url.pathname === "/api/monitor/client-error" && req.method === "POST") {
    const body = await readJsonBody(req);
    await recordSystemEvent({
      severity: "warning",
      component: "frontend",
      eventType: "client_error",
      message: String(body?.message || "Erro no navegador").slice(0, 1000),
      metadata: {
        view: String(body?.view || "").slice(0, 100),
        source: String(body?.source || "").slice(0, 300),
      },
    });
    sendJson(res, 202, { ok: true });
    return;
  }

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
        mfaEnabled: Boolean((await getUserSecurity(session.userId))?.enabled),
      },
      csrfToken: csrfTokenForSession(session),
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
    if (!body?.username || !body?.displayName || !isEmail(body.username)) {
      sendJson(res, 400, { error: "invalid_user" });
      return;
    }
    if (!(await requireCurrentPassword(res, session, body))) return;
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
        status: "Pendente",
        password: crypto.randomBytes(32).toString("base64url"),
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
      const company = await getCompany(companyId);
      const invitation = await sendUserInvitation(
        req,
        user,
        company?.name || "sua empresa",
        session.displayName || session.username,
      );
      await auditRequest(req, session, "invitation_sent", invitation.delivery === "sent" ? "success" : "failed", {
        targetUserId: user.id,
        targetUsername: user.username,
        delivery: invitation.delivery,
      });
      sendJson(res, 201, {
        ok: true,
        user: {
          ...user,
          department: body.department || "",
          permissions: body.permissions || {},
        },
        invitation,
      });
    } catch (error) {
      sendJson(res, isUniqueError(error) ? 409 : 500, {
        error: isUniqueError(error) ? "user_exists" : "user_create_failed",
      });
    }
    return;
  }

  if (url.pathname === "/api/company/users/invite" && req.method === "POST") {
    if (!(await canManageCompanyUsers(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    const user = (await listCompanyUsers(companyId)).find((item) => Number(item.id) === Number(body?.userId));
    if (!user || user.status !== "Pendente" || !isEmail(user.username)) {
      sendJson(res, 400, { error: "invalid_invitation_user" });
      return;
    }
    const company = await getCompany(companyId);
    const invitation = await sendUserInvitation(
      req,
      user,
      company?.name || "sua empresa",
      session.displayName || session.username,
    );
    await auditRequest(req, session, "invitation_resent", invitation.delivery === "sent" ? "success" : "failed", {
      targetUserId: user.id,
      targetUsername: user.username,
      delivery: invitation.delivery,
    });
    sendJson(res, 200, { ok: true, invitation });
    return;
  }

  if (url.pathname === "/api/company/users" && req.method === "PATCH") {
    const ownsCompany = await isCompanyOwnerSession(session);
    if (!(await canManageCompanyUsers(session))) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
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
    if (!(await requireCurrentPassword(res, session, body))) return;
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
    if (!(await requireCurrentPassword(res, session, body))) return;
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
    if (!body?.companyId || !body?.username || !body?.displayName || !isEmail(body.username)) {
      sendJson(res, 400, { error: "invalid_user" });
      return;
    }
    if (!(await requireCurrentPassword(res, session, body))) return;

    if (!(await canAddCompanyUser(body.companyId))) {
      sendJson(res, 409, { error: "access_limit_reached" });
      return;
    }

    try {
      const user = await createUser({
        ...body,
        status: "Pendente",
        password: crypto.randomBytes(32).toString("base64url"),
      });
      if (!user) {
        sendJson(res, 400, { error: "invalid_user" });
        return;
      }
      await auditRequest(req, session, "admin_user_created", "success", {
        targetUserId: user.id,
        targetUsername: user.username,
        targetCompanyId: user.companyId,
      });
      const company = await getCompany(user.companyId);
      const invitation = await sendUserInvitation(
        req,
        user,
        company?.name || "sua empresa",
        session.displayName || session.username,
      );
      await auditRequest(req, session, "invitation_sent", invitation.delivery === "sent" ? "success" : "failed", {
        targetUserId: user.id,
        targetUsername: user.username,
        targetCompanyId: user.companyId,
        delivery: invitation.delivery,
      });
      sendJson(res, 201, { ok: true, user, invitation });
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
    if (!(await requireCurrentPassword(res, session, body))) return;
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

  if (url.pathname === "/api/admin/invite" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
    const user = await getUser(Number(body?.userId));
    if (!user || user.status !== "Pendente" || !isEmail(user.username)) {
      sendJson(res, 400, { error: "invalid_invitation_user" });
      return;
    }
    const company = await getCompany(user.companyId);
    const invitation = await sendUserInvitation(
      req,
      user,
      company?.name || "sua empresa",
      session.displayName || session.username,
    );
    await auditRequest(req, session, "invitation_resent", invitation.delivery === "sent" ? "success" : "failed", {
      targetUserId: user.id,
      targetUsername: user.username,
      targetCompanyId: user.companyId,
      delivery: invitation.delivery,
    });
    sendJson(res, 200, { ok: true, invitation });
    return;
  }

  if (url.pathname === "/api/admin/reset-password" && req.method === "POST") {
    if (!isAdminSession(session)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    const body = await readJsonBody(req);
    if (!(await requireCurrentPassword(res, session, body))) return;
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
        documentos: ["documents"],
        auditorias: ["audits"],
        "nao-conformidades": ["ncs", "ncCatalogs"],
        equipamentos: ["equipment"],
      };
      const fields = stateFields[requestedModule];
      if (!fields || !body.value || typeof body.value !== "object") {
        sendJson(res, 403, { error: "state_edit_forbidden" });
        return;
      }
      const submittedState = body.value;
      const currentState = (await getCompanyData(companyId, "state")) || {};
      body.value = { ...currentState };
      fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(submittedState, field)) body.value[field] = submittedState[field];
      });
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

async function safeHandleRequest(req, res) {
  try {
    await handleRequest(req, res);
  } catch (error) {
    console.error("Falha não tratada na requisição:", error);
    await reportOperationalFailure({
      severity: "error",
      component: "server",
      eventType: "request_failed",
      title: "Falha não tratada no servidor",
      message: error.message,
      metadata: { method: req.method, path: String(req.url || "").split("?")[0] },
    }).catch(() => null);
    if (!res.headersSent) sendJson(res, 500, { error: "internal_error" });
    else res.destroy();
  }
}

if (require.main === module) {
  const server = http.createServer(safeHandleRequest);

  server.listen(port, host, () => {
    console.log(`SGQ Online rodando em http://${host}:${port}`);
    console.log(`Usuário configurado: ${loginUser}`);
  });
}

module.exports = safeHandleRequest;
