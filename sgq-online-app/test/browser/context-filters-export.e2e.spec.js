const { test, expect } = require('@playwright/test');

test('context filters persist across tabs and map export includes all processes', async ({ page, context }, testInfo) => {
  await context.addInitScript(() => { window.print = () => {}; });
  await page.setViewportSize({ width:1700,height:1000 });
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name:'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => {
    renderModuleDetail('contexto');
    contextData.processos = [
      {id:'a',codigo:'EST-001',nome:'Gestão da Qualidade',categoria:'Estratégico',responsavel:'Ana',status:'Ativo'},
      {id:'b',codigo:'OPE-001',nome:'Atendimento <Cliente>',categoria:'Operacional',responsavel:'Bruno',status:'Inativo'},
    ];
    currentContextTab='processos'; renderContextTab();
  });
  await page.locator('[data-context-filter="query"]').fill('gestao');
  await expect(page.locator('.ctxtbl tbody tr')).toHaveCount(1);
  await page.locator('[data-context-filter="responsavel"]').selectOption('Ana');
  await page.locator('[data-context-tab="partes"]').click();
  await expect(page.locator('[data-context-filter="query"]')).toHaveValue('');
  await expect(page.locator('[data-context-filter="frequencia"]')).toBeVisible();
  await page.locator('[data-context-tab="processos"]').click();
  await expect(page.locator('[data-context-filter="query"]')).toHaveValue('gestao');
  await expect(page.locator('[data-context-filter="responsavel"]')).toHaveValue('Ana');
  await page.locator('[data-context-filter="status"]').selectOption('Inativo');
  await expect(page.locator('.context-list-filters')).toContainText('0 de 2');
  await page.getByRole('button',{name:'Limpar filtros'}).click();
  await expect(page.locator('.ctxtbl tbody tr')).toHaveCount(2);
  await page.locator('[data-context-tab="mapa-processos"]').click();
  await expect(page.locator('#contextMapRevision')).toHaveCount(0);
  await page.getByRole('button',{name:'Ampliar mapa em tela cheia',exact:true}).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.getByRole('button',{name:'Sair da tela cheia',exact:true}).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  const opened=page.waitForEvent('popup');
  await page.getByRole('button',{name:'Gerar PDF',exact:true}).click();
  const popup=await opened;
  await expect(popup.locator('header')).toContainText('Mapa de processos');
  await expect(popup.locator('article')).toHaveCount(2);
  await expect(popup.locator('article.inactive')).toContainText('Atendimento <Cliente>');
  await popup.pdf({path:testInfo.outputPath('map.pdf'),preferCSSPageSize:true,printBackground:true});
  await popup.screenshot({path:testInfo.outputPath('map-print.png'),fullPage:true});
  await popup.close();
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-context-tab="processos"]').click();
  await expect(page.locator('[data-context-filter="query"]')).toBeVisible();
});
