const { test, expect } = require('@playwright/test');

test('module summaries retain values and fit their compact layout', async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 1000 });
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  for (const id of ['lideranca', 'contexto', 'riscos', 'mudancas-climaticas', 'documentos', 'auditorias', 'fornecedores', 'satisfacao-clientes']) {
    await page.evaluate(id => renderModuleDetail(id), id);
    const embedded = ['auditorias', 'fornecedores', 'satisfacao-clientes'].includes(id);
    const root = embedded ? page.frameLocator('.page-content iframe').first() : page;
    const cards = root.locator('.compact-module-card');
    await expect(cards.first(), id).toBeVisible();
    const metrics = await cards.evaluateAll(cards => cards.map(card => ({
      height: card.getBoundingClientRect().height,
      value: card.querySelector('.compact-card-value').textContent.trim(),
      overflow: card.scrollWidth > card.clientWidth,
    })));
    for (const card of metrics) {
      expect(card.value, id).not.toBe('');
      expect(card.height, id).toBeGreaterThanOrEqual(92);
      expect(card.height, id).toBeLessThanOrEqual(100);
      expect(card.overflow, id).toBeFalsy();
    }
    await page.screenshot({ path: `test-results/compact-${id}.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(cards.first()).toBeVisible();
    await page.setViewportSize({ width: 1720, height: 1000 });
  }
});
