const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { isDeepStrictEqual } = require("util");
const { HEALTH_SOURCES, HEALTH_PREFIX, healthObservation } = require("./sgq-health");

const databaseUrl = process.env.DATABASE_URL || "";
const usePostgres = Boolean(databaseUrl) && process.env.SGQ_DATABASE_MODE !== "local";
let Pool;

if (usePostgres) {
  ({ Pool } = require("pg"));
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir =
  process.env.SGQ_DATA_DIR ||
  (isServerless ? path.join(os.tmpdir(), "sgq-online-app") : path.join(__dirname, "data"));
const dbPath = process.env.SGQ_DB_PATH || path.join(dataDir, "sgq-local.json");

const defaultCompany = {
  name: "QualityPro Solutions LTDA",
  cnpj: "00.000.000/0001-00",
  scope: "Consultoria, implantação e suporte em Sistemas de Gestão da Qualidade.",
  certification: "ISO 9001:2015",
  plan: "Plano Professional",
  billingStatus: "Ativo",
  accessLimit: 5,
};

let store;
let pool;
let initPromise;

function getStore() {
  if (store) return store;
  fs.mkdirSync(dataDir, { recursive: true });

  try {
    store = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    store = {
      nextCompanyId: 1,
      nextUserId: 1,
      nextAuditLogId: 1,
      nextPasswordResetId: 1,
      nextInvitationId: 1,
      nextBillingEventId: 1,
      nextBackupSnapshotId: 1,
      nextSystemEventId: 1,
      companies: [],
      users: [],
      companyData: [],
      auditLogs: [],
      passwordResetTokens: [],
      invitationTokens: [],
      userSessions: [],
      billingEvents: [],
      backupSnapshots: [],
      systemEvents: [],
    };
    saveStore();
  }

  store.nextAuditLogId = Number(store.nextAuditLogId) || 1;
  store.nextPasswordResetId = Number(store.nextPasswordResetId) || 1;
  store.nextInvitationId = Number(store.nextInvitationId) || 1;
  store.nextBillingEventId = Number(store.nextBillingEventId) || 1;
  store.nextBackupSnapshotId = Number(store.nextBackupSnapshotId) || 1;
  store.nextSystemEventId = Number(store.nextSystemEventId) || 1;
  store.auditLogs = Array.isArray(store.auditLogs) ? store.auditLogs : [];
  store.passwordResetTokens = Array.isArray(store.passwordResetTokens) ? store.passwordResetTokens : [];
  store.invitationTokens = Array.isArray(store.invitationTokens) ? store.invitationTokens : [];
  store.userSessions = Array.isArray(store.userSessions) ? store.userSessions : [];
  store.billingEvents = Array.isArray(store.billingEvents) ? store.billingEvents : [];
  store.backupSnapshots = Array.isArray(store.backupSnapshots) ? store.backupSnapshots : [];
  store.systemEvents = Array.isArray(store.systemEvents) ? store.systemEvents : [];
  store.companies = Array.isArray(store.companies) ? store.companies : [];
  store.users = Array.isArray(store.users) ? store.users : [];
  store.companyData = Array.isArray(store.companyData) ? store.companyData : [];
  store.companies.forEach((company) => {
    company.billing_status = company.billing_status || "Ativo";
    company.access_limit = normalizeAccessLimit(company.access_limit);
    company.updated_at = company.updated_at || company.created_at || timestamp();
    company.billing_customer_id = company.billing_customer_id || "";
    company.billing_subscription_id = company.billing_subscription_id || "";
    company.billing_price_id = company.billing_price_id || "";
    company.billing_current_period_end = company.billing_current_period_end || null;
    company.billing_trial_end = company.billing_trial_end || null;
    company.billing_cancel_at_period_end = Boolean(company.billing_cancel_at_period_end);
  });
  store.users.forEach((user) => {
    user.session_version = Number(user.session_version || 1);
    user.last_login_at = user.last_login_at || null;
    user.mfa_secret = user.mfa_secret || "";
    user.mfa_enabled = Boolean(user.mfa_enabled);
    user.mfa_recovery_codes = Array.isArray(user.mfa_recovery_codes) ? user.mfa_recovery_codes : [];
  });

  return store;
}

function saveStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(store, null, 2));
}

function getPool() {
  if (pool) return pool;

  const ssl =
    process.env.PGSSLMODE === "disable" || /localhost|127\.0\.0\.1/.test(databaseUrl)
      ? false
      : { rejectUnauthorized: false };

  pool = new Pool({
    connectionString: databaseUrl,
    ssl,
  });

  return pool;
}

