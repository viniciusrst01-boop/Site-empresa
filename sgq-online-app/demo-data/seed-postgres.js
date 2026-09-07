const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { buildScenario, SEED } = require('./scenario');

const tables = ['companies', 'users', 'company_data'];
const companyColumns = ['id', 'name', 'cnpj', 'scope', 'certification', 'plan', 'billing_status', 'access_limit', 'created_at', 'updated_at', 'billing_customer_id', 'billing_subscription_id', 'billing_price_id', 'billing_current_period_end', 'billing_trial_end', 'billing_cancel_at_period_end'];
const userRestoreColumns = ['company_id', 'role'];

function parseArgs(args) {
  const option = name => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1]; };
  return { apply: args.includes('--apply'), confirmed: args.includes('--production-confirmed'), date: option('--date'), restore: option('--restore') };
}

function connectionString() {
  return process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || '';
}

function cipherKey() {
  const secret = process.env.BACKUP_ENCRYPTION_KEY;
  if (!secret || secret === '[SENSITIVE]') throw new Error('BACKUP_ENCRYPTION_KEY indisponível');
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', cipherKey(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return JSON.stringify({ version: 1, algorithm: 'aes-256-gcm', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), body: body.toString('base64') });
}

function decrypt(text) {
  const value = JSON.parse(text);
  const decipher = crypto.createDecipheriv('aes-256-gcm', cipherKey(), Buffer.from(value.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.body, 'base64')), decipher.final()]).toString('utf8'));
}

function backupPath() {
  const dir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `online-demo-backup-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.json.enc`);
}

async function snapshot(client) {
  const companies = await client.query('SELECT * FROM companies ORDER BY id');
  const users = await client.query('SELECT id, company_id, username, display_name, role, status FROM users ORDER BY id');
  const companyData = await client.query('SELECT company_id, data_key, data_json, updated_at FROM company_data ORDER BY company_id, data_key');
  return { version: 1, seed: SEED, capturedAt: new Date().toISOString(), companies: companies.rows, users: users.rows, companyData: companyData.rows };
}

function priorValue(source, companyId, key) {
  return source.companyData.find(row => Number(row.company_id) === Number(companyId) && row.data_key === key)?.data_json;
}

function scenarioRows(scenario, companyId, source = { companyData: [] }) {
  const now = `${scenario.period.to}T18:00:00.000Z`;
  const settings = {};
  for (const user of scenario.operational) {
    const previous = priorValue(source, user.company_id, 'userSettings');
    if (previous?.[user.id]) settings[user.id] = structuredClone(previous[user.id]);
  }
  settings._companyOwnerId = scenario.hugo.id;
  const theme = priorValue(source, companyId, 'state')?.settings?.theme;
  if (theme) scenario.state.settings.theme = theme;
  const values = { state: scenario.state, context: scenario.context, risk: scenario.risk, leadership: scenario.leadership, userSettings: settings, supplierRncPrivate: { entries: [] }, demoSeed: { id: SEED, period: scenario.period } };
  const rows = Object.entries(values).map(([key, value]) => ({ companyId, key, value, updatedAt: now }));
  rows.push(...scenario.observations.map(item => ({ companyId, key: item.key, value: item.value, updatedAt: item.value.recordedAt })));
  return rows;
}

async function upsertCompany(client, companyId, company, operationalCount) {
  await client.query(`INSERT INTO companies
    (id, name, cnpj, scope, certification, plan, billing_status, access_limit, billing_customer_id, billing_subscription_id, billing_price_id, billing_cancel_at_period_end)
    VALUES ($1,$2,$3,$4,$5,'Plano Professional','Teste',$6,'','','',FALSE)
    ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, cnpj=EXCLUDED.cnpj, scope=EXCLUDED.scope,
      certification=EXCLUDED.certification, plan=EXCLUDED.plan, billing_status=EXCLUDED.billing_status,
      access_limit=EXCLUDED.access_limit, billing_customer_id='', billing_subscription_id='', billing_price_id='',
      billing_current_period_end=NULL, billing_trial_end=NULL, billing_cancel_at_period_end=FALSE, updated_at=NOW()`,
    [companyId, company.name, company.cnpj, company.scope, company.certification, Math.max(5, operationalCount)]);
}

