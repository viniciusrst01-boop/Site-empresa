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
  await expect(popup.locator('body')).toHaveAttribute('data-print-ready','true');
  await expect(popup.locator('.process-architecture-node')).toHaveCount(2);
  await expect(popup.locator('.process-architecture-node.is-inactive')).toContainText('Atendimento <Cliente>');
  await expect(popup.locator('.process-side-edit')).toHaveCount(0);
  const input = await popup.locator('.process-reference-input').boundingBox();
  const middle = await popup.locator('.process-architecture-body').boundingBox();
  const output = await popup.locator('.process-reference-output').boundingBox();
  expect(input.x + input.width).toBeLessThan(middle.x);
  expect(middle.x + middle.width).toBeLessThan(output.x);
  await expect(popup.locator('.process-reference-improvement')).toBeVisible();
  await popup.pdf({path:testInfo.outputPath('map.pdf'),preferCSSPageSize:true,printBackground:true});
  await popup.screenshot({path:testInfo.outputPath('map-print.png'),fullPage:true});
  await popup.close();
  await page.evaluate(() => {
    document.body.classList.add('theme-white');
    contextData.processos = ['Estratégico','Operacional','Suporte'].flatMap((categoria, group) =>
      Array.from({length:[4,7,6][group]}, (_, i) => ({
        id:group+'-'+i, codigo:['EST','OPE','SUP'][group]+'-00'+i,
        nome:['Gestão Estratégica e Planejamento','Desenvolvimento de Soluções Digitais','Gestão de Documentos e Registros'][group],
        categoria, status:i ? 'Ativo':'Inativo',
      })));
    renderContextTab();
  });
  const lightOpened = page.waitForEvent('popup');
  await page.getByRole('button',{name:'Gerar PDF',exact:true}).click();
  const light = await lightOpened;
  await expect(light.locator('body')).toHaveAttribute('data-print-ready','true');
  await expect(light.locator('.process-architecture-node')).toHaveCount(17);
  await light.emulateMedia({media:'print'});
  await expect(light.locator('.process-reference-map')).toBeVisible();
  await expect(light.locator('.process-architecture-node').first()).toBeVisible();
  await light.setViewportSize({width:1123,height:794});
  const geometry = await light.evaluate(() => {
    const map = document.querySelector('.process-reference-map');
    const input = document.querySelector('.process-reference-input').getBoundingClientRect();
    const output = document.querySelector('.process-reference-output').getBoundingClientRect();
    const middle = document.querySelector('.process-architecture-body').getBoundingClientRect();
    return {left:input.right < middle.left, right:middle.right < output.left,
      bottom:map.getBoundingClientRect().bottom,
      clipped:[...document.querySelectorAll('.process-architecture-node')].some(node => node.scrollWidth > node.clientWidth + 1)};
  });
  expect(geometry.left && geometry.right).toBe(true);
  expect(geometry.bottom).toBeLessThan(719);
  expect(geometry.clipped).toBe(false);
  await light.pdf({path:testInfo.outputPath('map-light.pdf'),preferCSSPageSize:true,printBackground:true});
  await light.screenshot({path:testInfo.outputPath('map-light.png'),fullPage:true});
  await light.close();
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-context-tab="processos"]').click();
  await expect(page.locator('[data-context-filter="query"]')).toBeVisible();
});