async function initializeDatabase() {
  if (!usePostgres) {
    getStore();
    return;
  }

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      cnpj TEXT NOT NULL DEFAULT '',
      scope TEXT NOT NULL DEFAULT '',
      certification TEXT NOT NULL DEFAULT '',
      plan TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Administrador',
      status TEXT NOT NULL DEFAULT 'Ativo',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS company_data (
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      data_key TEXT NOT NULL,
      data_json JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (company_id, data_key)
    );

    ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'Ativo',
      ADD COLUMN IF NOT EXISTS access_limit INTEGER NOT NULL DEFAULT 5,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS billing_customer_id TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS billing_subscription_id TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS billing_price_id TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS billing_current_period_end TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS billing_trial_end TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS billing_cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS mfa_secret TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS mfa_recovery_codes JSONB NOT NULL DEFAULT '[]'::jsonb;

    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      username TEXT NOT NULL DEFAULT '',
      event_type TEXT NOT NULL,
      outcome TEXT NOT NULL DEFAULT 'success',
      ip_address TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS audit_logs_login_idx ON audit_logs (username, ip_address, created_at DESC);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
      ON password_reset_tokens (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS password_reset_tokens_expiry_idx
      ON password_reset_tokens (expires_at);

    CREATE TABLE IF NOT EXISTS invitation_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS invitation_tokens_user_idx
      ON invitation_tokens (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS invitation_tokens_expiry_idx
      ON invitation_tokens (expires_at);

    CREATE TABLE IF NOT EXISTS user_sessions (
      session_id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      ip_address TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS user_sessions_user_idx
      ON user_sessions (user_id, last_seen_at DESC);
    CREATE INDEX IF NOT EXISTS user_sessions_expiry_idx
      ON user_sessions (expires_at);

    CREATE TABLE IF NOT EXISTS billing_events (
      id BIGSERIAL PRIMARY KEY,
      stripe_event_id TEXT NOT NULL UNIQUE,
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '',
      amount_total BIGINT,
      currency TEXT NOT NULL DEFAULT '',
      invoice_url TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS billing_events_company_idx
      ON billing_events (company_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS backup_snapshots (
      id BIGSERIAL PRIMARY KEY,
      storage_key TEXT NOT NULL,
      storage_url TEXT NOT NULL DEFAULT '',
      checksum TEXT NOT NULL DEFAULT '',
      byte_size BIGINT NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      verification_status TEXT NOT NULL DEFAULT 'pending',
      verified_at TIMESTAMPTZ,
      error_message TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS backup_snapshots_created_idx
      ON backup_snapshots (created_at DESC);

    CREATE TABLE IF NOT EXISTS system_events (
      id BIGSERIAL PRIMARY KEY,
      severity TEXT NOT NULL DEFAULT 'info',
      component TEXT NOT NULL DEFAULT 'app',
      event_type TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS system_events_created_idx
      ON system_events (created_at DESC);
  `);
}

function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }

  return initPromise;
}

function timestamp() {
  return new Date().toISOString();
}

function mapCompany(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    cnpj: row.cnpj,
    scope: row.scope,
    certification: row.certification,
    plan: row.plan,
    billingStatus: row.billing_status ?? row.billingStatus ?? "Ativo",
    accessLimit: Number(row.access_limit ?? row.accessLimit ?? 5),
    billingCustomerId: row.billing_customer_id ?? row.billingCustomerId ?? "",
    billingSubscriptionId: row.billing_subscription_id ?? row.billingSubscriptionId ?? "",
    billingPriceId: row.billing_price_id ?? row.billingPriceId ?? "",
    billingCurrentPeriodEnd: row.billing_current_period_end ?? row.billingCurrentPeriodEnd ?? null,
    billingTrialEnd: row.billing_trial_end ?? row.billingTrialEnd ?? null,
    billingCancelAtPeriodEnd: Boolean(
      row.billing_cancel_at_period_end ?? row.billingCancelAtPeriodEnd,
    ),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    companyId: row.company_id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    sessionVersion: Number(row.session_version ?? row.sessionVersion ?? 1),
    mustChangePassword: Boolean(row.must_change_password),
    lastLoginAt: row.last_login_at ?? row.lastLoginAt ?? null,
    mfaEnabled: Boolean(row.mfa_enabled ?? row.mfaEnabled),
    created_at: row.created_at,
  };
}

async function ensureDefaultCompany() {
  return ensureCompany(defaultCompany.name);
}

async function ensureCompany(companyName) {
  await ensureInitialized();

  const name = companyName || defaultCompany.name;

  if (usePostgres) {
    const result = await getPool().query(
      `
        INSERT INTO companies (name, cnpj, scope, certification, plan, billing_status, access_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING *
      `,
      [
        name,
        defaultCompany.cnpj,
        defaultCompany.scope,
        defaultCompany.certification,
        defaultCompany.plan,
        defaultCompany.billingStatus,
        defaultCompany.accessLimit,
      ],
    );

    return mapCompany(result.rows[0]);
  }

  const database = getStore();
  let company = database.companies.find((item) => item.name === name);
  if (company) return company;

  company = {
    id: database.nextCompanyId++,
    name,
    cnpj: defaultCompany.cnpj,
    scope: defaultCompany.scope,
    certification: defaultCompany.certification,
    plan: defaultCompany.plan,
    billing_status: defaultCompany.billingStatus,
    access_limit: defaultCompany.accessLimit,
    created_at: timestamp(),
    updated_at: timestamp(),
  };
  database.companies.push(company);
  saveStore();
  return company;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [method, salt, expected] = String(storedHash || "").split(":");
  if (method !== "scrypt" || !salt || !expected) return false;

  const actual = crypto.scryptSync(String(password), salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return expectedBuffer.length === actual.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

function displayNameFromUsername(username) {
  return (
    String(username || "")
      .split(/[.@_-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Usuário"
  );
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeStatus(value, fallback = "Ativo") {
  const status = normalizeText(value) || fallback;
  const lowered = status.toLowerCase();
  if (["bloqueado", "inativo"].includes(lowered)) return "Bloqueado";
  if (["pendente", "pendente (convite enviado)"].includes(lowered)) return "Pendente";
  return "Ativo";
}

function normalizeBillingStatus(value, fallback = "Ativo") {
  const status = normalizeText(value) || fallback;
  const lowered = status.toLowerCase();
  if (["inadimplente", "atrasado"].includes(lowered)) return "Inadimplente";
  if (["cancelado", "cancelada"].includes(lowered)) return "Cancelado";
  if (["teste", "trial", "demo"].includes(lowered)) return "Teste";
  if (["pendente", "aguardando"].includes(lowered)) return "Pendente";
  return "Ativo";
}

function normalizeAccessLimit(value, fallback = 5) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 10000) : fallback;
}

async function syncConfiguredUsers(logins) {
  await ensureInitialized();

  for (const login of logins) {
    if (!login?.user || !login?.password) continue;
    const company = await ensureCompany(login.companyName || `${displayNameFromUsername(login.user)} LTDA`);
    const passwordHash = hashPassword(login.password);

    if (usePostgres) {
      await getPool().query(
        `
          INSERT INTO users (company_id, username, display_name, password_hash, role, status)
          VALUES ($1, $2, $3, $4, 'Administrador', 'Ativo')
          ON CONFLICT (username) DO NOTHING
        `,
        [company.id, login.user, displayNameFromUsername(login.user), passwordHash],
      );
      continue;
    }

    const database = getStore();
    const existing = database.users.find((user) => user.username === login.user);

    if (existing) {
      continue;
    }

    database.users.push({
      id: database.nextUserId++,
      company_id: company.id,
      username: login.user,
      display_name: displayNameFromUsername(login.user),
      password_hash: passwordHash,
      role: "Administrador",
      status: "Ativo",
      session_version: 1,
      last_login_at: null,
      mfa_secret: "",
      mfa_enabled: false,
      mfa_recovery_codes: [],
      created_at: timestamp(),
    });
    saveStore();
  }
}

async function findUser(username, password) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      "SELECT * FROM users WHERE lower(username) = lower($1) AND status = 'Ativo' LIMIT 1",
      [username],
    );
    const row = result.rows[0];
    if (!row || !verifyPassword(password, row.password_hash)) return null;

    await markUserLogin(row.id);

    const company = await getCompany(row.company_id);
    return {
      id: row.id,
      companyId: row.company_id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
      companyName: company?.name || "",
      sessionVersion: Number(row.session_version || 1),
      mfaEnabled: Boolean(row.mfa_enabled),
      mustChangePassword: Boolean(row.must_change_password),
    };
  }

  const database = getStore();
  const user = database.users.find(
    (item) => item.username.toLowerCase() === String(username).toLowerCase() && item.status === "Ativo",
  );
  if (!user || !verifyPassword(password, user.password_hash)) return null;

  await markUserLogin(user.id);

  const company = await getCompany(user.company_id);
  return {
    id: user.id,
    companyId: user.company_id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    companyName: company?.name || "",
    sessionVersion: Number(user.session_version || 1),
    mfaEnabled: Boolean(user.mfa_enabled),
    mustChangePassword: Boolean(user.must_change_password),
  };
}

async function findUserByUsername(username) {
  await ensureInitialized();
  const normalizedUsername = normalizeText(username);
  if (!normalizedUsername) return null;

  if (usePostgres) {
    const result = await getPool().query(
      "SELECT * FROM users WHERE lower(username) = lower($1) AND status = 'Ativo' LIMIT 1",
      [normalizedUsername],
    );
    return mapUser(result.rows[0]);
  }

  const user = getStore().users.find(
    (item) => item.username.toLowerCase() === normalizedUsername.toLowerCase() && item.status === "Ativo",
  );
  return mapUser(user);
}

async function markUserLogin(userId) {
  await ensureInitialized();

  if (usePostgres) {
    await getPool().query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [Number(userId)]);
    return;
  }

  const user = getStore().users.find((item) => item.id === Number(userId));
  if (!user) return;
  user.last_login_at = timestamp();
  saveStore();
}

async function getCompany(companyId) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query("SELECT * FROM companies WHERE id = $1 LIMIT 1", [
      Number(companyId),
    ]);
    return mapCompany(result.rows[0]);
  }

  return mapCompany(
    getStore().companies.find((company) => company.id === Number(companyId)),
  );
}

async function getUser(userId) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query("SELECT * FROM users WHERE id = $1 LIMIT 1", [Number(userId)]);
    return mapUser(result.rows[0]);
  }

  const user = getStore().users.find((item) => item.id === Number(userId));
  return mapUser(user);
}

async function updateCompany(companyId, values) {
  await ensureInitialized();

  const existingCompany = await getCompany(companyId);
  if (!existingCompany) return null;
  const billingStatus = normalizeBillingStatus(
    values.billingStatus,
    existingCompany.billingStatus || existingCompany.billing_status || "Ativo",
  );
  const accessLimit = normalizeAccessLimit(
    values.accessLimit,
    Number(existingCompany.accessLimit || existingCompany.access_limit || 5),
  );

  if (usePostgres) {
    const result = await getPool().query(
      `
        UPDATE companies
        SET name = $2, cnpj = $3, scope = $4, certification = $5, plan = $6,
            billing_status = $7, access_limit = $8, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [
        Number(companyId),
        values.name || "",
        values.cnpj || "",
        values.scope || "",
        values.certification || "",
        values.plan || "",
        billingStatus,
        accessLimit,
      ],
    );
    return mapCompany(result.rows[0]);
  }

  const company = existingCompany;

  company.name = values.name || "";
  company.cnpj = values.cnpj || "";
  company.scope = values.scope || "";
  company.certification = values.certification || "";
  company.plan = values.plan || "";
  company.billing_status = billingStatus;
  company.access_limit = accessLimit;
  company.updated_at = timestamp();
  saveStore();
  return mapCompany(company);
}

async function createCompany(values) {
  await ensureInitialized();

  const company = {
    name: normalizeText(values.name),
    cnpj: normalizeText(values.cnpj),
    scope: normalizeText(values.scope),
    certification: normalizeText(values.certification),
    plan: normalizeText(values.plan),
    billingStatus: normalizeBillingStatus(values.billingStatus),
    accessLimit: normalizeAccessLimit(values.accessLimit),
  };

  if (!company.name) return null;

  if (usePostgres) {
    const result = await getPool().query(
      `
        INSERT INTO companies (name, cnpj, scope, certification, plan, billing_status, access_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        company.name,
        company.cnpj,
        company.scope,
        company.certification,
        company.plan,
        company.billingStatus,
        company.accessLimit,
      ],
    );
    return mapCompany(result.rows[0]);
  }

  const database = getStore();
  const exists = database.companies.some(
    (item) => item.name.toLowerCase() === company.name.toLowerCase(),
  );
  if (exists) {
    const error = new Error("company_exists");
    error.code = "23505";
    throw error;
  }

  const created = {
    id: database.nextCompanyId++,
    name: company.name,
    cnpj: company.cnpj,
    scope: company.scope,
    certification: company.certification,
    plan: company.plan,
    billing_status: company.billingStatus,
    access_limit: company.accessLimit,
    created_at: timestamp(),
    updated_at: timestamp(),
  };
  database.companies.push(created);
  saveStore();
  return mapCompany(created);
}

async function canAddCompanyUser(companyId, excludingUserId = null) {
  const company = await getCompany(companyId);
  if (!company) return false;
  const users = await listCompanyUsers(companyId);
  const count = excludingUserId
    ? users.filter((user) => Number(user.id) !== Number(excludingUserId)).length
    : users.length;
  return count < Number(company.accessLimit || company.access_limit || 5);
}

async function updateAdminCompany(companyId, values) {
  await ensureInitialized();

  const company = {
    name: normalizeText(values.name),
    cnpj: normalizeText(values.cnpj),
    scope: normalizeText(values.scope),
    certification: normalizeText(values.certification),
    plan: normalizeText(values.plan),
    billingStatus: normalizeBillingStatus(values.billingStatus),
    accessLimit: normalizeAccessLimit(values.accessLimit),
  };

  if (!company.name) return null;

  return updateCompany(companyId, company);
}

async function updateUserProfile(userId, values) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      `
        UPDATE users
        SET display_name = $2, role = $3
        WHERE id = $1
        RETURNING *
      `,
      [Number(userId), values.displayName || "", values.role || "Administrador"],
    );
    return mapUser(result.rows[0]);
  }

  const database = getStore();
  const user = database.users.find((item) => item.id === Number(userId));
  if (!user) return null;

  user.display_name = values.displayName || "";
  user.role = values.role || "Administrador";
  saveStore();
  return getUser(userId);
}

async function createUser(values) {
  await ensureInitialized();

  const user = {
    companyId: Number(values.companyId),
    username: normalizeText(values.username),
    displayName: normalizeText(values.displayName),
    role: normalizeText(values.role) || "Administrador",
    status: normalizeStatus(values.status),
    password: String(values.password || ""),
  };

  if (!user.companyId || !user.username || !user.displayName || !user.password) return null;
  const passwordHash = hashPassword(user.password);

  if (usePostgres) {
    const result = await getPool().query(
      `
        INSERT INTO users (company_id, username, display_name, password_hash, role, status, must_change_password)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        RETURNING *
      `,
      [user.companyId, user.username, user.displayName, passwordHash, user.role, user.status],
    );
    return mapUser(result.rows[0]);
  }

  const database = getStore();
  const company = database.companies.find((item) => item.id === user.companyId);
  if (!company) return null;

  const exists = database.users.some(
    (item) => item.username.toLowerCase() === user.username.toLowerCase(),
  );
  if (exists) {
    const error = new Error("user_exists");
    error.code = "23505";
    throw error;
  }

  const created = {
    id: database.nextUserId++,
    company_id: user.companyId,
    username: user.username,
    display_name: user.displayName,
    password_hash: passwordHash,
    role: user.role,
    must_change_password: true,
      status: user.status,
      session_version: 1,
      last_login_at: null,
      mfa_secret: "",
      mfa_enabled: false,
      mfa_recovery_codes: [],
      created_at: timestamp(),
  };
  database.users.push(created);
  saveStore();
  return getUser(created.id);
}

async function updateAdminUser(userId, values) {
  await ensureInitialized();

  const user = {
    companyId: Number(values.companyId),
    username: normalizeText(values.username),
    displayName: normalizeText(values.displayName),
    role: normalizeText(values.role) || "Administrador",
    status: normalizeStatus(values.status),
  };

  if (!user.companyId || !user.username || !user.displayName) return null;

  if (usePostgres) {
    const result = await getPool().query(
      `
        UPDATE users
        SET company_id = $2, username = $3, display_name = $4, role = $5, status = $6,
            session_version = CASE
              WHEN company_id <> $2 OR username <> $3 OR role <> $5 OR status <> $6
              THEN session_version + 1 ELSE session_version END
        WHERE id = $1
        RETURNING *
      `,
      [Number(userId), user.companyId, user.username, user.displayName, user.role, user.status],
    );
    return mapUser(result.rows[0]);
  }

  const database = getStore();
  const existing = database.users.find((item) => item.id === Number(userId));
  if (!existing) return null;

  const company = database.companies.find((item) => item.id === user.companyId);
  if (!company) return null;

  const duplicate = database.users.some(
    (item) =>
      item.id !== Number(userId) && item.username.toLowerCase() === user.username.toLowerCase(),
  );
  if (duplicate) {
    const error = new Error("user_exists");
    error.code = "23505";
    throw error;
  }

  const shouldInvalidateSession =
    existing.company_id !== user.companyId ||
    existing.username !== user.username ||
    existing.role !== user.role ||
    existing.status !== user.status;
  existing.company_id = user.companyId;
  existing.username = user.username;
  existing.display_name = user.displayName;
  existing.role = user.role;
  existing.status = user.status;
  if (shouldInvalidateSession) {
    existing.session_version = Number(existing.session_version || 1) + 1;
  }
  saveStore();
  return getUser(userId);
}

async function listCompanyUsers(companyId) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      `
        SELECT *
        FROM users
        WHERE company_id = $1
        ORDER BY created_at ASC, id ASC
      `,
      [Number(companyId)],
    );
    return result.rows.map(mapUser);
  }

  return getStore().users
    .filter((user) => user.company_id === Number(companyId))
    .sort((a, b) => a.id - b.id)
    .map(mapUser);
}

async function updateCompanyUser(companyId, userId, values) {
  await ensureInitialized();

  const user = {
    username: normalizeText(values.username),
    displayName: normalizeText(values.displayName),
    role: normalizeText(values.role) || "Colaborador",
    status: normalizeStatus(values.status, "Pendente"),
  };

  if (!user.username || !user.displayName) return null;

  if (usePostgres) {
    const result = await getPool().query(
      `
        UPDATE users
        SET username = $3, display_name = $4, role = $5, status = $6,
            session_version = CASE
              WHEN username <> $3 OR role <> $5 OR status <> $6
              THEN session_version + 1 ELSE session_version END
        WHERE id = $1 AND company_id = $2
        RETURNING *
      `,
      [Number(userId), Number(companyId), user.username, user.displayName, user.role, user.status],
    );
    return mapUser(result.rows[0]);
  }

  const database = getStore();
  const existing = database.users.find(
    (item) => item.id === Number(userId) && item.company_id === Number(companyId),
  );
  if (!existing) return null;

  const duplicate = database.users.some(
    (item) =>
      item.id !== Number(userId) && item.username.toLowerCase() === user.username.toLowerCase(),
  );
  if (duplicate) {
    const error = new Error("user_exists");
    error.code = "23505";
    throw error;
  }

  const shouldInvalidateSession =
    existing.username !== user.username || existing.role !== user.role || existing.status !== user.status;
  existing.username = user.username;
  existing.display_name = user.displayName;
  existing.role = user.role;
  existing.status = user.status;
  if (shouldInvalidateSession) {
    existing.session_version = Number(existing.session_version || 1) + 1;
  }
  saveStore();
  return getUser(userId);
}

async function deleteCompanyUser(companyId, userId) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      "DELETE FROM users WHERE id = $1 AND company_id = $2 RETURNING *",
      [Number(userId), Number(companyId)],
    );
    return mapUser(result.rows[0]);
  }

  const database = getStore();
  const index = database.users.findIndex(
    (item) => item.id === Number(userId) && item.company_id === Number(companyId),
  );
  if (index < 0) return null;

  const [deleted] = database.users.splice(index, 1);
  saveStore();
  return mapUser(deleted);
}

async function listAdminOverview() {
  await ensureInitialized();

  if (usePostgres) {
    const companiesResult = await getPool().query(`
      SELECT
        c.*,
        COUNT(u.id)::int AS access_count,
        COUNT(u.id) FILTER (WHERE u.status = 'Ativo')::int AS active_access_count,
        MAX(u.last_login_at) AS last_activity_at
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.id DESC
    `);

    const usersResult = await getPool().query(`
      SELECT
        u.id,
        u.company_id,
        u.username,
        u.display_name,
        u.role,
        u.status,
        u.last_login_at,
        u.created_at,
        c.name AS company_name,
        c.plan AS company_plan
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      ORDER BY u.created_at DESC, u.id DESC
    `);

    const logsResult = await getPool().query(`
      SELECT id, company_id, user_id, username, event_type, outcome, ip_address, metadata, created_at
      FROM audit_logs
      ORDER BY created_at DESC, id DESC
      LIMIT 60
    `);

    const activityResult = await getPool().query(`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'login_success' AND created_at >= NOW() - INTERVAL '24 hours')::int AS successful_logins_24h,
        COUNT(*) FILTER (WHERE event_type IN ('login_failed', 'login_rate_limited') AND created_at >= NOW() - INTERVAL '24 hours')::int AS failed_logins_24h
      FROM audit_logs
    `);

    const companies = companiesResult.rows.map((row) => ({
      ...mapCompany(row),
      access_count: row.access_count,
      active_access_count: row.active_access_count,
      last_activity_at: row.last_activity_at,
    }));
    const users = usersResult.rows.map((row) => ({
      id: row.id,
      companyId: row.company_id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
      status: row.status,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      companyName: row.company_name || "",
      companyPlan: row.company_plan || "",
    }));
    const logs = logsResult.rows.map(mapAuditLog);
    const activity = activityResult.rows[0] || {};
    const payingCompanies = companies.filter(
      (company) => company.billingStatus === "Ativo" && isPaidPlan(company.plan),
    );

    return {
      summary: {
        companies: companies.length,
        payingCompanies: payingCompanies.length,
        accesses: users.length,
        activeAccesses: users.filter((user) => user.status === "Ativo").length,
        blockedAccesses: users.filter((user) => user.status === "Bloqueado").length,
        successfulLogins24h: Number(activity.successful_logins_24h || 0),
        failedLogins24h: Number(activity.failed_logins_24h || 0),
      },
      companies,
      users,
      logs,
    };
  }

  const database = getStore();
  const companies = database.companies
    .map((company) => {
      const users = database.users.filter((user) => user.company_id === company.id);
      return {
        ...company,
        billingStatus: company.billing_status || "Ativo",
        accessLimit: Number(company.access_limit || 5),
        access_count: users.length,
        active_access_count: users.filter((user) => user.status === "Ativo").length,
        last_activity_at:
          users.map((user) => user.last_login_at).filter(Boolean).sort().at(-1) || null,
      };
    })
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || b.id - a.id);

  const users = database.users
    .map((user) => {
      const company = database.companies.find((item) => item.id === user.company_id);
      return {
        id: user.id,
        companyId: user.company_id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        status: user.status,
        lastLoginAt: user.last_login_at || null,
        createdAt: user.created_at,
        companyName: company?.name || "",
        companyPlan: company?.plan || "",
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.id - a.id);

  const logs = database.auditLogs.slice().sort(sortNewestFirst).slice(0, 60).map(mapAuditLog);
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const payingCompanies = companies.filter(
    (company) => company.billingStatus === "Ativo" && isPaidPlan(company.plan),
  );

  return {
    summary: {
      companies: companies.length,
      payingCompanies: payingCompanies.length,
      accesses: users.length,
      activeAccesses: users.filter((user) => user.status === "Ativo").length,
      blockedAccesses: users.filter((user) => user.status === "Bloqueado").length,
      successfulLogins24h: logs.filter(
        (log) => log.eventType === "login_success" && new Date(log.createdAt).getTime() >= since,
      ).length,
      failedLogins24h: logs.filter(
        (log) =>
          ["login_failed", "login_rate_limited"].includes(log.eventType) &&
          new Date(log.createdAt).getTime() >= since,
      ).length,
    },
    companies,
    users,
    logs,
  };
}

function sortNewestFirst(a, b) {
  return String(b.created_at || b.createdAt || "").localeCompare(
    String(a.created_at || a.createdAt || ""),
  );
}

function mapAuditLog(row) {
  if (!row) return null;
  return {
    id: row.id,
    companyId: row.company_id ?? row.companyId ?? null,
    userId: row.user_id ?? row.userId ?? null,
    username: row.username || "",
    eventType: row.event_type ?? row.eventType ?? "",
    outcome: row.outcome || "success",
    ipAddress: row.ip_address ?? row.ipAddress ?? "",
    metadata: row.metadata || {},
    createdAt: row.created_at ?? row.createdAt,
  };
}

function isPaidPlan(plan) {
  const value = String(plan || "").trim().toLowerCase();
  return Boolean(value) && !["gratis", "grátis", "free", "teste", "demo"].includes(value);
}

async function resetUserPassword(userId, temporaryPassword, { mustChangePassword = true, sessionVersion = null } = {}) {
  await ensureInitialized();
  const passwordHash = hashPassword(temporaryPassword);

  if (usePostgres) {
    const result = await getPool().query(
      "UPDATE users SET password_hash = $2, must_change_password = $3, session_version = session_version + 1 WHERE id = $1 AND ($4::integer IS NULL OR session_version = $4) RETURNING *",
      [Number(userId), passwordHash, mustChangePassword, sessionVersion],
    );
    if (!result.rows[0]) return null;
    await getPool().query(
      "UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [Number(userId)],
    );
    return mapUser(result.rows[0]);
  }

  const database = getStore();
  const user = database.users.find((item) => item.id === Number(userId));
  if (!user) return null;

  if (sessionVersion !== null && Number(user.session_version || 1) !== sessionVersion) return null;
  user.password_hash = passwordHash;
  user.must_change_password = mustChangePassword;
  user.session_version = Number(user.session_version || 1) + 1;
  database.userSessions.forEach((session) => {
    if (Number(session.user_id) === Number(userId) && !session.revoked_at) session.revoked_at = timestamp();
  });
  saveStore();
  return getUser(userId);
}

async function verifyUserPassword(userId, password) {
  await ensureInitialized();
  if (!password) return false;

  if (usePostgres) {
    const result = await getPool().query("SELECT password_hash FROM users WHERE id = $1 LIMIT 1", [
      Number(userId),
    ]);
    return verifyPassword(password, result.rows[0]?.password_hash);
  }

  const user = getStore().users.find((item) => Number(item.id) === Number(userId));
  return Boolean(user && verifyPassword(password, user.password_hash));
}

async function getUserSecurity(userId) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      "SELECT mfa_secret, mfa_enabled, mfa_recovery_codes FROM users WHERE id = $1 LIMIT 1",
      [Number(userId)],
    );
    const row = result.rows[0];
    return row
      ? {
          secret: row.mfa_secret || "",
          enabled: Boolean(row.mfa_enabled),
          recoveryCodes: Array.isArray(row.mfa_recovery_codes) ? row.mfa_recovery_codes : [],
        }
      : null;
  }

  const user = getStore().users.find((item) => Number(item.id) === Number(userId));
  return user
    ? {
        secret: user.mfa_secret || "",
        enabled: Boolean(user.mfa_enabled),
        recoveryCodes: Array.isArray(user.mfa_recovery_codes) ? user.mfa_recovery_codes : [],
      }
    : null;
}

async function setUserMfa(userId, values = {}) {
  await ensureInitialized();
  const secret = String(values.secret || "");
  const enabled = Boolean(values.enabled);
  const recoveryCodes = Array.isArray(values.recoveryCodes) ? values.recoveryCodes : [];

  if (usePostgres) {
    const result = await getPool().query(
      `UPDATE users
       SET mfa_secret = $2, mfa_enabled = $3, mfa_recovery_codes = $4::jsonb
       WHERE id = $1
       RETURNING *`,
      [Number(userId), secret, enabled, JSON.stringify(recoveryCodes)],
    );
    return mapUser(result.rows[0]);
  }

  const database = getStore();
  const user = database.users.find((item) => Number(item.id) === Number(userId));
  if (!user) return null;
  user.mfa_secret = secret;
  user.mfa_enabled = enabled;
  user.mfa_recovery_codes = recoveryCodes;
  saveStore();
  return mapUser(user);
}

async function consumeMfaRecoveryCode(userId, codeHash) {
  await ensureInitialized();
  if (!codeHash) return false;

  if (usePostgres) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "SELECT mfa_recovery_codes FROM users WHERE id = $1 FOR UPDATE",
        [Number(userId)],
      );
      const codes = Array.isArray(result.rows[0]?.mfa_recovery_codes)
        ? result.rows[0].mfa_recovery_codes
        : [];
      const index = codes.indexOf(codeHash);
      if (index < 0) {
        await client.query("ROLLBACK");
        return false;
      }
      codes.splice(index, 1);
      await client.query("UPDATE users SET mfa_recovery_codes = $2::jsonb WHERE id = $1", [
        Number(userId),
        JSON.stringify(codes),
      ]);
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const database = getStore();
  const user = database.users.find((item) => Number(item.id) === Number(userId));
  const index = user?.mfa_recovery_codes?.indexOf(codeHash) ?? -1;
  if (index < 0) return false;
  user.mfa_recovery_codes.splice(index, 1);
  saveStore();
  return true;
}

function passwordResetTokenHash(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

async function createInvitationToken(userId, ttlHours = 48) {
  await ensureInitialized();
  const user = await getUser(userId);
  if (!user) return null;

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = passwordResetTokenHash(token);
  const safeTtl = Math.max(1, Math.min(Number(ttlHours) || 48, 168));
  const expiresAt = new Date(Date.now() + safeTtl * 60 * 60 * 1000).toISOString();

  if (usePostgres) {
    await getPool().query(
      "UPDATE invitation_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [Number(userId)],
    );
    await getPool().query(
      `INSERT INTO invitation_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [Number(userId), tokenHash, expiresAt],
    );
  } else {
    const database = getStore();
    database.invitationTokens.forEach((item) => {
      if (Number(item.user_id) === Number(userId) && !item.used_at) item.used_at = timestamp();
    });
    database.invitationTokens.push({
      id: database.nextInvitationId++,
      user_id: Number(userId),
      token_hash: tokenHash,
      expires_at: expiresAt,
      used_at: null,
      created_at: timestamp(),
    });
    saveStore();
  }

  return { token, expiresAt, user };
}

async function getInvitationByToken(token) {
  await ensureInitialized();
  const tokenHash = passwordResetTokenHash(token);
  if (!tokenHash) return null;

  if (usePostgres) {
    const result = await getPool().query(
      `SELECT u.*, c.name AS company_name, i.expires_at
       FROM invitation_tokens i
       JOIN users u ON u.id = i.user_id
       JOIN companies c ON c.id = u.company_id
       WHERE i.token_hash = $1 AND i.used_at IS NULL AND i.expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? { user: mapUser(row), companyName: row.company_name, expiresAt: row.expires_at } : null;
  }

  const database = getStore();
  const invitation = database.invitationTokens.find(
    (item) => item.token_hash === tokenHash && !item.used_at && new Date(item.expires_at).getTime() > Date.now(),
  );
  if (!invitation) return null;
  const user = database.users.find((item) => Number(item.id) === Number(invitation.user_id));
  const company = database.companies.find((item) => Number(item.id) === Number(user?.company_id));
  return user ? { user: mapUser(user), companyName: company?.name || "", expiresAt: invitation.expires_at } : null;
}

async function consumeInvitationToken(token, newPassword) {
  await ensureInitialized();
  const tokenHash = passwordResetTokenHash(token);
  if (!tokenHash || String(newPassword || "").length < 8) return null;
  const passwordHash = hashPassword(newPassword);

  if (usePostgres) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const tokenResult = await client.query(
        `UPDATE invitation_tokens
         SET used_at = NOW()
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
         RETURNING user_id`,
        [tokenHash],
      );
      const userId = tokenResult.rows[0]?.user_id;
      if (!userId) {
        await client.query("ROLLBACK");
        return null;
      }
      const userResult = await client.query(
        `UPDATE users
         SET password_hash = $2, must_change_password = FALSE, status = 'Ativo', session_version = session_version + 1
         WHERE id = $1 AND status <> 'Bloqueado'
         RETURNING *`,
        [Number(userId), passwordHash],
      );
      if (!userResult.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }
      await client.query("UPDATE invitation_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [
        Number(userId),
      ]);
      await client.query("UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", [
        Number(userId),
      ]);
      await client.query("COMMIT");
      return mapUser(userResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const database = getStore();
  const invitation = database.invitationTokens.find(
    (item) => item.token_hash === tokenHash && !item.used_at && new Date(item.expires_at).getTime() > Date.now(),
  );
  if (!invitation) return null;
  const user = database.users.find(
    (item) => Number(item.id) === Number(invitation.user_id) && item.status !== "Bloqueado",
  );
  if (!user) return null;
  invitation.used_at = timestamp();
  database.invitationTokens.forEach((item) => {
    if (Number(item.user_id) === Number(user.id) && !item.used_at) item.used_at = timestamp();
  });
  user.password_hash = passwordHash;
  user.status = "Ativo";
  user.must_change_password = false;
  user.session_version = Number(user.session_version || 1) + 1;
  database.userSessions.forEach((session) => {
    if (Number(session.user_id) === Number(user.id) && !session.revoked_at) session.revoked_at = timestamp();
  });
  saveStore();
  return mapUser(user);
}

async function createPasswordResetToken(username, ttlMinutes = 30) {
  await ensureInitialized();
  const user = await findUserByUsername(username);
  if (!user) return null;

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = passwordResetTokenHash(token);
  const safeTtl = Math.max(10, Math.min(Number(ttlMinutes) || 30, 120));
  const expiresAt = new Date(Date.now() + safeTtl * 60 * 1000).toISOString();

  if (usePostgres) {
    await getPool().query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [Number(user.id)],
    );
    await getPool().query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [Number(user.id), tokenHash, expiresAt],
    );
  } else {
    const database = getStore();
    database.passwordResetTokens.forEach((item) => {
      if (Number(item.user_id) === Number(user.id) && !item.used_at) item.used_at = timestamp();
    });
    database.passwordResetTokens.push({
      id: database.nextPasswordResetId++,
      user_id: Number(user.id),
      token_hash: tokenHash,
      expires_at: expiresAt,
      used_at: null,
      created_at: timestamp(),
    });
    saveStore();
  }

  return { token, expiresAt, user };
}

async function consumePasswordResetToken(token, newPassword) {
  await ensureInitialized();
  const tokenHash = passwordResetTokenHash(token);
  if (!tokenHash || String(newPassword || "").length < 8) return null;

  if (usePostgres) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const tokenResult = await client.query(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
         RETURNING user_id`,
        [tokenHash],
      );
      const userId = tokenResult.rows[0]?.user_id;
      if (!userId) {
        await client.query("ROLLBACK");
        return null;
      }
      const passwordHash = hashPassword(newPassword);
      const userResult = await client.query(
        `UPDATE users
         SET password_hash = $2, must_change_password = FALSE, session_version = session_version + 1
         WHERE id = $1 AND status = 'Ativo'
         RETURNING *`,
        [Number(userId), passwordHash],
      );
      if (!userResult.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }
      await client.query(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
        [Number(userId)],
      );
      await client.query(
        "UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
        [Number(userId)],
      );
      await client.query("COMMIT");
      return mapUser(userResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const database = getStore();
  const now = Date.now();
  const reset = database.passwordResetTokens.find(
    (item) => item.token_hash === tokenHash && !item.used_at && new Date(item.expires_at).getTime() > now,
  );
  if (!reset) return null;
  const user = database.users.find(
    (item) => Number(item.id) === Number(reset.user_id) && item.status === "Ativo",
  );
  if (!user) return null;
  reset.used_at = timestamp();
  database.passwordResetTokens.forEach((item) => {
    if (Number(item.user_id) === Number(user.id) && !item.used_at) item.used_at = timestamp();
  });
  user.password_hash = hashPassword(newPassword);
  user.must_change_password = false;
  user.session_version = Number(user.session_version || 1) + 1;
  database.userSessions.forEach((session) => {
    if (Number(session.user_id) === Number(user.id) && !session.revoked_at) session.revoked_at = timestamp();
  });
  saveStore();
  return mapUser(user);
}

async function countRecentPasswordResetRequests(username, ipAddress, minutes = 15) {
  await ensureInitialized();
  const normalizedUsername = normalizeText(username).toLowerCase();
  const normalizedIp = normalizeText(ipAddress);
  const safeMinutes = Math.max(1, Math.min(Number(minutes) || 15, 1440));

  if (usePostgres) {
    const result = await getPool().query(
      `SELECT COUNT(*)::int AS count
       FROM audit_logs
       WHERE event_type = 'password_reset_requested'
         AND created_at >= NOW() - ($3::text || ' minutes')::interval
         AND (lower(username) = $1 OR ip_address = $2)`,
      [normalizedUsername, normalizedIp, String(safeMinutes)],
    );
    return Number(result.rows[0]?.count || 0);
  }

  const since = Date.now() - safeMinutes * 60 * 1000;
  return getStore().auditLogs.filter((log) => {
    const recent = new Date(log.created_at).getTime() >= since;
    const matches =
      String(log.username || "").toLowerCase() === normalizedUsername ||
      String(log.ip_address || "") === normalizedIp;
    return log.event_type === "password_reset_requested" && recent && matches;
  }).length;
}

async function validateSessionUser(userId, companyId, sessionVersion) {
  const user = await getUser(userId);
  if (!user || user.status !== "Ativo") return null;
  if (Number(user.companyId) !== Number(companyId)) return null;
  if (Number(user.sessionVersion || 1) !== Number(sessionVersion || 1)) return null;
  return user;
}

function mapSession(row) {
  if (!row) return null;
  return {
    id: row.session_id ?? row.id,
    userId: Number(row.user_id ?? row.userId),
    companyId: Number(row.company_id ?? row.companyId),
    ipAddress: row.ip_address ?? row.ipAddress ?? "",
    userAgent: row.user_agent ?? row.userAgent ?? "",
    createdAt: row.created_at ?? row.createdAt,
    lastSeenAt: row.last_seen_at ?? row.lastSeenAt,
    expiresAt: row.expires_at ?? row.expiresAt,
    revokedAt: row.revoked_at ?? row.revokedAt ?? null,
  };
}

async function registerUserSession(values) {
  await ensureInitialized();
  const row = {
    id: normalizeText(values.sessionId),
    userId: Number(values.userId),
    companyId: Number(values.companyId),
    ipAddress: normalizeText(values.ipAddress).slice(0, 100),
    userAgent: normalizeText(values.userAgent).slice(0, 500),
    expiresAt: new Date(values.expiresAt).toISOString(),
  };
  if (!row.id || !row.userId || !row.companyId) return null;

  if (usePostgres) {
    const result = await getPool().query(
      `INSERT INTO user_sessions
        (session_id, user_id, company_id, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (session_id) DO UPDATE SET
         ip_address = EXCLUDED.ip_address,
         user_agent = EXCLUDED.user_agent,
         last_seen_at = NOW(),
         expires_at = EXCLUDED.expires_at,
         revoked_at = NULL
       RETURNING *`,
      [row.id, row.userId, row.companyId, row.ipAddress, row.userAgent, row.expiresAt],
    );
    return mapSession(result.rows[0]);
  }

  const database = getStore();
  const created = {
    session_id: row.id,
    user_id: row.userId,
    company_id: row.companyId,
    ip_address: row.ipAddress,
    user_agent: row.userAgent,
    created_at: timestamp(),
    last_seen_at: timestamp(),
    expires_at: row.expiresAt,
    revoked_at: null,
  };
  database.userSessions.push(created);
  saveStore();
  return mapSession(created);
}

async function validateUserSession(sessionId, userId, companyId) {
  await ensureInitialized();
  if (!sessionId) return null;

  if (usePostgres) {
    const result = await getPool().query(
      `UPDATE user_sessions
       SET last_seen_at = CASE
         WHEN last_seen_at < NOW() - INTERVAL '5 minutes' THEN NOW()
         ELSE last_seen_at
       END
       WHERE session_id = $1 AND user_id = $2 AND company_id = $3
         AND revoked_at IS NULL AND expires_at > NOW()
       RETURNING *`,
      [sessionId, Number(userId), Number(companyId)],
    );
    return mapSession(result.rows[0]);
  }

  const database = getStore();
  const session = database.userSessions.find(
    (item) =>
      item.session_id === sessionId &&
      Number(item.user_id) === Number(userId) &&
      Number(item.company_id) === Number(companyId) &&
      !item.revoked_at &&
      new Date(item.expires_at).getTime() > Date.now(),
  );
  if (!session) return null;
  if (Date.now() - new Date(session.last_seen_at).getTime() > 5 * 60 * 1000) {
    session.last_seen_at = timestamp();
    saveStore();
  }
  return mapSession(session);
}

async function listUserSessions(userId) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      `SELECT * FROM user_sessions
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY last_seen_at DESC`,
      [Number(userId)],
    );
    return result.rows.map(mapSession);
  }

  return getStore().userSessions
    .filter(
      (item) =>
        Number(item.user_id) === Number(userId) &&
        !item.revoked_at &&
        new Date(item.expires_at).getTime() > Date.now(),
    )
    .sort((a, b) => String(b.last_seen_at).localeCompare(String(a.last_seen_at)))
    .map(mapSession);
}

async function revokeUserSession(userId, sessionId) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      `UPDATE user_sessions SET revoked_at = NOW()
       WHERE user_id = $1 AND session_id = $2 AND revoked_at IS NULL
       RETURNING *`,
      [Number(userId), sessionId],
    );
    return mapSession(result.rows[0]);
  }

  const database = getStore();
  const session = database.userSessions.find(
    (item) => Number(item.user_id) === Number(userId) && item.session_id === sessionId && !item.revoked_at,
  );
  if (!session) return null;
  session.revoked_at = timestamp();
  saveStore();
  return mapSession(session);
}

async function revokeOtherUserSessions(userId, currentSessionId) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      `UPDATE user_sessions SET revoked_at = NOW()
       WHERE user_id = $1 AND session_id <> $2 AND revoked_at IS NULL
       RETURNING session_id`,
      [Number(userId), currentSessionId],
    );
    return result.rowCount;
  }

  const database = getStore();
  let count = 0;
  database.userSessions.forEach((session) => {
    if (Number(session.user_id) === Number(userId) && session.session_id !== currentSessionId && !session.revoked_at) {
      session.revoked_at = timestamp();
      count += 1;
    }
  });
  if (count) saveStore();
  return count;
}

