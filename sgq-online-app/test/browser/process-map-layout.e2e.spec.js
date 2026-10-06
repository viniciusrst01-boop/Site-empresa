const { test, expect } = require('@playwright/test');

test('mapa organiza 17 processos em faixas e identifica inativos', async ({ page }, testInfo) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => {
    renderModuleDetail('contexto');
    contextData.processos = ['Estratégico','Operacional','Suporte'].flatMap((categoria, g) => Array.from({ length: [4,7,6][g] }, (_, i) => ({ id: `${g}-${i}`, codigo: `PR-${g}${i}`, nome: `Gestão de processos ${i + 1}`, categoria, status: i === 0 ? 'Inativo' : 'Ativo', objetivo: 'Planeja e acompanha as atividades e os resultados da organização.', saidas: [] })));
    currentContextTab = 'mapa-processos'; renderContextTab();
  });
  for (const width of [1700, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const map = page.locator('.process-reference-map');
    await expect(map.locator('.process-architecture-node')).toHaveCount(17);
    await expect(map.locator('.process-inactive-label')).toHaveCount(3);
    expect(await map.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await map.screenshot({ path: testInfo.outputPath(`map-${width}.png`) });
  }
});
