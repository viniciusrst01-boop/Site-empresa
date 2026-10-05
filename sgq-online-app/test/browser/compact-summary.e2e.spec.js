const { test, expect } = require('@playwright/test');

test('todos os módulos exibem resumos compactos e conteúdo acessível', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1700, height: 950 });
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  const modules = ['contexto', 'lideranca', 'riscos', 'documentos', 'nao-conformidades', 'auditorias', 'equipamentos', 'satisfacao-clientes', 'fornecedores', 'mudancas-climaticas'];
  const positions = [];
  for (const id of modules) {
    await page.setViewportSize({ width: 1700, height: 950 });
    await page.evaluate(moduleId => renderModuleDetail(moduleId), id);
    const frame = page.locator('.page-content > section > iframe');
    const surface = await frame.count() ? frame.contentFrame() : page;
    const header = surface.locator('.compact-summary-header, .climate-summary-header').first();
    await expect(header).toBeVisible();
    if (id === 'auditorias') await expect(header.locator('.module-iso-eyebrow')).toHaveText('PLANEJAMENTO E ACOMPANHAMENTO DE AUDITORIAS · 9.2');
    const tabs = surface.locator('.ctx-tabs > .ctx-tab, .documents-tabs > .documents-tab');
    await expect(tabs.first()).toBeVisible();
    expect(await tabs.evaluateAll(nodes => nodes.every(node => {
      const style = getComputedStyle(node);
      return style.fontSize === '13.5px' && style.fontWeight === '800' && style.fontFamily.includes('Plus Jakarta Sans');
    })), `${id}: fonte das abas igual a Mudanças Climáticas`).toBe(true);
    const cards = header.locator('.compact-module-card, .nc-progress-card, .equipment-summary-row > .dash-solid-card');
    await expect(cards).toHaveCount(4);
    await expect.poll(() => cards.evaluateAll(nodes => nodes.slice(1).map((node, index) => Math.round(node.getBoundingClientRect().left - nodes[index].getBoundingClientRect().right))), { message: `${id}: intervalo entre cards` }).toEqual([12, 12, 12]);
    await expect.poll(() => header.evaluate(el => {
      const heading = el.firstElementChild;
      const row = el.lastElementChild.getBoundingClientRect();
      const lines = [...heading.querySelectorAll('.breadcrumb, .welcome-eyebrow')].map(node => {
        const range = document.createRange(); range.selectNodeContents(node); return range.getBoundingClientRect();
      }).filter(rect => rect.height);
      return Math.abs((Math.min(...lines.map(rect => rect.top)) + Math.max(...lines.map(rect => rect.bottom))) / 2 - (row.top + row.height / 2));
    }), { message: `${id}: alinhamento vertical` }).toBeLessThan(2);
    positions.push({ id, ...await header.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const heading = el.firstElementChild;
      const breadcrumb = heading.querySelector('.breadcrumb').getBoundingClientRect();
      const eyebrow = heading.querySelector('.welcome-eyebrow').getBoundingClientRect();
      return { textX: breadcrumb.x - rect.x, textY: breadcrumb.y - rect.y, subtitleY: eyebrow.y - rect.y, cardsX: el.lastElementChild.getBoundingClientRect().x - rect.x };
    }) });
    const heights = await cards.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
    if (id === 'equipamentos') {
      expect(heights).toEqual([52, 52, 52, 52]);
      expect(await page.locator('.equipment-page-content').evaluate(el => getComputedStyle(el).paddingBottom)).toBe('6px');
      expect(await surface.locator('.page-content').evaluate(el => getComputedStyle(el).paddingBottom)).toBe('0px');
      expect(await surface.locator('#tabContent').evaluate(el => getComputedStyle(el).paddingBottom)).toBe('4px');
    }
    expect(await header.evaluate(el => el.getBoundingClientRect().height), `${id}: altura do cabeçalho`).toBe(52);
    expect(Math.max(...heights), id).toBeLessThan(90);
    await page.screenshot({ path: testInfo.outputPath(`${id}-desktop.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(header).toBeVisible();
    const overflow = await cards.evaluateAll(nodes => nodes.some(node => node.scrollWidth > node.clientWidth + 1));
    expect(overflow, `${id}: conteúdo do card`).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`${id}-mobile.png`) });
  }
  const reference = positions.find(item => item.id === 'mudancas-climaticas');
  for (const position of positions) {
    for (const key of ['textX', 'textY', 'subtitleY', 'cardsX']) {
      expect(Math.abs(position[key] - reference[key]), `${position.id}: ${key} igual ao módulo climático`).toBeLessThan(2);
    }
  }
});

test('transmitir fica nos indicadores e acompanha os filtros', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => renderModuleDetail('nao-conformidades'));
  await expect(page.locator('.compact-summary-header').getByText('Transmitir')).toHaveCount(0);
  await page.getByRole('button', { name: 'Indicadores', exact: true }).click();
  const panel = page.frameLocator('iframe[title="Indicadores de Não conformidades"]');
  const link = panel.getByRole('link', { name: 'Transmitir' });
  await expect(link).toBeVisible();
  await expect(panel.locator('.tv-header-actions > :first-child')).toHaveAttribute('id', 'tvTransmit');
  await panel.locator('#tvDimension').selectOption('setor');
  await expect(link).toHaveAttribute('href', /dim=setor/);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(panel.locator('#tvBack')).toBeHidden();
  await page.goto(await link.getAttribute('href'));
  await page.getByRole('link', { name: 'Voltar aos indicadores de Não Conformidades' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('[data-nc-tab="dashboards"]')).toHaveClass(/active/);
});