async function countRecentMfaFailures(username, ipAddress, minutes = 15) {
  await ensureInitialized();
  const normalizedUsername = normalizeText(username).toLowerCase();
  const normalizedIp = normalizeText(ipAddress);
  const safeMinutes = Math.max(1, Math.min(Number(minutes) || 15, 1440));

  if (usePostgres) {
    const result = await getPool().query(
      `SELECT COUNT(*)::int AS count
       FROM audit_logs
       WHERE event_type = 'mfa_failed'
         AND created_at >= NOW() - ($3::text || ' minutes')::interval
         AND (lower(username) = $1 OR ip_address = $2)`,
      [normalizedUsername, normalizedIp, String(safeMinutes)],
    );
    return Number(result.rows[0]?.count || 0);
  }

  const since = Date.now() - safeMinutes * 60 * 1000;
  return getStore().auditLogs.filter((log) => {
    const recent = new Date(log.created_at).getTime() >= since;
    const matches =
      String(log.username || "").toLowerCase() === normalizedUsername ||
      String(log.ip_address || "") === normalizedIp;
    return log.event_type === "mfa_failed" && recent && matches;
  }).length;
}

async function listNotificationTargets(includeWithoutUsers = false) {
  await ensureInitialized();
  let companies;
  if (usePostgres) {
    const result = await getPool().query("SELECT * FROM companies ORDER BY id ASC");
    companies = result.rows.map(mapCompany);
  } else {
    companies = getStore().companies.map(mapCompany);
  }

  const targets = [];
  for (const company of companies) {
    const users = (await listCompanyUsers(company.id)).filter(
      (user) => user.status === "Ativo" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.username),
    );
    if (!users.length && !includeWithoutUsers) continue;
    const rows = await listCompanyData(company.id);
    targets.push({
      company,
      users,
      data: Object.fromEntries(rows.map((row) => [row.key, row.value])),
    });
  }
  return targets;
}

