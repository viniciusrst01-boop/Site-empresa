const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

async function verify() {
  const base = new URL(process.argv[2] || 'http://127.0.0.1:4180');
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname);
  const confirmedOnline = process.argv.includes('--online-confirmed') && base.hostname === 'sgq-online-app.vercel.app' && base.protocol === 'https:';
  if (!local && !confirmedOnline) throw new Error('Servidor externo exige o dominio oficial e --online-confirmed');
  const logins = [{ user: process.env.SGQ_LOGIN_USER, password: process.env.SGQ_USER_PASSWORD }, ...String(process.env.SGQ_EXTRA_LOGINS || '').split(',').map(entry => { const [user, password] = entry.trim().split(':'); return { user, password }; })].filter(x => x.user && x.password);
  const wanted = new Set(['viniciusrst', 'hugo.melo', 'admin@qualitypro.com.br']);
  const report = [];
  for (const login of logins.filter(x => wanted.has(x.user.toLowerCase()))) {
    const response = await fetch(new URL('/login', base), { method: 'POST', redirect: 'manual', body: new URLSearchParams({ username: login.user, password: login.password }) });
    if (response.status !== 302 || response.headers.get('location') !== '/app') { report.push({ user: login.user, loginStatus: response.status, next: response.headers.get('location') }); continue; }
    const cookie = response.headers.get('set-cookie').split(';')[0];
    const headers = { Cookie: cookie };
    try {
      const b = await fetch(new URL('/api/bootstrap', base), { headers });
      if (!b.ok) throw new Error(`Bootstrap indisponível: ${b.status}`);
      const payload = await b.json();
      const asset = await fetch(new URL('/app.js', base), { headers });
      const hash = value => crypto.createHash('sha256').update(value).digest('hex');
      const matchesCheckout = hash(Buffer.from(await asset.arrayBuffer())) === hash(fs.readFileSync(path.join(__dirname, '../public/app.js')));
      const item = { user: login.user, id: payload.user.id, companyId: payload.user.companyId, isAdmin: payload.user.isAdmin, canManageCompany: payload.user.canManageCompany, company: payload.company?.name || null, matchesCheckout, records: { ncs: payload.state?.ncs?.length || 0, risks: payload.risk?.riscos?.length || 0, climate: payload.state?.climate?.issues?.length || 0 } };
      if (payload.user.isAdmin) {
        const overview = await (await fetch(new URL('/api/admin/overview', base), { headers })).json();
        item.companies = overview.companies.map(c => ({ id: c.id, name: c.name, users: c.access_count }));
        item.users = overview.users.map(u => ({ id: u.id, username: u.username, companyId: u.companyId, role: u.role, status: u.status }));
      } else {
        item.periods = [];
        for (const months of [1, 3, 6, 12]) {
          const r = await fetch(new URL(`/api/dashboard/health-history?months=${months}`, base), { headers });
          const history = await r.json();
          item.periods.push({ months, status: r.status, points: history.points?.length, current: history.current });
        }
      }
      if (process.env.SGQ_DEMO_BROWSER === '1') {
        const { chromium } = require('@playwright/test');
        const browser = await chromium.launch({ headless: true });
        try {
          const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
          const separator = cookie.indexOf('=');
          await context.addCookies([{ name: cookie.slice(0, separator), value: cookie.slice(separator + 1), url: base.origin, httpOnly: true, sameSite: 'Lax' }]);
          const page = await context.newPage();
          const errors = []; page.on('pageerror', error => errors.push(error.message));
          await page.goto(new URL('/app', base).href);
          await page.waitForFunction(id => typeof currentUser !== 'undefined' && currentUser?.id === id, payload.user.id);
          if (payload.user.isAdmin) await page.waitForFunction(() => document.querySelector('.page-content')?.innerText.includes('hugo.melo'));
          else {
            await page.waitForFunction(() => document.querySelector('.sgq-health-plot')?.getAttribute('aria-busy') === 'false');
            const rendered = await page.evaluate(() => ({ ncs: state.ncs.length, climate: dashboardSummary().modules['mudancas-climaticas'].value }));
            if (rendered.ncs !== 36 || rendered.climate !== '6 registros') throw new Error('Dados renderizados divergem do seed');
            item.rendered = rendered;
          }
          if (errors.length) throw new Error(errors.join('; '));
          item.screenshot = `test-results/demo-live-${payload.user.id}.png`;
          await page.screenshot({ path: path.join(__dirname, '..', item.screenshot), fullPage: true });
          item.browserVerified = true;
        } finally { await browser.close(); }
      }
      report.push(item);
      await fetch(new URL('/logout', base), { method: 'POST', redirect: 'manual', headers: { ...headers, 'X-CSRF-Token': payload.csrfToken }, body: new URLSearchParams({ csrfToken: payload.csrfToken }) });
    } catch (error) { throw new Error(`${login.user}: ${error.message}`); }
  }
  console.log(JSON.stringify({ checked: report, unavailableCredentials: [...wanted].filter(user => !report.some(r => r.user.toLowerCase() === user)) }, null, 2));
  if (report.some(item => item.loginStatus || !item.matchesCheckout)) process.exitCode = 1;
}
verify().catch(error => { console.error(error.message); process.exitCode = 1; });
