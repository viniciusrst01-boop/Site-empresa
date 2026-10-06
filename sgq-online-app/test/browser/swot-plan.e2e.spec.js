const { test, expect } = require('@playwright/test');

test('SWOT mostra plano e status somente quando necessario', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => { renderModuleDetail('contexto'); openContextSwot(); });
  const required = page.locator('#contextSwotPlanoNecessario');
  const plan = page.locator('#contextSwotPlanoAcao');
  const status = page.locator('#contextSwotStatus');
  await expect(plan).toBeHidden();
  await expect(status).toBeHidden();
  await required.selectOption('Sim');
  await expect(plan).toBeVisible();
  await expect(status).toBeEnabled();
  await plan.fill('Revisar processo');
  await required.selectOption('Não');
  await expect(plan).toBeHidden();
  await expect(status).toBeDisabled();
  await required.selectOption('Sim');
  await expect(plan).toHaveValue('Revisar processo');
  for (const choice of ['Sim', 'Não']) {
    await page.evaluate(choice => {
      contextData.swot.push({ id: 'SWOT-VISIBILITY', planoNecessario: choice, planoAcao: 'Plano existente' });
      openContextSwot('SWOT-VISIBILITY');
    }, choice);
    if (choice === 'Sim') await expect(plan).toBeVisible();
    else await expect(plan).toBeHidden();
    await expect(plan).toHaveValue('Plano existente');
    await page.evaluate(() => { contextData.swot = contextData.swot.filter(r => r.id !== 'SWOT-VISIBILITY'); });
  }
});
