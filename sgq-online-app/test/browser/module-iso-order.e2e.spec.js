const { test, expect } = require('@playwright/test');

test('catalog orders module cards by their ISO items', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => renderModulos());
  const cards = page.locator('[data-module-card]');
  await expect(cards).toHaveCount(10);
  expect(await cards.evaluateAll(nodes => nodes.map(node => node.dataset.moduleCard))).toEqual([
    'contexto', 'mudancas-climaticas', 'lideranca', 'riscos', 'equipamentos',
    'documentos', 'fornecedores', 'satisfacao-clientes', 'auditorias', 'nao-conformidades',
  ]);
});
