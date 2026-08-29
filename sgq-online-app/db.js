const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = process.env.SGQ_DATA_DIR ||
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

function timestamp() {
  return new Date().toISOString();
}

function ensureDefaultCompany() {
  return ensureCompany(defaultCompany.name);
}

function ensureCompany(companyName) {
  const database = getStore();
  const name = companyName || defaultCompany.name;
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
  return String(username || "")
    .split(/[.@_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Usuário";
}

function syncConfiguredUsers(logins) {
  const database = getStore();

  logins.forEach((login) => {
    if (!login?.user || !login?.password) return;
    const company = ensureCompany(login.companyName || `${displayNameFromUsername(login.user)} LTDA`);
    const existing = database.users.find((user) => user.username === login.user);

    if (existing) {
      existing.password_hash = hashPassword(login.password);
      existing.company_id = company.id;
      saveStore();
      return;
    }

    database.users.push({
      id: database.nextUserId++,
      company_id: company.id,
      username: login.user,
      display_name: displayNameFromUsername(login.user),
      password_hash: hashPassword(login.password),
      role: "Administrador",
      status: "Ativo",
      created_at: timestamp(),
    });
    saveStore();
  });
}

function findUser(username, password) {
  const database = getStore();
  const user = database.users.find((item) => item.username === username && item.status === "Ativo");
  if (!user || !verifyPassword(password, user.password_hash)) return null;

  const company = getCompany(user.company_id);
  return {
    id: user.id,
    companyId: user.company_id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    companyName: company?.name || "",
  };
}

function getCompany(companyId) {
  return getStore().companies.find((company) => company.id === Number(companyId)) || null;
}

function getUser(userId) {
  const user = getStore().users.find((item) => item.id === Number(userId));
  if (!user) return null;

  return {
    id: user.id,
    companyId: user.company_id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    status: user.status,
  };
}

function updateCompany(companyId, values) {
  const company = getCompany(companyId);
  if (!company) return null;

  company.name = values.name || "";
  company.cnpj = values.cnpj || "";
  company.scope = values.scope || "";
  company.certification = values.certification || "";
  company.plan = values.plan || "";
  saveStore();
  return company;
}

function updateUserProfile(userId, values) {
  const database = getStore();
  const user = database.users.find((item) => item.id === Number(userId));
  if (!user) return null;

  user.display_name = values.displayName || "";
  user.role = values.role || "Administrador";
  saveStore();
  return getUser(userId);
}

function listAdminOverview() {
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
      const company = getCompany(user.company_id);
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

function resetUserPassword(userId, temporaryPassword) {
  const database = getStore();
  const user = database.users.find((item) => item.id === Number(userId));
  if (!user) return null;

  user.password_hash = hashPassword(temporaryPassword);
  saveStore();
  return getUser(userId);
}

function getCompanyData(companyId, key) {
  const row = getStore().companyData.find(
    (item) => item.company_id === Number(companyId) && item.data_key === key,
  );
  return row?.data_json ?? null;
}

function setCompanyData(companyId, key, value) {
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
