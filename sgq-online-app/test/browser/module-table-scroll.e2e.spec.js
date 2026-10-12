const { test, expect } = require('@playwright/test');

test('tabbed module tables share one scroll region and sticky column titles', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width:1700, height:950 });
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name:'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  let checked = 0;
  for (const id of ['contexto','lideranca','riscos','documentos','nao-conformidades','auditorias','equipamentos','fornecedores','satisfacao-clientes','mudancas-climaticas']) {
    await page.evaluate(id => renderModuleDetail(id), id);
    const iframe = page.locator('.page-content > section > iframe');
    const surface = await iframe.count() ? iframe.contentFrame() : page;
    const tabs = surface.locator('.ctx-tabs > .ctx-tab, .documents-tabs > .documents-tab');
    await expect(tabs.first()).toBeVisible();
    const count = await tabs.count();
    for (let i=0; i<count; i++) {
      const label = await tabs.nth(i).innerText();
      if (/indicador|dashboard|mapa/i.test(label)) continue;
      await tabs.nth(i).click();
      await page.waitForTimeout(250);
      const roots = surface.locator('#contextTabContent, #riskTabContent, #climateTabContent, #ncTabContent, .leadership-scroll-region, [data-doc-content], #tabContent');
      const root = roots.filter({ has:surface.locator('table thead') }).first();
      if (!await root.count() || await root.locator('canvas').count()) continue;
      const table = root.locator('table:has(thead)').first();
      await table.evaluate(el => {
        const tbody = el.querySelector('tbody');
        if (!tbody) return;
        const row = tbody.querySelector('tr');
        if (!row) return;
        for (let n=0;n<45;n++) tbody.append(row.cloneNode(true));
      });
      for (const white of [false,true]) {
        await root.evaluate((el, white) => { el.ownerDocument.body.classList.toggle('theme-white', white); el.scrollTop=700; }, white);
        const result = await table.locator('th').first().evaluate(el => {
          const ancestors=[];
          for(let p=el.parentElement;p && p!==el.ownerDocument.body;p=p.parentElement) {
            if (/auto|scroll/.test(getComputedStyle(p).overflowY) && p.scrollHeight>p.clientHeight+1) ancestors.push(p);
          }
          const scroll=ancestors[0];
          return { position:getComputedStyle(el).position, count:ancestors.length, top:scroll ? Math.abs(el.getBoundingClientRect().top-scroll.getBoundingClientRect().top):999 };
        });
        expect(result.position, `${id}/${label}`).toBe('sticky');
        expect(result.count, `${id}/${label}: vertical scrollers`).toBe(1);
        expect(result.top, `${id}/${label}: title at top`).toBeLessThan(4);
      }
      checked++;
      console.log(`${id}/${label}: OK`);
    }
  }
  expect(checked).toBeGreaterThan(10);
});
