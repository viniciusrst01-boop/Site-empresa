const { test, expect } = require('@playwright/test');

test('processo exige selecao e reabre com a categoria salva', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => { renderModuleDetail('contexto'); openContextProcesso(); });
  for (const id of ['Categoria', 'Responsavel', 'Status']) {
    const field = page.locator(`#contextProcesso${id}`);
    await expect(field).toHaveValue('');
    await expect(field.locator('..').locator('.qp-select-trigger')).toHaveText('Selecionar');
  }
  await page.evaluate(() => saveContextProcesso());
  await expect(page.locator('#contextProcessoModal')).toBeVisible();
  for (const category of ['Estratégico', 'Operacional', 'Suporte']) {
    await page.evaluate(() => openContextProcesso());
    await page.locator('#contextProcessoCategoria').locator('..').locator('.qp-select-trigger').click();
    await page.locator('.qp-select-menu.is-open').getByRole('option', { name: category, exact: true }).click();
    await page.evaluate(() => {
      setInputValue('contextProcessoNome', 'Processo teste');
      setInputValue('contextProcessoResponsavel', 'Hugo Melo');
      setInputValue('contextProcessoStatus', 'Ativo');
      saveContextProcesso();
      openContextProcesso(contextGet('processos').at(-1).id);
    });
    await expect(page.locator('#contextProcessoCategoria')).toHaveValue(category);
    await expect(page.locator('#contextProcessoCategoria').locator('..').locator('.qp-select-trigger')).toHaveText(category);
    expect(await page.evaluate(() => contextGet('processos').at(-1).categoria)).toBe(category);
  }
});
