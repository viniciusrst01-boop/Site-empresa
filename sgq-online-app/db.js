const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

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
      companies: [],
      users: [],
      companyData: [],
      auditLogs: [],
    };
    saveStore();
  }

  store.nextAuditLogId = Number(store.nextAuditLogId) || 1;
  store.auditLogs = Array.isArray(store.auditLogs) ? store.auditLogs : [];
  store.companies = Array.isArray(store.companies) ? store.companies : [];
  store.users = Array.isArray(store.users) ? store.users : [];
  store.companyData = Array.isArray(store.companyData) ? store.companyData : [];
  store.companies.forEach((company) => {
    company.billing_status = company.billing_status || "Ativo";
    company.access_limit = normalizeAccessLimit(company.access_limit);
    company.updated_at = company.updated_at || company.created_at || timestamp();
  });
  store.users.forEach((user) => {
    user.session_version = Number(user.session_version || 1);
    user.last_login_at = user.last_login_at || null;
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
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

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
    lastLoginAt: row.last_login_at ?? row.lastLoginAt ?? null,
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
  };
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

  return getStore().companies.find((company) => company.id === Number(companyId)) || null;
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
        INSERT INTO users (company_id, username, display_name, password_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, $6)
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
      status: user.status,
      session_version: 1,
      last_login_at: null,
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

async function resetUserPassword(userId, temporaryPassword) {
  await ensureInitialized();
  const passwordHash = hashPassword(temporaryPassword);

  if (usePostgres) {
    const result = await getPool().query(
      "UPDATE users SET password_hash = $2, session_version = session_version + 1 WHERE id = $1 RETURNING *",
      [Number(userId), passwordHash],
    );
    return mapUser(result.rows[0]);
  }

  const database = getStore();
  const user = database.users.find((item) => item.id === Number(userId));
  if (!user) return null;

  user.password_hash = passwordHash;
  user.session_version = Number(user.session_version || 1) + 1;
  saveStore();
  return getUser(userId);
}

async function validateSessionUser(userId, companyId, sessionVersion) {
  const user = await getUser(userId);
  if (!user || user.status !== "Ativo") return null;
  if (Number(user.companyId) !== Number(companyId)) return null;
  if (Number(user.sessionVersion || 1) !== Number(sessionVersion || 1)) return null;
  return user;
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

async function setCompanyData(companyId, key, value) {
  await ensureInitialized();

  if (usePostgres) {
    await getPool().query(
      `
        INSERT INTO company_data (company_id, data_key, data_json, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (company_id, data_key) DO UPDATE SET
          data_json = EXCLUDED.data_json,
          updated_at = NOW()
      `,
      [Number(companyId), key, JSON.stringify(value ?? null)],
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

  saveStore();
}

module.exports = {
  canAddCompanyUser,
  countRecentFailedLogins,
  createCompany,
  createUser,
  deleteCompanyUser,
  ensureDefaultCompany,
  ensureCompany,
  ensureInitialized,
  findUser,
  getCompany,
  getCompanyData,
  getBackupSnapshot,
  getUser,
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
};
