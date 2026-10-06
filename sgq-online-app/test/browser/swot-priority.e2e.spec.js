const { test, expect } = require('@playwright/test');

test('SWOT sincroniza escolhas visiveis e preserva prioridade ao editar', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => renderModuleDetail('contexto'));
  const label = id => page.locator(`#${id}`).locator('..').locator('.qp-select-trigger');
  await expect(label('contextSwotPrioridade')).toBeAttached();
  await page.evaluate(() => openContextSwot());
  await expect(label('contextSwotPrioridade')).toHaveText('Selecione…');
  await expect(label('contextSwotQuadrante')).toHaveText('Selecione…');
  const count = await page.evaluate(() => contextGet('swot').length);
  await page.evaluate(() => saveContextSwot());
  expect(await page.evaluate(() => contextGet('swot').length)).toBe(count);
  for (const priority of ['Alta', 'Média', 'Baixa']) {
    await page.evaluate(priority => {
      contextData.swot = contextData.swot.filter(r => r.id !== 'SWOT-PRIORITY-TEST');
      contextData.swot.push({ id: 'SWOT-PRIORITY-TEST', quadrante: 'Ameaça', prioridade: priority, descricao: 'Teste de prioridade', planoNecessario: 'Não' });
      openContextSwot('SWOT-PRIORITY-TEST');
    }, priority);
    await expect(label('contextSwotPrioridade')).toHaveText(priority);
    await expect(label('contextSwotQuadrante')).toHaveText('Ameaça');
    await page.evaluate(() => saveContextSwot());
    expect(await page.evaluate(() => contextGet('swot').find(r => r.id === 'SWOT-PRIORITY-TEST').prioridade)).toBe(priority);
  }
});
