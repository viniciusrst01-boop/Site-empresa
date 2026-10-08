const { test, expect } = require('@playwright/test');

test('calendario compartilhado preserva datas e funciona em campos dinamicos e iframe', async ({ page }, testInfo) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => {
    renderModuleDetail('contexto'); currentContextTab = 'escopo'; renderContextTab();
    setInputValue('ctxEscopo-dataAprovacao', '2026-10-06');
  });
  await expect(page.locator('html')).toHaveClass(/qp-calendar-ready/);
  const field = page.locator('#ctxEscopo-dataAprovacao');
  const popup = page.locator('.qp-calendar');
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await field.click();
    await expect(popup).toBeVisible();
    const bounds = await popup.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await popup.screenshot({ path: testInfo.outputPath(`calendar-${width}.png`) });
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
  }
  await field.click();
  await popup.getByRole('button', { name: 'Selecionar m\u00eas' }).click();
  await expect(popup.getByRole('listbox', { name: 'Meses' })).toBeVisible();
  await popup.screenshot({ path: testInfo.outputPath('month-menu.png') });
  await popup.getByRole('option', { name: 'Julho', exact: true }).click();
  await expect(popup.locator('.cur-month')).toHaveText('Julho');
  await popup.getByRole('button', { name: 'Selecionar m\u00eas' }).click();
  await popup.getByRole('option', { name: 'Outubro', exact: true }).click();
  await popup.locator('.flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)').filter({ hasText: /^15$/ }).click();
  await expect(field).toHaveValue('2026-10-15');
  await field.click();
  await popup.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(field).toHaveValue('');
  await field.click();
  await popup.getByRole('button', { name: 'Hoje', exact: true }).click();
  const today = await page.evaluate(() => {
    const date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  });
  await expect(field).toHaveValue(today);
  await field.evaluate(el => { el.min = '2026-10-10'; el.max = '2026-10-20'; el.value = '2026-10-15'; });
  await field.click();
  await expect(popup.locator('.flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)').filter({ hasText: /^9$/ })).toHaveClass(/flatpickr-disabled/);
  await page.locator('.topbar').first().click({ position: { x: 5, y: 5 } });
  await expect(popup).not.toBeVisible();
  await field.focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(popup).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => renderModuleDetail('equipamentos'));
  const frame = page.locator('.page-content > section > iframe').contentFrame();
  await expect(frame.locator('html')).toHaveClass(/qp-calendar-ready/);
  const calibration = frame.locator('#fUltimaCalib');
  await calibration.fill('2026-10-06');
  await calibration.click();
  await expect(frame.locator('.qp-calendar')).toBeVisible();
  await frame.locator('.qp-calendar .flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)').filter({ hasText: /^16$/ }).click();
  await expect(calibration).toHaveValue('2026-10-16');
});
