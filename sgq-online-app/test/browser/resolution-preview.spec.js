const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
test('dashboard fits every resolution', async ({ page }) => {
  const output = path.resolve('test-results/resolution-gallery');
  fs.mkdirSync(output, { recursive: true });
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await page.locator('.home-v2, #onboardingForm').first().waitFor();
  const onboarding = page.getByRole('button', { name: 'Salvar e entrar no sistema' });
  if (await onboarding.count()) await onboarding.click();
  const sizes = [[1920,1080],[1536,864],[1440,900],[1366,768],[1366,638],[1280,720],[1024,768],[768,1024],[390,844]];
  for (const [width,height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto('/app?previewHealth=1');
    await expect(page.locator('.sgq-health-plot')).toHaveAttribute('aria-busy','false');
    const target = (width === 1366 && height === 768) || (width === 1536 && height === 864) || (width === 1440 && height === 900) || (width === 1280 && height === 720) || (width === 1366 && height === 638);
    await expect.poll(() => page.locator('.home-v2').evaluate((dashboard) => Boolean(dashboard.style.zoom))).toBe(target);
    if (target) {
      await expect.poll(() => page.evaluate(() => {
        const page = document.querySelector('.page-content');
        return page.scrollHeight - page.clientHeight;
      })).toBeLessThanOrEqual(1);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('.home-v2-module, .sgq-health-indicator')].flatMap(card => {
        const b = card.getBoundingClientRect();
        return [...card.children].filter(child => { const r = child.getBoundingClientRect(); return r.bottom > b.bottom + 1 || r.right > b.right + 1; }).map(child => child.className);
      }));
      expect(overflow, `${width}x${height}`).toEqual([]);
      await expect(page.locator('.home-v2-bottom-grid')).toBeInViewport({ ratio: 1 });
      const healthLayout = await page.evaluate(() => {
        const plot = document.querySelector('.sgq-health-plot').getBoundingClientRect();
        const indicators = document.querySelector('.sgq-health-indicators').getBoundingClientRect();
        const legendRows = new Set([...document.querySelectorAll('.sgq-health-legend > span')].map((item) => Math.round(item.getBoundingClientRect().top)));
        return { plotWidth: plot.width, indicatorsWidth: indicators.width, legendRows: legendRows.size };
      });
      expect(healthLayout.plotWidth).toBeGreaterThan(healthLayout.indicatorsWidth * 2);
      expect(healthLayout.legendRows).toBe(1);
      const bottomHeadingRows = await page.evaluate(() => [...document.querySelectorAll('.home-v2-bottom-grid .home-v2-heading > div')].map((heading) => {
        const title = heading.querySelector('h2').getBoundingClientRect();
        const description = heading.querySelector('p').getBoundingClientRect();
        return Math.abs(title.top - description.top);
      }));
      expect(bottomHeadingRows.every((difference) => difference < 4)).toBe(true);
      const compact1280 = (width === 1280 && height === 720) || (width === 1366 && height === 638);
      await expect(page.locator('.topbar-title')).toHaveCSS('font-size', compact1280 ? '14px' : '15px');
      await expect(page.locator('.topbar-subtitle')).toHaveCSS('font-size', compact1280 ? '9.5px' : '11px');
      await expect(page.locator('.tb-user-name')).toHaveCSS('font-size', compact1280 ? '10px' : '11.5px');
      await expect(page.locator('.tb-user-role')).toHaveCSS('font-size', compact1280 ? '9px' : '10px');
      await expect(page.locator('.sidebar')).toHaveCSS('width', compact1280 ? '160px' : '180px');
      await expect(page.locator('.nav-item').first()).toHaveCSS('font-size', compact1280 ? '11px' : '12px');
      await expect(page.locator('.sb-help-card .htitle')).toHaveCSS('font-size', compact1280 ? '11px' : '12px');
      await expect(page.locator('.sb-help-card .hdesc')).toHaveCSS('font-size', compact1280 ? '9.5px' : '10.5px');
      await expect(page.locator('.btn-support')).toHaveCSS('font-size', compact1280 ? '10px' : '11px');
    }
    await page.screenshot({ path: path.join(output, `${width}-${height}.png`), animations:'disabled' });
  }
  for (const [width, height] of [[1366, 768], [1536, 864], [1440, 900], [1280, 720], [1366, 638]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/app?previewHealth=1');
    const sidebarMetrics = () => page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar').getBoundingClientRect();
      const help = document.querySelector('.sb-help-card').getBoundingClientRect();
      return {
        width: sidebar.width,
        navFont: getComputedStyle(document.querySelector('.nav-item')).fontSize,
        helpWidth: help.width,
        helpHeight: help.height,
        helpTitleFont: getComputedStyle(document.querySelector('.sb-help-card .htitle')).fontSize,
      };
    });
    const expectedSidebar = await sidebarMetrics();
    for (const view of ['modulos', 'empresa', 'usuarios', 'relatorios', 'configuracoes']) {
      await page.locator(`[data-view="${view}"]`).first().click();
      await expect(page.locator(`[data-view="${view}"]`).first()).toHaveClass(/active/);
      await expect.poll(sidebarMetrics).toEqual(expectedSidebar);
      if (view === 'modulos') await page.screenshot({ path: path.join(output, `${width}-${height}-modulos.png`), animations:'disabled' });
    }
  }
});
