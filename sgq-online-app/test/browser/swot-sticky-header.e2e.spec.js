const { test, expect } = require('@playwright/test');

test('SWOT keeps a contrasting header visible while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 1000 });
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => {
    renderModuleDetail('contexto');
    contextData.swot = Array.from({ length: 40 }, (_, i) => ({ id: `test-${i}`, quadrante: 'Força', descricao: `Item ${i}`, prioridade: 'Alta', planoAcao: '', responsavel: 'Responsável', status: 'Não iniciada' }));
    currentContextTab = 'swot';
    renderContextTab();
    document.body.classList.add('theme-white');
  });
  const wrap = page.locator('.context-swot-table-wrap');
  const header = wrap.locator('th').first();
  await expect(header).toHaveCSS('background-color', 'rgb(213, 228, 242)');
  const scroller = page.locator('#contextTabContent');
  await scroller.evaluate(el => { el.scrollTop = 450; });
  expect(await scroller.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  const after = await header.boundingBox();
  const container = await scroller.boundingBox();
  expect(Math.abs(container.y - after.y)).toBeLessThan(2);
});
