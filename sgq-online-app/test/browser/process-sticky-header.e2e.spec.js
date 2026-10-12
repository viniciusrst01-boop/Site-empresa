const { test, expect } = require('@playwright/test');

test('process headers remain visible during scrolling in both themes', async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 1000 });
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => {
    renderModuleDetail('contexto');
    contextData.processos = Array.from({ length: 40 }, (_, i) => ({ id: `test-${i}`, codigo: `PR-${i}`, nome: `Processo ${i}`, categoria: 'Operacional', responsavel: 'Responsável', status: 'Ativo' }));
    currentContextTab = 'processos';
    renderContextTab();
  });
  for (const white of [false, true]) {
    await page.evaluate(value => document.body.classList.toggle('theme-white', value), white);
    const wrap = page.locator('.context-process-table-wrap');
    const scroller = page.locator('#contextTabContent');
    await expect(wrap).toHaveCSS('overflow', 'visible');
    await scroller.evaluate(el => { el.scrollTop = 0; });
    const headers = wrap.locator('th');
    await expect(headers).toHaveCount(6);
    await scroller.evaluate(el => { el.scrollTop = 450; });
    expect(await scroller.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    expect(await wrap.evaluate(el => el.scrollTop)).toBe(0);
    const after = await headers.first().boundingBox();
    const container = await scroller.boundingBox();
    expect(Math.abs(after.y - container.y)).toBeLessThan(3);
    const heading = await scroller.locator('.dcc-hd').boundingBox();
    expect(heading.y + heading.height).toBeLessThan(container.y);
    const tabs = page.locator('.context-page-content > .ctx-tabs');
    await expect(tabs).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(tabs.locator('.ctx-tab.active')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(headers.first()).toHaveCSS('position', 'sticky');
  }
});
