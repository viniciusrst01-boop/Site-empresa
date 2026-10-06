const { test, expect } = require('@playwright/test');

test('escopo preserva a data de aprovacao apos a virada UTC', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.clock.setFixedTime(new Date('2026-10-06T01:28:00Z'));
  await page.evaluate(() => {
    renderModuleDetail('contexto');
    currentContextTab = 'escopo';
    renderContextTab();
    setInputValue('ctxEscopo-statusAprovacao', 'Aprovado');
    setInputValue('ctxEscopo-dataAprovacao', '2026-10-05');
    saveContextEscopo();
  });
  const saved = await page.evaluate(() => contextGet('escopo'));
  expect(saved.dataAprovacao).toBe('2026-10-05');
  expect(saved.dataAtualizacao).toBe('2026-10-05');
  expect(saved.historico.at(-1).data).toBe('2026-10-05');
  await expect(page.locator('#ctxKpiEscopoCaption')).toHaveText('05/10/2026');
  await expect(page.locator('.escopo-pill.approved')).toContainText('05/10/2026');
});
