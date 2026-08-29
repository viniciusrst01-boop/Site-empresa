const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dataDir = path.join(__dirname, "data");

const defaultCompany = {
  name: "QualityPro Solutions LTDA",
  cnpj: "00.000.000/0001-00",
  scope: "Consultoria, implantação e suporte em Sistemas de Gestão da Qualidade.",
  certification: "ISO 9001:2015",
  plan: "Plano Professional",
};

let db;

function getDb() {
  if (db) return db;
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = process.env.SGQ_DB_PATH || path.join(dataDir, "sgq-local.sqlite");
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrate();
  return db;
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cnpj TEXT NOT NULL DEFAULT '',
      scope TEXT NOT NULL DEFAULT '',
      certification TEXT NOT NULL DEFAULT '',
      plan TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Administrador',
      status TEXT NOT NULL DEFAULT 'Ativo',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS company_data (
      company_id INTEGER NOT NULL,
      data_key TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (company_id, data_key),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
  `);
}

function ensureDefaultCompany() {
  return ensureCompany(defaultCompany.name);
}

function ensureCompany(companyName) {
  const database = getDb();
  const name = companyName || defaultCompany.name;
  let company = database.prepare("SELECT * FROM companies WHERE name = ? ORDER BY id LIMIT 1").get(name);
  if (company) return company;

  const result = database.prepare(`
    INSERT INTO companies (name, cnpj, scope, certification, plan)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    name,
    defaultCompany.cnpj,
    defaultCompany.scope,
    defaultCompany.certification,
    defaultCompany.plan,
  );

  return database.prepare("SELECT * FROM companies WHERE id = ?").get(result.lastInsertRowid);
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
  const database = getDb();

  logins.forEach((login) => {
    if (!login?.user || !login?.password) return;
    const company = ensureCompany(login.companyName || `${displayNameFromUsername(login.user)} LTDA`);
    const existing = database.prepare("SELECT id FROM users WHERE username = ?").get(login.user);
    if (existing) {
      database.prepare("UPDATE users SET password_hash = ?, company_id = ? WHERE id = ?").run(
        hashPassword(login.password),
        company.id,
        existing.id,
      );
      return;
    }

    database.prepare(`
      INSERT INTO users (company_id, username, display_name, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(company.id, login.user, displayNameFromUsername(login.user), hashPassword(login.password));
  });
}

function findUser(username, password) {
  const database = getDb();
  const user = database.prepare(`
    SELECT users.*, companies.name AS company_name
    FROM users
    JOIN companies ON companies.id = users.company_id
    WHERE users.username = ? AND users.status = 'Ativo'
  `).get(username);

  if (!user || !verifyPassword(password, user.password_hash)) return null;

  return {
    id: user.id,
    companyId: user.company_id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    companyName: user.company_name,
  };
}

function getCompany(companyId) {
  return getDb().prepare("SELECT * FROM companies WHERE id = ?").get(companyId);
}

function getUser(userId) {
  const user = getDb()
    .prepare("SELECT id, company_id, username, display_name, role, status FROM users WHERE id = ?")
    .get(userId);

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
  getDb().prepare(`
    UPDATE companies
    SET name = ?, cnpj = ?, scope = ?, certification = ?, plan = ?
    WHERE id = ?
  `).run(
    values.name || "",
    values.cnpj || "",
    values.scope || "",
    values.certification || "",
    values.plan || "",
    companyId,
  );

  return getCompany(companyId);
}

function updateUserProfile(userId, values) {
  getDb().prepare(`
    UPDATE users
    SET display_name = ?, role = ?
    WHERE id = ?
  `).run(values.displayName || "", values.role || "Administrador", userId);

  return getUser(userId);
}

function getCompanyData(companyId, key) {
  const row = getDb()
    .prepare("SELECT data_json FROM company_data WHERE company_id = ? AND data_key = ?")
    .get(companyId, key);

  if (!row) return null;
  try {
    return JSON.parse(row.data_json);
  } catch {
    return null;
  }
}

function setCompanyData(companyId, key, value) {
  getDb().prepare(`
    INSERT INTO company_data (company_id, data_key, data_json, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(company_id, data_key)
    DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP
  `).run(companyId, key, JSON.stringify(value));
}

module.exports = {
  ensureDefaultCompany,
  ensureCompany,
  findUser,
  getCompany,
  getCompanyData,
  getUser,
  setCompanyData,
  syncConfiguredUsers,
  updateCompany,
  updateUserProfile,
};