async function hasRecentCompanyEvent(companyId, eventType, hours = 20) {
  await ensureInitialized();
  const safeHours = Math.max(1, Math.min(Number(hours) || 20, 168));

  if (usePostgres) {
    const result = await getPool().query(
      `SELECT 1 FROM audit_logs
       WHERE company_id = $1 AND event_type = $2
         AND created_at >= NOW() - ($3::text || ' hours')::interval
       LIMIT 1`,
      [Number(companyId), eventType, String(safeHours)],
    );
    return Boolean(result.rows[0]);
  }

  const since = Date.now() - safeHours * 60 * 60 * 1000;
  return getStore().auditLogs.some(
    (log) =>
      Number(log.company_id) === Number(companyId) &&
      log.event_type === eventType &&
      new Date(log.created_at).getTime() >= since,
  );
}

async function recordAuditLog(values = {}) {
  await ensureInitialized();
  const log = {
    companyId: values.companyId ? Number(values.companyId) : null,
    userId: values.userId ? Number(values.userId) : null,
    username: normalizeText(values.username).slice(0, 200),
    eventType: normalizeText(values.eventType).slice(0, 100) || "unknown",
    outcome: normalizeText(values.outcome).slice(0, 30) || "success",
    ipAddress: normalizeText(values.ipAddress).slice(0, 100),
    userAgent: normalizeText(values.userAgent).slice(0, 500),
    metadata: values.metadata && typeof values.metadata === "object" ? values.metadata : {},
  };

  if (usePostgres) {
    const result = await getPool().query(
      `
        INSERT INTO audit_logs
          (company_id, user_id, username, event_type, outcome, ip_address, user_agent, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        log.companyId,
        log.userId,
        log.username,
        log.eventType,
        log.outcome,
        log.ipAddress,
        log.userAgent,
        JSON.stringify(log.metadata),
      ],
    );
    return mapAuditLog(result.rows[0]);
  }

  const database = getStore();
  const row = {
    id: database.nextAuditLogId++,
    company_id: log.companyId,
    user_id: log.userId,
    username: log.username,
    event_type: log.eventType,
    outcome: log.outcome,
    ip_address: log.ipAddress,
    user_agent: log.userAgent,
    metadata: log.metadata,
    created_at: timestamp(),
  };
  database.auditLogs.push(row);
  if (database.auditLogs.length > 5000) {
    database.auditLogs = database.auditLogs.sort(sortNewestFirst).slice(0, 5000);
  }
  saveStore();
  return mapAuditLog(row);
}

async function countRecentFailedLogins(username, ipAddress, minutes = 15) {
  await ensureInitialized();
  const normalizedUsername = normalizeText(username).toLowerCase();
  const normalizedIp = normalizeText(ipAddress);
  const safeMinutes = Math.max(1, Math.min(Number(minutes) || 15, 1440));

  if (usePostgres) {
    const result = await getPool().query(
      `
        SELECT COUNT(*)::int AS count
        FROM audit_logs
        WHERE event_type IN ('login_failed', 'login_rate_limited')
          AND created_at >= NOW() - ($3::text || ' minutes')::interval
          AND (lower(username) = $1 OR ip_address = $2)
      `,
      [normalizedUsername, normalizedIp, String(safeMinutes)],
    );
    return Number(result.rows[0]?.count || 0);
  }

  const since = Date.now() - safeMinutes * 60 * 1000;
  return getStore().auditLogs.filter((log) => {
    const failed = ["login_failed", "login_rate_limited"].includes(log.event_type);
    const recent = new Date(log.created_at).getTime() >= since;
    const matches =
      String(log.username || "").toLowerCase() === normalizedUsername ||
      String(log.ip_address || "") === normalizedIp;
    return failed && recent && matches;
  }).length;
}

async function listCompanyData(companyId) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      `
        SELECT data_key, data_json, updated_at
        FROM company_data
        WHERE company_id = $1
        ORDER BY data_key
      `,
      [Number(companyId)],
    );
    return result.rows.map((row) => ({
      key: row.data_key,
      value: row.data_json,
      updatedAt: row.updated_at,
    }));
  }

  return getStore().companyData
    .filter((row) => row.company_id === Number(companyId))
    .map((row) => ({ key: row.data_key, value: row.data_json, updatedAt: row.updated_at }));
}

async function getBackupSnapshot(companyId = null) {
  await ensureInitialized();
  const targetCompanyId = companyId ? Number(companyId) : null;

  if (usePostgres) {
    const companyParams = targetCompanyId ? [targetCompanyId] : [];
    const companyWhere = targetCompanyId ? "WHERE id = $1" : "";
    const userWhere = targetCompanyId ? "WHERE company_id = $1" : "";
    const dataWhere = targetCompanyId ? "WHERE company_id = $1" : "";
    const logWhere = targetCompanyId ? "WHERE company_id = $1" : "";
    const [companiesResult, usersResult, dataResult, logsResult] = await Promise.all([
      getPool().query(`SELECT * FROM companies ${companyWhere} ORDER BY id`, companyParams),
      getPool().query(
        `SELECT id, company_id, username, display_name, role, status, last_login_at, created_at FROM users ${userWhere} ORDER BY id`,
        companyParams,
      ),
      getPool().query(
        `SELECT company_id, data_key, data_json, updated_at FROM company_data ${dataWhere} ORDER BY company_id, data_key`,
        companyParams,
      ),
      getPool().query(
        `SELECT id, company_id, user_id, username, event_type, outcome, ip_address, metadata, created_at FROM audit_logs ${logWhere} ORDER BY created_at DESC LIMIT 5000`,
        companyParams,
      ),
    ]);

    return {
      version: 1,
      exportedAt: timestamp(),
      scope: targetCompanyId ? "company" : "database",
      companies: companiesResult.rows.map(mapCompany),
      users: usersResult.rows.map(mapUser),
      companyData: dataResult.rows.map((row) => ({
        companyId: row.company_id,
        key: row.data_key,
        value: row.data_json,
        updatedAt: row.updated_at,
      })),
      auditLogs: logsResult.rows.map(mapAuditLog),
    };
  }

  const database = getStore();
  const matches = (value) => !targetCompanyId || Number(value) === targetCompanyId;
  return {
    version: 1,
    exportedAt: timestamp(),
    scope: targetCompanyId ? "company" : "database",
    companies: database.companies.filter((row) => matches(row.id)).map(mapCompany),
    users: database.users.filter((row) => matches(row.company_id)).map(mapUser),
    companyData: database.companyData
      .filter((row) => matches(row.company_id))
      .map((row) => ({
        companyId: row.company_id,
        key: row.data_key,
        value: row.data_json,
        updatedAt: row.updated_at,
      })),
    auditLogs: database.auditLogs
      .filter((row) => matches(row.company_id))
      .sort(sortNewestFirst)
      .slice(0, 5000)
      .map(mapAuditLog),
  };
}

function mapBillingEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    stripeEventId: row.stripe_event_id ?? row.stripeEventId ?? "",
    companyId: row.company_id ?? row.companyId ?? null,
    eventType: row.event_type ?? row.eventType ?? "",
    status: row.status || "",
    amountTotal: row.amount_total ?? row.amountTotal ?? null,
    currency: row.currency || "",
    invoiceUrl: row.invoice_url ?? row.invoiceUrl ?? "",
    metadata: row.metadata || {},
    createdAt: row.created_at ?? row.createdAt,
  };
}

function mapBackupSnapshot(row) {
  if (!row) return null;
  return {
    id: row.id,
    storageKey: row.storage_key ?? row.storageKey ?? "",
    storageUrl: row.storage_url ?? row.storageUrl ?? "",
    checksum: row.checksum || "",
    byteSize: Number(row.byte_size ?? row.byteSize ?? 0),
    status: row.status || "completed",
    verificationStatus: row.verification_status ?? row.verificationStatus ?? "pending",
    verifiedAt: row.verified_at ?? row.verifiedAt ?? null,
    errorMessage: row.error_message ?? row.errorMessage ?? "",
    metadata: row.metadata || {},
    createdAt: row.created_at ?? row.createdAt,
  };
}

function mapSystemEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    severity: row.severity || "info",
    component: row.component || "app",
    eventType: row.event_type ?? row.eventType ?? "",
    message: row.message || "",
    metadata: row.metadata || {},
    resolvedAt: row.resolved_at ?? row.resolvedAt ?? null,
    createdAt: row.created_at ?? row.createdAt,
  };
}

async function updateCompanyBilling(companyId, values = {}) {
  await ensureInitialized();
  const current = await getCompany(companyId);
  if (!current) return null;
  const next = {
    plan: values.plan ?? current.plan,
    billingStatus: values.billingStatus ?? current.billingStatus,
    accessLimit: normalizeAccessLimit(values.accessLimit ?? current.accessLimit),
    customerId: values.customerId || current.billingCustomerId,
    subscriptionId: values.subscriptionId || current.billingSubscriptionId,
    priceId: values.priceId || current.billingPriceId,
    currentPeriodEnd: values.currentPeriodEnd ?? current.billingCurrentPeriodEnd,
    trialEnd: values.trialEnd ?? current.billingTrialEnd,
    cancelAtPeriodEnd: values.cancelAtPeriodEnd ?? current.billingCancelAtPeriodEnd,
  };

  if (usePostgres) {
    const result = await getPool().query(
      `UPDATE companies SET
        plan = $2, billing_status = $3, access_limit = $4,
        billing_customer_id = $5, billing_subscription_id = $6, billing_price_id = $7,
        billing_current_period_end = $8, billing_trial_end = $9,
        billing_cancel_at_period_end = $10, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        Number(companyId),
        next.plan,
        normalizeBillingStatus(next.billingStatus),
        next.accessLimit,
        next.customerId || "",
        next.subscriptionId || "",
        next.priceId || "",
        next.currentPeriodEnd || null,
        next.trialEnd || null,
        Boolean(next.cancelAtPeriodEnd),
      ],
    );
    return mapCompany(result.rows[0]);
  }

  const row = getStore().companies.find((item) => item.id === Number(companyId));
  if (!row) return null;
  row.plan = next.plan;
  row.billing_status = normalizeBillingStatus(next.billingStatus);
  row.access_limit = next.accessLimit;
  row.billing_customer_id = next.customerId || "";
  row.billing_subscription_id = next.subscriptionId || "";
  row.billing_price_id = next.priceId || "";
  row.billing_current_period_end = next.currentPeriodEnd || null;
  row.billing_trial_end = next.trialEnd || null;
  row.billing_cancel_at_period_end = Boolean(next.cancelAtPeriodEnd);
  row.updated_at = timestamp();
  saveStore();
  return mapCompany(row);
}

