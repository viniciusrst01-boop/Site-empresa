const { test, expect } = require('@playwright/test');

test('mobile home chart and navigation preserve desktop', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  for (const width of [390, 360, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator('.mobile-workspace-nav')).toBeVisible();
    await expect(page.locator('.sgq-health-canvas canvas')).toBeVisible();
    await expect.poll(async () => (await page.locator('.sgq-health-canvas').boundingBox()).height).toBeGreaterThanOrEqual(150);
    const bounds = await page.locator('.sgq-health-canvas').boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(150);
    expect(bounds.y).toBeLessThan(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  }
  await page.screenshot({ path: 'test-results/mobile-home.png', fullPage: true });
  await expect(page.locator('.topbar [data-view-target="notificacoes"]')).toBeVisible();
  await page.getByRole('button', { name: 'Pesquisar', exact: true }).click();
  await expect(page.locator('#dashboardGlobalSearch')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('[data-mobile-view="modulos"]').click();
  await page.locator('[data-mobile-view="relatorios"]').click();
  await expect(page.locator('[data-mobile-view="relatorios"]')).toHaveAttribute('aria-current', 'page');
  await page.locator('[data-mobile-view="modulos"]').click();
  await expect(page.locator('[data-mobile-view="modulos"]')).toHaveAttribute('aria-current', 'page');
  await page.locator('[data-mobile-view="menu"]').click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.sidebar')).toBeHidden();
  await page.locator('[data-mobile-view="inicio"]').click();
  await page.goto('/app?previewHealth=1');
  for (const theme of ['', 'theme-light', 'theme-white']) {
    await page.evaluate(theme => {
      document.body.classList.remove('theme-light', 'theme-white');
      if (theme) document.body.classList.add(theme);
    }, theme);
    await expect(page.locator('.sgq-health-message')).toBeHidden();
    await page.screenshot({ path: `test-results/mobile-${theme || 'dark'}.png`, fullPage: true });
    await page.locator('.home-v2-bottom-grid').scrollIntoViewIfNeeded();
    await expect(page.locator('.home-v2-bottom-grid')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.evaluate(() => scrollTo(0, 0));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.mobile-workspace-nav')).toBeHidden();
  await expect(page.locator('.sidebar')).toBeVisible();
});
