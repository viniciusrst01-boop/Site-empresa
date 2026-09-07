const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { buildScenario, SEED } = require('./scenario');

function prepareStore(original, today) {
  const database = structuredClone(original);
  const scenario = buildScenario(database.users, today);
  const companyId = scenario.hugo.company_id || Math.max(0, ...database.companies.map(c => c.id)) + 1;
  const settings = {};
  for (const user of scenario.operational) {
    const prior = database.companyData.find(r => r.company_id === user.company_id && r.data_key === 'userSettings');
    if (prior?.data_json?.[user.id]) settings[user.id] = structuredClone(prior.data_json[user.id]);
  }
  settings._companyOwnerId = scenario.hugo.id;
  const timestamp = `${today}T18:00:00.000Z`;
  const previousCompany = database.companies.find(c => c.id === companyId);
  // Authentication/security fields are copied verbatim, never reconstructed.
  database.users.forEach(user => {
    user.company_id = user.id === scenario.admin.id ? null : companyId;
    if (user.id === scenario.hugo.id) user.role = 'Administrador';
  });
  const previousTheme = database.companyData.find(r => r.company_id === companyId && r.data_key === 'state')?.data_json?.settings?.theme;
  if (previousTheme) scenario.state.settings.theme = previousTheme;
  database.companies = [{ id: companyId, name: scenario.company.name, cnpj: scenario.company.cnpj, scope: scenario.company.scope, certification: scenario.company.certification, plan: 'Plano Professional', billing_status: 'Teste', access_limit: Math.max(5, scenario.operational.length), created_at: previousCompany?.created_at || timestamp, updated_at: timestamp, billing_customer_id: '', billing_subscription_id: '', billing_price_id: '', billing_current_period_end: null, billing_trial_end: null, billing_cancel_at_period_end: false }];
  database.companyData = Object.entries({ state: scenario.state, context: scenario.context, risk: scenario.risk, leadership: scenario.leadership, userSettings: settings, supplierRncPrivate: { entries: [] }, demoSeed: { id: SEED, period: scenario.period } }).map(([key, value]) => ({ company_id: companyId, data_key: key, data_json: value, updated_at: timestamp }));
  database.companyData.push(...scenario.observations.map(o => ({ company_id: companyId, data_key: o.key, data_json: o.value, updated_at: o.value.recordedAt })));
  // Old tenant sessions must be replaced by a fresh login, not silently transferred.
  database.userSessions = [];
  for (const collection of ['auditLogs', 'systemEvents']) {
    for (const row of database[collection] || []) if (row.company_id && row.company_id !== companyId) row.company_id = null;
  }
  database.billingEvents = [];
  database.nextCompanyId = Math.max(database.nextCompanyId || 1, companyId + 1);
  for (const before of original.users) {
    const after = database.users.find(user => user.id === before.id);
    const { company_id: c1, role: r1, ...protectedBefore } = before;
    const { company_id: c2, role: r2, ...protectedAfter } = after;
    assert.deepEqual(protectedAfter, protectedBefore);
    if (before.id !== scenario.hugo.id) assert.equal(r1, r2);
  }
  assert.equal(database.users.length, original.users.length);
  assert.equal(new Set(database.companyData.map(r => `${r.company_id}:${r.data_key}`)).size, database.companyData.length);
  const counts = Object.fromEntries(['companies', 'users', 'companyData', 'userSessions', 'billingEvents'].map(key => [key, database[key].length]));
  const records = { ...Object.fromEntries(Object.entries(scenario.company.registry).map(([k, v]) => [k, v.length])), ...Object.fromEntries(Object.entries(scenario.context).map(([k, v]) => [k, Array.isArray(v) ? v.length : 1])), ...Object.fromEntries(Object.entries(scenario.risk).map(([k, v]) => [k, v.length])), ...Object.fromEntries(Object.entries(scenario.leadership).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [`leadership.${k}`, Array.isArray(v) ? v.length : 1])), ncs: scenario.state.ncs.length, actions: scenario.state.ncs.reduce((sum, nc) => sum + nc.acoes.length, 0), climate: scenario.state.climate.issues.length, healthObservations: scenario.observations.length };
  return { database, report: { seed: SEED, companyId, globalAdminId: scenario.admin.id, companyAdminId: scenario.hugo.id, period: scenario.period, counts, records, users: database.users.map(u => ({ id: u.id, username: u.username, companyId: u.company_id, role: u.role, status: u.status })) } };
}

function main(args = process.argv.slice(2)) {
  const option = name => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1]; };
  const allowed = new Set(['--database', '--date', '--apply', '--offline', '--restore']);
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error(`Argumento desconhecido: ${args[i]}`);
    if (['--database', '--date', '--restore'].includes(args[i])) i++;
  }
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) throw new Error('Seed bloqueado em produção/serverless');
  if (process.env.SGQ_DATABASE_MODE !== 'local' || !option('--database')) throw new Error('Exija SGQ_DATABASE_MODE=local e --database com o caminho do JSON local. PostgreSQL não é alterado por este comando.');
  const file = path.resolve(option('--database'));
  if (!fs.existsSync(file)) throw new Error('Banco existente obrigatório; este seed não cria usuários');
  const raw = fs.readFileSync(file);
  const original = JSON.parse(raw);
  let result;
  const restore = option('--restore');
  if (restore) {
    const backup = path.resolve(restore);
    if (path.dirname(backup) !== path.dirname(file) || !path.basename(backup).startsWith('demo-backup-')) throw new Error('Restauração exige backup demo-backup-* no mesmo diretório do banco');
    result = { database: JSON.parse(fs.readFileSync(backup)), report: { restore: backup } };
    assert.deepEqual(result.database.users.map(u => u.id).sort(), original.users.map(u => u.id).sort(), 'Usuários mudaram desde o backup; restauração automática recusada');
    result.database.users = original.users.map(user => {
      const previous = result.database.users.find(row => row.id === user.id);
      return { ...user, company_id: previous.company_id, role: previous.role };
    });
    result.database.userSessions = [];
    result.database.passwordResetTokens = original.passwordResetTokens;
    result.database.invitationTokens = original.invitationTokens;
  } else result = prepareStore(original, option('--date') || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }));
  if (args.includes('--apply')) {
    if (!args.includes('--offline')) throw new Error('Pare o servidor e confirme --offline antes de aplicar');
    const lock = `${file}.seed.lock`;
    const fd = fs.openSync(lock, 'wx');
    try {
      assert.deepEqual(fs.readFileSync(file), raw, 'Banco alterado durante a preparação; tente novamente com o servidor parado');
      const backup = path.join(path.dirname(file), `demo-backup-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.json`);
      fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
      const temp = `${file}.seed-tmp`;
      try {
        fs.writeFileSync(temp, JSON.stringify(result.database, null, 2), { flag: 'wx' });
        fs.renameSync(temp, file);
      } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
      result.report.backup = backup;
      result.report.applied = true;
    } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
  } else result.report.applied = false;
  console.log(JSON.stringify(result.report, null, 2));
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { prepareStore, main };