async function findCompanyByBillingIdentifiers({ customerId = "", subscriptionId = "" } = {}) {
  await ensureInitialized();
  if (!customerId && !subscriptionId) return null;
  if (usePostgres) {
    const result = await getPool().query(
      `SELECT * FROM companies
       WHERE ($1 <> '' AND billing_customer_id = $1)
          OR ($2 <> '' AND billing_subscription_id = $2)
       LIMIT 1`,
      [customerId, subscriptionId],
    );
    return mapCompany(result.rows[0]);
  }
  const row = getStore().companies.find(
    (item) =>
      (customerId && item.billing_customer_id === customerId) ||
      (subscriptionId && item.billing_subscription_id === subscriptionId),
  );
  return mapCompany(row);
}

async function recordBillingEvent(values = {}) {
  await ensureInitialized();
  const event = {
    stripeEventId: normalizeText(values.stripeEventId),
    companyId: values.companyId ? Number(values.companyId) : null,
    eventType: normalizeText(values.eventType),
    status: normalizeText(values.status),
    amountTotal: Number.isFinite(Number(values.amountTotal)) ? Number(values.amountTotal) : null,
    currency: normalizeText(values.currency).toLowerCase(),
    invoiceUrl: normalizeText(values.invoiceUrl),
    metadata: values.metadata && typeof values.metadata === "object" ? values.metadata : {},
  };
  if (!event.stripeEventId || !event.eventType) return { created: false, event: null };

  if (usePostgres) {
    const result = await getPool().query(
      `INSERT INTO billing_events
        (stripe_event_id, company_id, event_type, status, amount_total, currency, invoice_url, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (stripe_event_id) DO NOTHING RETURNING *`,
      [
        event.stripeEventId,
        event.companyId,
        event.eventType,
        event.status,
        event.amountTotal,
        event.currency,
        event.invoiceUrl,
        JSON.stringify(event.metadata),
      ],
    );
    if (result.rows[0]) return { created: true, event: mapBillingEvent(result.rows[0]) };
    const existing = await getPool().query(
      "SELECT * FROM billing_events WHERE stripe_event_id = $1 LIMIT 1",
      [event.stripeEventId],
    );
    return { created: false, event: mapBillingEvent(existing.rows[0]) };
  }

  const database = getStore();
  const existing = database.billingEvents.find((item) => item.stripe_event_id === event.stripeEventId);
  if (existing) return { created: false, event: mapBillingEvent(existing) };
  const row = {
    id: database.nextBillingEventId++,
    stripe_event_id: event.stripeEventId,
    company_id: event.companyId,
    event_type: event.eventType,
    status: event.status,
    amount_total: event.amountTotal,
    currency: event.currency,
    invoice_url: event.invoiceUrl,
    metadata: event.metadata,
    created_at: timestamp(),
  };
  database.billingEvents.push(row);
  saveStore();
  return { created: true, event: mapBillingEvent(row) };
}

