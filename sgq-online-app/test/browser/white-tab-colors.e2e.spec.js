const { test, expect } = require('@playwright/test');

test('white theme tabs share cyan hover, selection and motion', async ({ page }) => {
  await page.setViewportSize({ width:1700, height:950 });
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name:'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  for (const id of ['contexto','lideranca','riscos','documentos','nao-conformidades','auditorias','equipamentos','fornecedores','satisfacao-clientes','mudancas-climaticas']) {
    await page.evaluate(id => renderModuleDetail(id), id);
    const iframe = page.locator('.page-content > section > iframe');
    const surface = await iframe.count() ? iframe.contentFrame() : page;
    const tabs = surface.locator('.ctx-tabs > .ctx-tab, .documents-tabs > .documents-tab');
    await expect(tabs.first()).toBeVisible();
    await tabs.first().evaluate(el => el.ownerDocument.body.classList.add('theme-white'));
    const active = surface.locator('.ctx-tabs > .ctx-tab.active, .documents-tabs > .documents-tab.active').first();
    await expect(active).toHaveCSS('color','rgb(0, 143, 189)');
    await expect.poll(() => active.evaluate(el => getComputedStyle(el,'::after').opacity)).toBe('1');
    await tabs.nth(1).hover();
    await expect(tabs.nth(1)).toHaveCSS('color','rgb(0, 143, 189)');
    await page.emulateMedia({ reducedMotion:'reduce' });
    await expect.poll(() => active.evaluate(el => getComputedStyle(el,'::after').transitionDuration)).toBe('0s');
    await page.emulateMedia({ reducedMotion:'no-preference' });
  }
});
