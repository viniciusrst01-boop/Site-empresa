const { test, expect } = require('@playwright/test');

test('escopo preserva a data de aprovacao apos a virada UTC', async ({ page }, testInfo) => {
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
  const exclusions = page.locator('#ctxEscopo-exclusoes');
  await exclusions.fill('Os requisitos aplicáveis são considerados no planejamento, execução, monitoramento e melhoria dos serviços e produtos fornecidos. '.repeat(12));
  await expect.poll(() => exclusions.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  const expandedHeight = await exclusions.evaluate(el => el.clientHeight);
  await exclusions.fill('Nenhuma exclusão.');
  expect(await exclusions.evaluate(el => el.clientHeight)).toBeLessThan(expandedHeight);
  for (const width of [1700, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const theme of ['dark', 'white']) {
      await page.evaluate(value => document.body.classList.toggle('theme-white', value === 'white'), theme);
      const scope = page.locator('.context-scope-card');
      expect(await scope.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await expect.poll(() => scope.locator('textarea').evaluateAll(fields => fields.every(el => el.scrollHeight <= el.clientHeight + 1))).toBe(true);
      await scope.screenshot({ path: testInfo.outputPath(`scope-${theme}-${width}.png`) });
    }
  }
});