async function listBillingEvents(companyId = null, limit = 50) {
  await ensureInitialized();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  if (usePostgres) {
    const params = companyId ? [Number(companyId), safeLimit] : [safeLimit];
    const result = await getPool().query(
      companyId
        ? "SELECT * FROM billing_events WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2"
        : "SELECT * FROM billing_events ORDER BY created_at DESC LIMIT $1",
      params,
    );
    return result.rows.map(mapBillingEvent);
  }
  return getStore().billingEvents
    .filter((item) => !companyId || Number(item.company_id) === Number(companyId))
    .sort(sortNewestFirst)
    .slice(0, safeLimit)
    .map(mapBillingEvent);
}

async function createBackupSnapshot(values = {}) {
  await ensureInitialized();
  const snapshot = {
    storageKey: normalizeText(values.storageKey),
    storageUrl: normalizeText(values.storageUrl),
    checksum: normalizeText(values.checksum),
    byteSize: Math.max(0, Number(values.byteSize) || 0),
    status: normalizeText(values.status) || "completed",
    verificationStatus: normalizeText(values.verificationStatus) || "pending",
    errorMessage: normalizeText(values.errorMessage),
    metadata: values.metadata && typeof values.metadata === "object" ? values.metadata : {},
  };
  if (usePostgres) {
    const result = await getPool().query(
      `INSERT INTO backup_snapshots
        (storage_key, storage_url, checksum, byte_size, status, verification_status, error_message, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        snapshot.storageKey,
        snapshot.storageUrl,
        snapshot.checksum,
        snapshot.byteSize,
        snapshot.status,
        snapshot.verificationStatus,
        snapshot.errorMessage,
        JSON.stringify(snapshot.metadata),
      ],
    );
    return mapBackupSnapshot(result.rows[0]);
  }
  const database = getStore();
  const row = {
    id: database.nextBackupSnapshotId++,
    storage_key: snapshot.storageKey,
    storage_url: snapshot.storageUrl,
    checksum: snapshot.checksum,
    byte_size: snapshot.byteSize,
    status: snapshot.status,
    verification_status: snapshot.verificationStatus,
    verified_at: null,
    error_message: snapshot.errorMessage,
    metadata: snapshot.metadata,
    created_at: timestamp(),
  };
  database.backupSnapshots.push(row);
  saveStore();
  return mapBackupSnapshot(row);
}

async function updateBackupSnapshot(snapshotId, values = {}) {
  await ensureInitialized();
  if (usePostgres) {
    const result = await getPool().query(
      `UPDATE backup_snapshots SET
        status = COALESCE($2, status),
        verification_status = COALESCE($3, verification_status),
        verified_at = CASE WHEN $3 IS NULL THEN verified_at ELSE NOW() END,
        error_message = COALESCE($4, error_message),
        metadata = COALESCE($5::jsonb, metadata)
       WHERE id = $1 RETURNING *`,
      [
        Number(snapshotId),
        values.status ?? null,
        values.verificationStatus ?? null,
        values.errorMessage ?? null,
        values.metadata ? JSON.stringify(values.metadata) : null,
      ],
    );
    return mapBackupSnapshot(result.rows[0]);
  }
  const row = getStore().backupSnapshots.find((item) => item.id === Number(snapshotId));
  if (!row) return null;
  if (values.status !== undefined) row.status = values.status;
  if (values.verificationStatus !== undefined) {
    row.verification_status = values.verificationStatus;
    row.verified_at = timestamp();
  }
  if (values.errorMessage !== undefined) row.error_message = values.errorMessage;
  if (values.metadata !== undefined) row.metadata = values.metadata;
  saveStore();
  return mapBackupSnapshot(row);
}

async function listBackupSnapshots(limit = 30) {
  await ensureInitialized();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 200));
  if (usePostgres) {
    const result = await getPool().query(
      "SELECT * FROM backup_snapshots ORDER BY created_at DESC LIMIT $1",
      [safeLimit],
    );
    return result.rows.map(mapBackupSnapshot);
  }
  return getStore().backupSnapshots.sort(sortNewestFirst).slice(0, safeLimit).map(mapBackupSnapshot);
}

async function deleteBackupSnapshotRecord(snapshotId) {
  await ensureInitialized();
  if (usePostgres) {
    const result = await getPool().query("DELETE FROM backup_snapshots WHERE id = $1 RETURNING *", [
      Number(snapshotId),
    ]);
    return mapBackupSnapshot(result.rows[0]);
  }
  const database = getStore();
  const index = database.backupSnapshots.findIndex((item) => item.id === Number(snapshotId));
  if (index < 0) return null;
  const [deleted] = database.backupSnapshots.splice(index, 1);
  saveStore();
  return mapBackupSnapshot(deleted);
}

async function recordSystemEvent(values = {}) {
  await ensureInitialized();
  const event = {
    severity: normalizeText(values.severity) || "info",
    component: normalizeText(values.component) || "app",
    eventType: normalizeText(values.eventType) || "unknown",
    message: normalizeText(values.message).slice(0, 2000),
    metadata: values.metadata && typeof values.metadata === "object" ? values.metadata : {},
  };
  if (usePostgres) {
    const result = await getPool().query(
      `INSERT INTO system_events (severity, component, event_type, message, metadata)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [event.severity, event.component, event.eventType, event.message, JSON.stringify(event.metadata)],
    );
    return mapSystemEvent(result.rows[0]);
  }
  const database = getStore();
  const row = {
    id: database.nextSystemEventId++,
    severity: event.severity,
    component: event.component,
    event_type: event.eventType,
    message: event.message,
    metadata: event.metadata,
    resolved_at: null,
    created_at: timestamp(),
  };
  database.systemEvents.push(row);
  if (database.systemEvents.length > 2000) database.systemEvents = database.systemEvents.slice(-2000);
  saveStore();
  return mapSystemEvent(row);
}