async function applyScenario(client, source, date) {
  const scenario = buildScenario(source.users, date);
  const companyId = Number(scenario.hugo.company_id || source.companies[0]?.id);
  if (!companyId) throw new Error('Não foi possível determinar o ID da empresa operacional');
  await client.query('ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL');
  await client.query('ALTER TABLE user_sessions ALTER COLUMN company_id DROP NOT NULL');
  await upsertCompany(client, companyId, scenario.company, scenario.operational.length);
  await client.query('DELETE FROM user_sessions');
  await client.query('UPDATE users SET company_id = CASE WHEN lower(username)=lower($1) THEN NULL ELSE $2 END, role = CASE WHEN lower(username)=lower($3) THEN $4 ELSE role END', ['viniciusrst', companyId, 'hugo.melo', 'Administrador']);
  await client.query('DELETE FROM company_data');
  for (const row of scenarioRows(scenario, companyId, source)) {
    await client.query('INSERT INTO company_data (company_id, data_key, data_json, updated_at) VALUES ($1,$2,$3::jsonb,$4)', [row.companyId, row.key, JSON.stringify(row.value), row.updatedAt]);
  }
  await client.query('DELETE FROM companies WHERE id <> $1', [companyId]);
  await client.query("SELECT setval(pg_get_serial_sequence('companies','id'), GREATEST((SELECT MAX(id) FROM companies), 1), true)");
  const result = await snapshot(client);
  return { scenario, companyId, result };
}

async function restoreSnapshot(client, backup) {
  const current = await snapshot(client);
  assert.deepEqual(current.users.map(user => Number(user.id)).sort((a, b) => a - b), backup.users.map(user => Number(user.id)).sort((a, b) => a - b), 'IDs de usuários mudaram; restauração recusada');
  await client.query('ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL');
  await client.query('ALTER TABLE user_sessions ALTER COLUMN company_id DROP NOT NULL');
  await client.query('DELETE FROM user_sessions');
  for (const company of backup.companies) {
    const columns = companyColumns.filter(column => Object.hasOwn(company, column));
    const params = columns.map((_, index) => `$${index + 1}`).join(',');
    const updates = columns.filter(column => column !== 'id').map(column => `${column}=EXCLUDED.${column}`).join(',');
    await client.query(`INSERT INTO companies (${columns.join(',')}) VALUES (${params}) ON CONFLICT (id) DO UPDATE SET ${updates}`, columns.map(column => company[column]));
  }
  for (const user of backup.users) {
    await client.query(`UPDATE users SET ${userRestoreColumns.map((column, index) => `${column}=$${index + 2}`).join(',')} WHERE id=$1`, [user.id, ...userRestoreColumns.map(column => user[column])]);
  }
  await client.query('DELETE FROM company_data');
  for (const row of backup.companyData) await client.query('INSERT INTO company_data (company_id,data_key,data_json,updated_at) VALUES ($1,$2,$3::jsonb,$4)', [row.company_id, row.data_key, JSON.stringify(row.data_json), row.updated_at]);
  await client.query('DELETE FROM companies WHERE id <> ALL($1::int[])', [backup.companies.map(company => Number(company.id))]);
  await client.query("SELECT setval(pg_get_serial_sequence('companies','id'), GREATEST((SELECT MAX(id) FROM companies), 1), true)");
  return snapshot(client);
}

async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (!connectionString() || connectionString().includes('[SENSITIVE]')) throw new Error('Conexão PostgreSQL online indisponível');
  if ((options.apply || options.restore) && !options.confirmed) throw new Error('Aplicação/restauração exige --production-confirmed');
  const pool = new Pool({ connectionString: connectionString(), ssl: /localhost|127\.0\.0\.1/.test(connectionString()) ? false : { rejectUnauthorized: false }, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('quality-pro-demo-seed'))");
    const source = await snapshot(client);
    if (!options.apply && !options.restore) {
      const scenario = buildScenario(source.users, options.date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }));
      await client.query('ROLLBACK');
      console.log(JSON.stringify({ applied: false, online: true, companiesBefore: source.companies.length, usersPreserved: source.users.length, companyId: scenario.hugo.company_id, period: scenario.period, records: { companyData: scenarioRows(scenario, scenario.hugo.company_id).length, ncs: scenario.state.ncs.length, risks: scenario.risk.riscos.length, climate: scenario.state.climate.issues.length } }, null, 2));
      return;
    }
    const file = backupPath();
    fs.writeFileSync(file, encrypt(source), { flag: 'wx', mode: 0o600 });
    let report;
    if (options.restore) {
      const restored = await restoreSnapshot(client, decrypt(fs.readFileSync(path.resolve(options.restore), 'utf8')));
      report = { restored: true, companies: restored.companies.length, users: restored.users.length, companyData: restored.companyData.length };
    } else {
      const applied = await applyScenario(client, source, options.date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }));
      const marker = applied.result.companyData.find(row => row.data_key === 'demoSeed');
      assert.equal(marker?.data_json?.id, SEED);
      report = { applied: true, online: true, companyId: applied.companyId, companies: applied.result.companies.length, users: applied.result.users.length, companyData: applied.result.companyData.length, period: applied.scenario.period, backup: file };
    }
    await client.query('COMMIT');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => null);
    throw error;
  } finally {
    client.release(); await pool.end();
  }
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { encrypt, decrypt, scenarioRows };
