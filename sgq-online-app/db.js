const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const databaseUrl = process.env.DATABASE_URL || "";
const usePostgres = Boolean(databaseUrl);
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
      companies: [],
      users: [],
      companyData: [],
    };
    saveStore();
  }

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
    created_at: row.created_at,
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
        INSERT INTO companies (name, cnpj, scope, certification, plan)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING *
      `,
      [
        name,
        defaultCompany.cnpj,
        defaultCompany.scope,
        defaultCompany.certification,
        defaultCompany.plan,
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
    created_at: timestamp(),
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
          ON CONFLICT (username) DO UPDATE SET
            company_id = EXCLUDED.company_id,
            password_hash = EXCLUDED.password_hash,
            status = 'Ativo'
        `,
        [company.id, login.user, displayNameFromUsername(login.user), passwordHash],
      );
      continue;
    }

    const database = getStore();
    const existing = database.users.find((user) => user.username === login.user);

    if (existing) {
      existing.password_hash = passwordHash;
      existing.company_id = company.id;
      saveStore();
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

    const company = await getCompany(row.company_id);
    return {
      id: row.id,
      companyId: row.company_id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
      companyName: company?.name || "",
    };
  }

  const database = getStore();
  const user = database.users.find(
    (item) => item.username.toLowerCase() === String(username).toLowerCase() && item.status === "Ativo",
  );
  if (!user || !verifyPassword(password, user.password_hash)) return null;

  const company = await getCompany(user.company_id);
  return {
    id: user.id,
    companyId: user.company_id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    companyName: company?.name || "",
  };
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

  if (usePostgres) {
    const result = await getPool().query(
      `
        UPDATE companies
        SET name = $2, cnpj = $3, scope = $4, certification = $5, plan = $6
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
      ],
    );
    return mapCompany(result.rows[0]);
  }

  const company = await getCompany(companyId);
  if (!company) return null;

  company.name = values.name || "";
  company.cnpj = values.cnpj || "";
  company.scope = values.scope || "";
  company.certification = values.certification || "";
  company.plan = values.plan || "";
  saveStore();
  return company;
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

async function listAdminOverview() {
  await ensureInitialized();

  if (usePostgres) {
    const companiesResult = await getPool().query(`
      SELECT
        c.*,
        COUNT(u.id)::int AS access_count,
        COUNT(u.id) FILTER (WHERE u.status = 'Ativo')::int AS active_access_count
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
        u.created_at,
        c.name AS company_name,
        c.plan AS company_plan
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      ORDER BY u.created_at DESC, u.id DESC
    `);

    const companies = companiesResult.rows.map((row) => ({
      ...mapCompany(row),
      access_count: row.access_count,
      active_access_count: row.active_access_count,
    }));
    const users = usersResult.rows.map((row) => ({
      id: row.id,
      companyId: row.company_id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      companyName: row.company_name || "",
      companyPlan: row.company_plan || "",
    }));
    const payingCompanies = companies.filter((company) => isPaidPlan(company.plan));

    return {
      summary: {
        companies: companies.length,
        payingCompanies: payingCompanies.length,
        accesses: users.length,
        activeAccesses: users.filter((user) => user.status === "Ativo").length,
      },
      companies,
      users,
    };
  }

  const database = getStore();
  const companies = database.companies
    .map((company) => {
      const users = database.users.filter((user) => user.company_id === company.id);
      return {
        ...company,
        access_count: users.length,
        active_access_count: users.filter((user) => user.status === "Ativo").length,
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
        createdAt: user.created_at,
        companyName: company?.name || "",
        companyPlan: company?.plan || "",
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.id - a.id);

  const payingCompanies = companies.filter((company) => isPaidPlan(company.plan));

  return {
    summary: {
      companies: companies.length,
      payingCompanies: payingCompanies.length,
      accesses: users.length,
      activeAccesses: users.filter((user) => user.status === "Ativo").length,
    },
    companies,
    users,
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
      "UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING *",
      [Number(userId), passwordHash],
    );
    return mapUser(result.rows[0]);
  }

  const database = getStore();
  const user = database.users.find((item) => item.id === Number(userId));
  if (!user) return null;

  user.password_hash = passwordHash;
  saveStore();
  return getUser(userId);
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
  ensureDefaultCompany,
  ensureCompany,
  ensureInitialized,
  findUser,
  getCompany,
  getCompanyData,
  getUser,
  listAdminOverview,
  resetUserPassword,
  setCompanyData,
  syncConfiguredUsers,
  updateCompany,
  updateUserProfile,
};