async function listSystemEvents(limit = 50) {
  await ensureInitialized();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  if (usePostgres) {
    const result = await getPool().query(
      "SELECT * FROM system_events ORDER BY created_at DESC LIMIT $1",
      [safeLimit],
    );
    return result.rows.map(mapSystemEvent);
  }
  return getStore().systemEvents.sort(sortNewestFirst).slice(0, safeLimit).map(mapSystemEvent);
}

async function checkDatabaseHealth() {
  const startedAt = Date.now();
  await ensureInitialized();
  if (usePostgres) await getPool().query("SELECT 1");
  else getStore();
  return { ok: true, latencyMs: Date.now() - startedAt, mode: usePostgres ? "postgres" : "local" };
}

async function getRecoveryBackupSnapshot() {
  await ensureInitialized();
  if (usePostgres) {
    const [companiesResult, usersResult, dataResult] = await Promise.all([
      getPool().query("SELECT * FROM companies ORDER BY id"),
      getPool().query(
        `SELECT id, company_id, username, display_name, password_hash, role, status,
                session_version, must_change_password, last_login_at, mfa_secret, mfa_enabled, mfa_recovery_codes, created_at
         FROM users ORDER BY id`,
      ),
      getPool().query(
        "SELECT company_id, data_key, data_json, updated_at FROM company_data ORDER BY company_id, data_key",
      ),
    ]);
    return {
      version: 2,
      exportedAt: timestamp(),
      scope: "recovery",
      companies: companiesResult.rows,
      users: usersResult.rows,
      companyData: dataResult.rows,
    };
  }
  const database = getStore();
  return {
    version: 2,
    exportedAt: timestamp(),
    scope: "recovery",
    companies: structuredClone(database.companies),
    users: structuredClone(database.users),
    companyData: structuredClone(database.companyData),
  };
}

