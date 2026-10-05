const { test, expect } = require('@playwright/test');

test('listas dos indicadores respeitam contagens, teclado e paginação', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1700, height: 950 });
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  for (const id of ['contexto', 'lideranca', 'riscos', 'documentos', 'nao-conformidades', 'mudancas-climaticas', 'auditorias', 'satisfacao-clientes', 'fornecedores']) {
    await page.evaluate(id => renderModuleDetail(id), id);
    const frame = page.locator('.page-content > section > iframe');
    const surface = await frame.count() ? frame.contentFrame() : page;
    await expect(surface.locator('.summary-list-trigger').first()).toBeVisible();
    const cards = surface.locator('.summary-list-trigger');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const value = parseFloat(await card.locator('.compact-card-value, .nc-progress-line strong').textContent());
      await card.focus();
      await card.press('Enter');
      const dialog = page.locator('#summary-record-list');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('footer').getByRole('button', { name: 'Fechar' })).toHaveCount(0);
      await expect.poll(async () => Math.round((await dialog.boundingBox()).y)).toBe(130);
      await expect(dialog.locator('header p')).toHaveText(`${value} registro(s)`);
      await expect(dialog.locator('tbody tr')).toHaveCount(Math.max(1, Math.min(value, 10)));
      if (value > 10) {
        await dialog.getByRole('button', { name: 'Próxima página' }).click();
        await expect(dialog.locator('footer span')).toContainText('Página 2');
      }
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(card).toBeFocused();
    }
  }
  await page.evaluate(() => renderModuleDetail('contexto'));
  await page.locator('.summary-list-trigger').first().click();
  await page.screenshot({ path: testInfo.outputPath('list-desktop.png'), animations: 'disabled' });
  await page.locator('#summary-record-title').click();
  await expect(page.locator('#summary-record-list')).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.locator('#summary-record-list')).toHaveCount(0);
  await page.locator('.summary-list-trigger').first().click();
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = page.locator('#summary-record-list');
  expect(await dialog.evaluate(el => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('list-mobile.png'), animations: 'disabled' });
  await dialog.getByRole('button', { name: 'Fechar lista', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.setViewportSize({ width: 1700, height: 950 });
  await page.evaluate(() => renderModuleDetail('equipamentos'));
  const equipment = page.locator('.page-content > section > iframe').contentFrame();
  const equipmentCard = equipment.locator('.summary-list-trigger').first();
  await equipmentCard.click();
  const equipmentList = page.locator('#equipment-category-dialog');
  await expect(equipmentList).toBeVisible();
  expect((await equipmentList.boundingBox()).y).toBe(130);
  expect(await equipmentList.evaluate(el => el.parentElement === document.body && el.matches(':modal'))).toBe(true);
  expect(await equipmentList.evaluate(el => getComputedStyle(el, '::backdrop').backdropFilter)).toBe('blur(3px)');
  await equipmentList.getByRole('button', { name: 'Próxima página' }).click();
  await expect(equipmentList.locator('.category-page-label')).toContainText('Página 2');
  await page.screenshot({ path: testInfo.outputPath('equipment-full-blur.png'), animations: 'disabled' });
  await equipmentList.locator('.modal-hd').click();
  await expect(equipmentList).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(equipmentList).toBeHidden();
  await equipmentCard.focus();
  await equipmentCard.press('Enter');
  await expect(equipmentList).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(equipmentList).toBeHidden();
  await equipmentCard.click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(equipmentList).toBeVisible();
  const bounds = await equipmentList.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: testInfo.outputPath('equipment-mobile.png'), animations: 'disabled' });
  await expect(equipmentList.locator('.category-footer').getByRole('button', { name: 'Fechar' })).toHaveCount(0);
  await equipmentList.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(equipmentList).toHaveCount(0);
});
