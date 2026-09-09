const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const { prepareStore } = require('../demo-data/seed');
const postgresSeed = require('../demo-data/seed-postgres');
const { getSGQHealthHistory } = require('../sgq-health');
const root = path.join(__dirname, '..');
const password = crypto.randomBytes(20).toString('hex');
function fixture() {
  const salt = crypto.randomBytes(16).toString('hex');
  const password_hash = `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
  return { nextCompanyId: 4, nextUserId: 7, companies: [1, 2, 3].map(id => ({ id, name: `Old ${id}`, created_at: '2025-01-01T00:00:00Z' })), users: ['Viniciusrst', 'other@example.test', 'hugo.melo', 'pending@example.test', 'blocked@example.test', 'reader@example.test'].map((username, n) => ({ id: n + 1, company_id: n < 3 ? n + 1 : 2, username, display_name: ['Viniciusrst', 'Equipe Qualidade', 'Hugo Melo', 'Pendente', 'Bloqueado', 'Leitor'][n], password_hash, role: n < 3 ? 'Administrador' : 'Colaborador', status: n === 3 ? 'Pendente' : n === 4 ? 'Bloqueado' : 'Ativo', session_version: 1, mfa_enabled: false, mfa_secret: '', mfa_recovery_codes: [], must_change_password: false, created_at: '2025-01-01T00:00:00Z' })), companyData: [], auditLogs: [], userSessions: [], passwordResetTokens: [], invitationTokens: [], billingEvents: [], backupSnapshots: [], systemEvents: [] };
}

test('online seed encrypts backups and preserves existing user settings', () => {
  const previousKey = process.env.BACKUP_ENCRYPTION_KEY;
  process.env.BACKUP_ENCRYPTION_KEY = 'test-only-random-backup-key';
  try {
    const value = { companies: [{ id: 3 }], users: [{ id: 1 }] };
    assert.deepEqual(postgresSeed.decrypt(postgresSeed.encrypt(value)), value);
  } finally {
    if (previousKey === undefined) delete process.env.BACKUP_ENCRYPTION_KEY;
    else process.env.BACKUP_ENCRYPTION_KEY = previousKey;
  }
  const source = fixture();
  source.companyData.push({ company_id: 2, data_key: 'userSettings', data_json: { 2: { permissions: { contexto: 'view' } } } });
  const scenario = require('../demo-data/scenario').buildScenario(source.users, '2026-09-06');
  const rows = postgresSeed.scenarioRows(scenario, 3, source);
  assert.equal(new Set(rows.map(row => row.key)).size, rows.length);
  const settings = rows.find(row => row.key === 'userSettings').value;
  assert.equal(settings._companyOwnerId, 3);
  assert.deepEqual(settings[2], { permissions: { contexto: 'view' } });
});

test('seed is deterministic, preserves credentials/status, and has coherent references', () => {
  const original = fixture();
  const first = prepareStore(original, '2026-09-06');
  assert.deepEqual(prepareStore(first.database, '2026-09-06').database, first.database);
  assert.equal(first.database.users.length, original.users.length);
  assert.equal(first.database.users[0].company_id, null);
  first.database.users.forEach((u, n) => { assert.equal(u.password_hash, original.users[n].password_hash); assert.equal(u.status, original.users[n].status); });
  const get = key => first.database.companyData.find(r => r.data_key === key).data_json;
  const state = get('state');
  const { validateSnapshot } = require('../backup');
  assert.equal(validateSnapshot({ version: 2, scope: 'recovery', companies: first.database.companies, users: first.database.users, companyData: first.database.companyData }).users, 6);
  assert.throws(() => validateSnapshot({ version: 2, scope: 'recovery', companies: [], users: [{ username: 'not-admin', company_id: null }], companyData: [] }), /backup_user_company_invalid/);
  const source = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
  const enumValues = field => [...source.match(new RegExp(`id="${field}">([\\s\\S]*?)</select>`))[1].matchAll(/<option>(.*?)<\/option>/g)].map(m => m[1]);
  assert.ok(get('risk').riscos.every(row => enumValues('riskStatus').includes(row.status)));
  assert.ok(get('context').processos.every(row => enumValues('contextProcessoCategoria').includes(row.categoria)));
  assert.equal(state.company.registry.setores.reduce((sum, s) => sum + s.colaboradores, 0), 28);
  assert.equal(state.company.tradeName, 'Quality Pro Solutions');
  assert.equal(state.documents.length, 14);
  assert.equal(state.documents.filter(row => row.kind === 'internal').length, 9);
  assert.equal(state.documents.filter(row => row.kind === 'external').length, 5);
  assert.ok(state.documents.every(row => row.code && row.title && row.status));
  assert.equal(state.audits.length, 12); assert.deepEqual(state.equipment, []);
  assert.equal(new Set(state.audits.map(row => row.dataInicio.slice(0, 7))).size, 12);
  for (const nc of state.ncs) {
    assert.ok(get('context').processos.some(p => p.nome === nc.processo));
    assert.ok(state.company.registry.setores.some(s => s.nome === nc.setor));
    for (const action of nc.acoes) {
      assert.ok(state.users.some(u => u.name === action.responsavel && u.status === 'Ativo'));
      assert.ok(!action.concluidaEm || action.concluidaEm >= nc.dataOrigem);
    }
    assert.ok(!nc.encerradoEm || nc.encerradoEm >= nc.dataOrigem);
  }
  const rows = first.database.companyData.map(r => ({ key: r.data_key, value: r.data_json }));
  for (const months of [1, 3, 6, 12]) {
    const history = getSGQHealthHistory(rows, { months, now: new Date('2026-09-06T18:00:00Z') });
    assert.equal(history.points.length, months === 1 ? 30 : months);
    assert.ok(history.points.every(p => Number.isFinite(p.nonConformities)));
    assert.equal(history.current.nonConformities, state.ncs.filter(n => n.status !== 'Encerrado').length);
    assert.equal(history.current.audits, state.audits.filter(audit => audit.status !== 'Concluída').length);
    if (months > 1) assert.ok(history.points.some(point => point.audits > 0));
    if (months > 1) assert.ok(history.points.slice(0, -1).some(point => point.actions > point.nonConformities));
  }
});

test('CLI backup, dry run, idempotence and restore are reversible', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgq-demo-cli-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'sgq-local.json');
  const initial = fixture(); fs.writeFileSync(file, JSON.stringify(initial));
  const run = (args, env = {}) => spawnSync(process.execPath, ['demo-data/seed.js', '--database', file, '--date', '2026-09-06', ...args], { cwd: root, env: { ...process.env, SGQ_DATABASE_MODE: 'local', ...env }, encoding: 'utf8' });
  assert.equal(run([]).status, 0); assert.deepEqual(JSON.parse(fs.readFileSync(file)), initial);
  assert.notEqual(run(['--apply']).status, 0);
  assert.notEqual(run(['--apply', '--offline'], { NODE_ENV: 'production' }).status, 0);
  const first = run(['--apply', '--offline']); assert.equal(first.status, 0, first.stderr);
  const seeded = fs.readFileSync(file, 'utf8');
  assert.equal(run(['--apply', '--offline']).status, 0); assert.equal(fs.readFileSync(file, 'utf8'), seeded);
  assert.equal(run(['--restore', JSON.parse(first.stdout).backup, '--apply', '--offline']).status, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), initial);
});

test('real endpoints: global admin without tenant and company owner Hugo', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgq-demo-api-'));
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const prepared = prepareStore(fixture(), today);
  fs.writeFileSync(path.join(dir, 'sgq-local.json'), JSON.stringify(prepared.database));
  const net = require('node:net'); const socket = net.createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', SGQ_DATA_DIR: dir, SGQ_DB_PATH: path.join(dir, 'sgq-local.json'), SGQ_DATABASE_MODE: 'local', SGQ_LOGIN_USER: 'Viniciusrst', SGQ_USER_PASSWORD: password, SGQ_EXTRA_LOGINS: '', SGQ_ADMIN_USER: 'viniciusrst', SESSION_SECRET: crypto.randomBytes(32).toString('hex'), SGQ_DISABLE_SCHEDULER: 'true' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; child.stdout.on('data', b => { log += b; }); child.stderr.on('data', b => { log += b; });
  t.after(async () => { if (child.exitCode === null) { const closed = once(child, 'exit'); child.kill(); await closed; } fs.rmSync(dir, { recursive: true, force: true }); });
  let ready = false;
  for (let n = 0; n < 80; n++) { try { if ((await fetch(`${base}/login`)).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); }
  assert.ok(ready, log);
  const login = async username => {
    const r = await fetch(`${base}/login`, { method: 'POST', redirect: 'manual', body: new URLSearchParams({ username, password }) });
    assert.equal(r.status, 302, `Login ${username}: ${await r.text()}`);
    const cookie = r.headers.get('set-cookie').split(';')[0];
    const b = await fetch(`${base}/api/bootstrap`, { headers: { Cookie: cookie } }); assert.equal(b.status, 200, log);
    return { cookie, payload: await b.json() };
  };
  const admin = await login('viniciusrst');
  assert.equal(admin.payload.user.isAdmin, true); assert.equal(admin.payload.user.companyId, null); assert.equal(admin.payload.needsOnboarding, false);
  const overview = await (await fetch(`${base}/api/admin/overview`, { headers: { Cookie: admin.cookie } })).json();
  assert.equal(overview.companies.length, 1); assert.equal(overview.users.length, 6);
  assert.equal(overview.companies[0].access_count, 5);
  assert.equal((await fetch(`${base}/api/company/users`, { headers: { Cookie: admin.cookie } })).status, 403);
  assert.equal((await fetch(`${base}/api/security`, { headers: { Cookie: admin.cookie } })).status, 200);
  const hugo = await login('hugo.melo');
  const largeCompanyLogo = `data:image/png;base64,${Buffer.alloc(150_000, 1).toString('base64')}`;
  const companyLogoSave = await fetch(`${base}/api/company`, { method: 'PATCH', headers: { Cookie: hugo.cookie, 'X-CSRF-Token': hugo.payload.csrfToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...hugo.payload.state.company, logo: largeCompanyLogo }) });
  assert.equal(companyLogoSave.status, 200, await companyLogoSave.text());
  const companyAfterLogo = await (await fetch(`${base}/api/bootstrap`, { headers: { Cookie: hugo.cookie } })).json();
  assert.equal(companyAfterLogo.state.company.logo, largeCompanyLogo);
  const tvHeaders = await fetch(`${base}/nc-tv`, { headers: { Cookie: hugo.cookie } });
  assert.equal(tvHeaders.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(tvHeaders.headers.get('content-security-policy'), "frame-ancestors 'self'");
  assert.equal((await fetch(`${base}/app`, { headers: { Cookie: hugo.cookie } })).headers.get('x-frame-options'), 'DENY');
  assert.equal(hugo.payload.user.canManageCompany, true); assert.equal(hugo.payload.user.isAdmin, false);
  assert.equal(hugo.payload.state.ncs.length, 36); assert.equal(hugo.payload.state.climate.issues.length, 6);
  assert.equal((await fetch(`${base}/api/admin/overview`, { headers: { Cookie: hugo.cookie } })).status, 403);
  for (const key of ['context', 'risk', 'leadership', 'state']) {
    const r = await fetch(`${base}/api/data`, { method: 'POST', headers: { Cookie: hugo.cookie, 'X-CSRF-Token': hugo.payload.csrfToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value: hugo.payload[key] }) });
    assert.equal(r.status, 200, `${key}: ${await r.text()}`);
  }
  for (const months of [1, 3, 6, 12]) {
    const r = await fetch(`${base}/api/dashboard/health-history?months=${months}`, { headers: { Cookie: hugo.cookie } }); assert.equal(r.status, 200);
    assert.ok((await r.json()).points.every(p => Number.isFinite(p.nonConformities)));
  }
  const other = await login('other@example.test'); assert.equal(other.payload.user.companyId, 3);
  const climateSave = await fetch(`${base}/api/data`, { method: 'POST', headers: { Cookie: other.cookie, 'X-CSRF-Token': other.payload.csrfToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'state', moduleId: 'mudancas-climaticas', value: { climate: other.payload.state.climate, company: { name: 'Must not overwrite' } } }) });
  assert.equal(climateSave.status, 200, await climateSave.text());
  const readBack = await (await fetch(`${base}/api/bootstrap`, { headers: { Cookie: other.cookie } })).json();
  assert.equal(readBack.company.name, prepared.report ? prepared.database.companies[0].name : '');
  const reader = await login('reader@example.test');
  const denied = await fetch(`${base}/api/data`, { method: 'POST', headers: { Cookie: reader.cookie, 'X-CSRF-Token': reader.payload.csrfToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'risk', value: {} }) }); assert.equal(denied.status, 403);
  for (const username of ['pending@example.test', 'blocked@example.test']) assert.equal((await fetch(`${base}/login`, { method: 'POST', redirect: 'manual', body: new URLSearchParams({ username, password }) })).status, 401);
  if (process.env.SGQ_DEMO_BROWSER === '1') {
    const { chromium } = require('@playwright/test');
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      page.on('console', message => { if (message.type() === 'error') t.diagnostic(message.text()); });
      await page.goto(`${base}/login`); await page.locator('[name=username]').fill('hugo.melo'); await page.locator('[name=password]').fill(password); await page.locator('button[type=submit]').click();
      await page.waitForFunction(() => typeof currentUser !== 'undefined' && currentUser?.username === 'hugo.melo');
      for (const moduleId of ['contexto', 'lideranca', 'riscos', 'nao-conformidades', 'mudancas-climaticas']) {
        await page.evaluate(id => renderModuleDetail(id), moduleId);
        assert.ok(await page.locator('.page-content').innerText());
      }
      await page.evaluate(() => renderModuleDetail('auditorias'));
      const auditsFrame = page.frameLocator('iframe[title="Auditorias"]');
      await auditsFrame.locator('#kpiRow').waitFor({ state: 'visible', timeout: 5000 });
      assert.equal(await auditsFrame.locator('#mainTabs .ctx-tab').count(), 4);
      for (const tab of ['planejamento', 'controle', 'acoes', 'indicadores']) {
        await auditsFrame.locator(`#mainTabs [data-tab=${tab}]`).click();
      }
      assert.equal(await auditsFrame.locator('#tabContent canvas').count(), 7);
      await auditsFrame.locator('.page-toolbar .btn-grad').click();
      await auditsFrame.locator('#regDescricao').fill('Auditoria de integração');
      await auditsFrame.locator('#regDataInicio').fill('2026-09-15');
      await auditsFrame.locator('#regResponsavel').selectOption({ index: 0 });
      await auditsFrame.locator('#modalReg .btn-primary').click();
      await page.waitForFunction(() => state.audits.some(audit => audit.descricao === 'Auditoria de integração'), null, { timeout: 5000 });
      const savedAudits = await page.evaluate(async () => (await (await fetch('/api/bootstrap')).json()).state.audits);
      assert.ok(savedAudits.some(audit => audit.descricao === 'Auditoria de integração'));
      await page.evaluate(() => render('inicio'));
      await page.waitForFunction(() => document.querySelector('.sgq-health-plot')?.getAttribute('aria-busy') === 'false');
      assert.equal(await page.locator('[data-health-value="audits"]').innerText(), '1');
      await page.locator('.sgq-health-indicator:has([data-health-value="audits"])').click();
      await page.locator('iframe[title="Auditorias"]').waitFor({ state: 'visible' });
      await page.evaluate(() => renderModuleDetail('mudancas-climaticas'));
      await page.locator('[data-climate-tab=indicators]').click();
      await page.waitForFunction(() => Boolean(Chart.getChart('climateStatusChart')));
      assert.equal(await page.evaluate(() => Chart.getChart('climateStatusChart').data.datasets[0].data.reduce((a, b) => a + b, 0)), 6);
      await page.screenshot({ path: path.join(root, 'test-results', 'demo-climate.png'), fullPage: true });
      await page.evaluate(() => renderModuleDetail('contexto'));
      for (const tab of ['swot', 'partes', 'escopo', 'processos']) await page.locator(`[data-context-tab=${tab}]`).click();
      await page.evaluate(() => renderModuleDetail('riscos'));
      for (const tab of ['riscos', 'objetivos', 'mudancas']) await page.locator(`[data-risk-tab=${tab}]`).click();
      await page.locator('[data-risk-tab=riscos]').click();
      await page.locator('[data-risk-filter=oportunidades]').click();
      assert.equal(await page.locator('#riskTabContent tbody tr').count(), 4);
      await page.evaluate(() => renderModuleDetail('lideranca'));
      for (const main of ['lideranca', 'politica', 'papeis']) {
        await page.locator(`[data-leadership-main=${main}]`).click();
        const tabs = await page.locator('[data-lc-action=switch-tab]').evaluateAll(nodes => nodes.map(n => n.dataset.id));
        for (const tab of tabs) await page.locator(`[data-lc-action=switch-tab][data-id=${tab}]`).click();
      }
      await page.evaluate(() => { currentLeadershipMainTab = 'lideranca'; currentLeadershipSubTab = 'indicadores'; renderLeadershipModule(); });
      await page.waitForFunction(() => Boolean(Chart.getChart('lcActionsStatusChart')));
      assert.equal(await page.evaluate(() => Chart.getChart('lcActionsStatusChart').data.datasets[0].data.reduce((a, b) => a + b, 0)), 24);
      await page.evaluate(() => renderModuleDetail('nao-conformidades'));
      await page.locator('[data-nc-tab=controle]').click();
      await page.locator('[data-nc-filter=status]').selectOption('Encerrado');
      assert.equal(await page.locator('.nc-control-table tbody tr').count(), hugo.payload.state.ncs.filter(n => n.status === 'Encerrado').length);
      await page.locator('[data-nc-tab=dashboards]').click();
      const iframe = page.frameLocator('iframe[title="Dashboard de Não conformidades"]');
      await iframe.locator('#tvYear').waitFor({ state: 'attached', timeout: 5000 }).catch(async error => { t.diagnostic(JSON.stringify(await page.locator('iframe').evaluateAll(nodes => nodes.map(n => ({ title: n.title, src: n.src }))))); t.diagnostic(JSON.stringify(page.frames().map(f => f.url()))); throw error; });
      const frame = page.frames().find(f => f.url().includes('/nc-tv'));
      assert.ok(frame);
      await frame.waitForFunction(() => typeof currentState !== 'undefined' && currentState?.ncs?.length === 36);
      assert.ok(await frame.locator('canvas').count());
      const tv = await page.context().newPage();
      await tv.goto(`${base}/nc-tv`);
      await tv.waitForFunction(() => typeof currentState !== 'undefined' && currentState?.ncs?.length === 36);
      for (const dimension of ['processo', 'setor', 'origem', 'gravidade', 'referencia']) await tv.locator('#tvDimension').selectOption(dimension);
      const years = await tv.locator('#tvYear option').evaluateAll(nodes => nodes.map(n => n.value));
      for (const year of years) await tv.locator('#tvYear').selectOption(year);
      await tv.screenshot({ path: path.join(root, 'test-results', 'demo-nc-tv.png'), fullPage: true });
      await tv.close();
      await page.evaluate(() => { render('empresa'); });
      assert.equal(await page.locator('#fNomeFantasia').inputValue(), 'Quality Pro Solutions');
      await page.evaluate(() => render('inicio'));
      assert.equal(await page.evaluate(() => dashboardSummary().modules['mudancas-climaticas'].value), '6 registros');
      assert.equal(await page.locator('[data-notification-badge]').isVisible(), false);
      for (const months of ['1', '3', '6', '12']) {
        await page.locator('[aria-label="Período da saúde do SGQ"]').selectOption(months);
        await page.waitForFunction(() => document.querySelector('.sgq-health-plot')?.getAttribute('aria-busy') === 'false');
        const current = await page.evaluate(async m => (await getSGQHealthHistory({ months: Number(m) })).current, months);
        assert.equal(current.nonConformities, hugo.payload.state.ncs.filter(n => n.status !== 'Encerrado').length);
      }
      assert.equal(await page.evaluate(() => sgqHealthPreview(6, 'http://127.0.0.1:4180/app')), null);
      assert.ok(await page.locator('canvas').count());
      await page.screenshot({ path: path.join(root, 'test-results', 'demo-home.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => renderModuleDetail('mudancas-climaticas'));
      await page.screenshot({ path: path.join(root, 'test-results', 'demo-mobile.png'), fullPage: true });
      await page.context().clearCookies();
      await page.goto(`${base}/login`); await page.locator('[name=username]').fill('viniciusrst'); await page.locator('[name=password]').fill(password); await page.locator('button[type=submit]').click();
      await page.waitForFunction(() => typeof currentUser !== 'undefined' && currentUser?.isAdmin);
      await page.waitForFunction(() => document.querySelector('.page-content')?.innerText.includes('hugo.melo'));
      assert.ok((await page.locator('.page-content').innerText()).includes('Quality Pro Solutions'));
      assert.equal(await page.locator('.admin-metric-card').count(), 4);
      assert.equal(await page.locator('.admin-featured-company').count(), 1);
      assert.deepEqual(await page.locator('.admin-metric-copy > strong').allTextContents(), ['1', '6', '4', '0']);
      assert.equal(await page.locator('#dashboardGlobalSearch').getAttribute('placeholder'), 'Buscar empresas, usuários, módulos, registros...');
      const adminSizes = [[1366, 768], [1440, 900], [1536, 864], [1600, 900], [1920, 1080]];
      for (const [width, height] of adminSizes) {
        await page.setViewportSize({ width, height });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        await page.screenshot({ path: path.join(root, 'test-results', `demo-admin-${width}-${height}.png`), fullPage: false });
      }
      await page.locator('.admin-featured-company').click();
      assert.equal(await page.locator('[data-view="admin-empresas"]').getAttribute('class').then(value => value.includes('active')), true);
      await page.waitForFunction(() => document.querySelector('.page-content')?.innerText.includes('Quality Pro Solutions'));
      assert.ok((await page.locator('.page-content').innerText()).includes('Quality Pro Solutions'));
      await page.locator('[data-admin-company-details]').first().click();
      await page.waitForSelector('[data-admin-company-detail-modal].is-open');
       assert.equal(await page.locator('[data-admin-company-detail-tab]').count(), 8);
       await page.locator('[data-admin-company-detail-tab="users"]').click();
       await page.locator('[data-admin-company-detail-panel="users"]').waitFor({ state: 'visible' });
       assert.equal(await page.locator('[data-admin-company-detail-panel="users"]').isVisible(), true);
      await page.locator('[data-admin-company-user-add]').click();
      await page.waitForSelector('[data-admin-company-user-editor].is-open');
      assert.ok(await page.locator('[data-admin-company-user-role] option').count() > 1);
      assert.equal(await page.locator('#adminCompanyUserEditorForm [name="status"]').count(), 0);
      await page.locator('[data-admin-company-user-editor-close]').last().click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
      await page.screenshot({ path: path.join(root, 'test-results', 'demo-admin-company-modal.png'), fullPage: false });
      await page.getByRole('button', { name: 'Fechar' }).click();
      await page.locator('[data-view="gerenciamento"]').click();
      await page.waitForSelector('.admin-overview');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  }
});