async function testRecoveryRestore(snapshot) {
  await ensureInitialized();
  const normalizedSnapshot = JSON.parse(JSON.stringify(snapshot));
  const expectedCounts = {
    companies: normalizedSnapshot.companies.length,
    users: normalizedSnapshot.users.length,
    records: normalizedSnapshot.companyData.length,
  };

  if (!usePostgres) {
    const restoreDir = fs.mkdtempSync(path.join(os.tmpdir(), "sgq-restore-test-"));
    const restorePath = path.join(restoreDir, "restored.json");
    try {
      fs.writeFileSync(restorePath, JSON.stringify(normalizedSnapshot));
      const restored = JSON.parse(fs.readFileSync(restorePath, "utf8"));
      if (!isDeepStrictEqual(restored, normalizedSnapshot)) throw new Error("backup_restore_content_mismatch");
      return { ok: true, mode: "isolated-file", counts: expectedCounts, testedAt: timestamp() };
    } finally {
      fs.rmSync(restoreDir, { recursive: true, force: true });
    }
  }

  const client = await getPool().connect();
  const schema = `restore_test_${crypto.randomBytes(8).toString("hex")}`;
  const qualified = (table) => `"${schema}".${table}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`
      CREATE TABLE ${qualified("companies")} (
        id BIGINT PRIMARY KEY,
        payload JSONB NOT NULL
      );
      CREATE TABLE ${qualified("users")} (
        id BIGINT PRIMARY KEY,
        company_id BIGINT NOT NULL REFERENCES ${qualified("companies")}(id) ON DELETE CASCADE,
        payload JSONB NOT NULL
      );
      CREATE TABLE ${qualified("company_data")} (
        company_id BIGINT NOT NULL REFERENCES ${qualified("companies")}(id) ON DELETE CASCADE,
        data_key TEXT NOT NULL,
        payload JSONB NOT NULL,
        PRIMARY KEY (company_id, data_key)
      );
    `);

    for (const company of normalizedSnapshot.companies) {
      await client.query(`INSERT INTO ${qualified("companies")} (id, payload) VALUES ($1, $2::jsonb)`, [
        Number(company.id),
        JSON.stringify(company),
      ]);
    }
    for (const user of normalizedSnapshot.users) {
      await client.query(
        `INSERT INTO ${qualified("users")} (id, company_id, payload) VALUES ($1, $2, $3::jsonb)`,
        [Number(user.id), Number(user.company_id), JSON.stringify(user)],
      );
    }
    for (const row of normalizedSnapshot.companyData) {
      await client.query(
        `INSERT INTO ${qualified("company_data")} (company_id, data_key, payload) VALUES ($1, $2, $3::jsonb)`,
        [Number(row.company_id), String(row.data_key), JSON.stringify(row)],
      );
    }

    const [companies, users, companyData] = await Promise.all([
      client.query(`SELECT payload FROM ${qualified("companies")} ORDER BY id`),
      client.query(`SELECT payload FROM ${qualified("users")} ORDER BY id`),
      client.query(`SELECT payload FROM ${qualified("company_data")} ORDER BY company_id, data_key`),
    ]);
    const restored = {
      companies: companies.rows.map((row) => row.payload),
      users: users.rows.map((row) => row.payload),
      companyData: companyData.rows.map((row) => row.payload),
    };
    if (
      !isDeepStrictEqual(restored.companies, normalizedSnapshot.companies) ||
      !isDeepStrictEqual(restored.users, normalizedSnapshot.users) ||
      !isDeepStrictEqual(restored.companyData, normalizedSnapshot.companyData)
    ) {
      throw new Error("backup_restore_content_mismatch");
    }
    return { ok: true, mode: "isolated-postgres-schema", counts: expectedCounts, testedAt: timestamp() };
  } finally {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`).catch(() => null);
    client.release();
  }
}

async function getCompanyData(companyId, key) {
  await ensureInitialized();

  if (usePostgres) {
    const result = await getPool().query(
      "SELECT data_json FROM company_data WHERE company_id = $1 AND data_key = $2 LIMIT 1",
      [Number(companyId), key],
    );
    return result.rows[0]?.data_json ?? null;
  }

  const row = getStore().companyData.find(
    (item) => item.company_id === Number(companyId) && item.data_key === key,
  );
  return row?.data_json ?? null;
}

async function listSGQHealthData(companyId) {
  await ensureInitialized();
  const result = usePostgres ? (await getPool().query(
    "SELECT data_key, data_json, updated_at FROM company_data WHERE company_id = $1 AND (data_key = ANY($2) OR data_key LIKE $3)",
    [Number(companyId), HEALTH_SOURCES, `${HEALTH_PREFIX}%`],
  )).rows : getStore().companyData.filter((row) => row.company_id === Number(companyId) && (HEALTH_SOURCES.includes(row.data_key) || row.data_key.startsWith(HEALTH_PREFIX)));
  return result.map((row) => ({ key: row.data_key, value: row.data_json, updatedAt: row.updated_at }));
}

function setLocalHealthObservation(database, companyId, observation) {
  if (!observation) return;
  let row = database.companyData.find((item) => item.company_id === Number(companyId) && item.data_key === observation.key);
  if (!row) { row = { company_id: Number(companyId), data_key: observation.key }; database.companyData.push(row); }
  Object.assign(row, { data_json: observation.value, updated_at: observation.value.recordedAt });
}

// Serializes portal responses and internal state saves for the same company.
async function mutateSupplierData(companyId, mutate) {
  await ensureInitialized();
  const keys = ["state", "supplierRncPrivate"];
  if (usePostgres) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const company = await client.query("SELECT id FROM companies WHERE id = $1 FOR UPDATE", [Number(companyId)]);
      if (!company.rowCount) throw new Error("company_not_found");
      const rows = await client.query("SELECT data_key, data_json FROM company_data WHERE company_id = $1 AND data_key = ANY($2)", [Number(companyId), keys]);
      const data = Object.fromEntries(rows.rows.map((row) => [row.data_key, row.data_json]));
      const result = mutate(data);
      for (const key of keys) {
        if (!Object.hasOwn(data, key)) continue;
        await client.query("INSERT INTO company_data (company_id, data_key, data_json) VALUES ($1, $2, $3) ON CONFLICT (company_id, data_key) DO UPDATE SET data_json = EXCLUDED.data_json, updated_at = NOW()", [Number(companyId), key, JSON.stringify(data[key])]);
      }
      const observation = healthObservation("state", data.state);
      if (observation) await client.query("INSERT INTO company_data (company_id, data_key, data_json) VALUES ($1, $2, $3) ON CONFLICT (company_id, data_key) DO UPDATE SET data_json = EXCLUDED.data_json, updated_at = NOW()", [Number(companyId), observation.key, JSON.stringify(observation.value)]);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  const database = getStore();
  const data = Object.fromEntries(database.companyData.filter((row) => row.company_id === Number(companyId) && keys.includes(row.data_key)).map((row) => [row.data_key, structuredClone(row.data_json)]));
  const result = mutate(data);
  for (const key of keys) {
    if (!Object.hasOwn(data, key)) continue;
    let row = database.companyData.find((item) => item.company_id === Number(companyId) && item.data_key === key);
    if (!row) { row = { company_id: Number(companyId), data_key: key }; database.companyData.push(row); }
    Object.assign(row, { data_json: data[key], updated_at: timestamp() });
  }
  setLocalHealthObservation(database, companyId, healthObservation("state", data.state));
  saveStore();
  return result;
}

async function setCompanyData(companyId, key, value) {
  await ensureInitialized();
  if (key === "state") {
    return mutateSupplierData(companyId, (data) => {
      data.state = value;
    });
  }

  if (usePostgres) {
    const observation = healthObservation(key, value);
    await getPool().query(
      `
        INSERT INTO company_data (company_id, data_key, data_json, updated_at)
        SELECT $1::integer, $2::text, $3::jsonb, NOW()
        UNION ALL SELECT $1::integer, $4::text, $5::jsonb, NOW() WHERE $4::text IS NOT NULL
        ON CONFLICT (company_id, data_key) DO UPDATE SET
          data_json = EXCLUDED.data_json,
          updated_at = NOW()
      `,
      [Number(companyId), key, JSON.stringify(value ?? null), observation?.key || null, JSON.stringify(observation?.value || null)],
    );
    return;
  }

  const database = getStore();
  let row = database.companyData.find(
    (item) => item.company_id === Number(companyId) && item.data_key === key,
  );

  if (!row) {
    row = { company_id: Number(companyId), data_key: key, data_json: value, updated_at: timestamp() };
    database.companyData.push(row);
  } else {
    row.data_json = value;
    row.updated_at = timestamp();
  }

  setLocalHealthObservation(database, companyId, healthObservation(key, value));
  saveStore();
}

module.exports = {
  listSGQHealthData,
  mutateSupplierData,
  canAddCompanyUser,
  checkDatabaseHealth,
  countRecentFailedLogins,
  countRecentMfaFailures,
  countRecentPasswordResetRequests,
  consumeInvitationToken,
  consumeMfaRecoveryCode,
  createPasswordResetToken,
  createInvitationToken,
  createCompany,
  createBackupSnapshot,
  createUser,
  deleteCompanyUser,
  deleteBackupSnapshotRecord,
  ensureDefaultCompany,
  ensureCompany,
  ensureInitialized,
  findUser,
  findCompanyByBillingIdentifiers,
  findUserByUsername,
  getCompany,
  getCompanyData,
  getInvitationByToken,
  getUserSecurity,
  getBackupSnapshot,
  getRecoveryBackupSnapshot,
  testRecoveryRestore,
  getUser,
  listCompanyData,
  listCompanyUsers,
  listBackupSnapshots,
  listBillingEvents,
  listNotificationTargets,
  listAdminOverview,
  listUserSessions,
  listSystemEvents,
  recordBillingEvent,
  recordSystemEvent,
  recordAuditLog,
  registerUserSession,
  revokeOtherUserSessions,
  revokeUserSession,
  consumePasswordResetToken,
  resetUserPassword,
  setCompanyData,
  setUserMfa,
  syncConfiguredUsers,
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
  hasRecentCompanyEvent,
};
