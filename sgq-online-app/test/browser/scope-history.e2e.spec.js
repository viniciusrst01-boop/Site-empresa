const { test, expect } = require('@playwright/test');

test('historico preserva revisoes e dados apos limpar e recarregar', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => {
    renderModuleDetail('contexto');
    currentContextTab = 'escopo';
    contextSet('escopo', { ...blankContextEscopo(), revisao: '01', historico: [{ revisao: '01', data: '2026-10-05', descricao: 'Revisao legada' }] });
    renderContextTab();
  });
  await page.locator('#ctxEscopo-escopoOficial').fill('Escopo que deve ser preservado');
  await page.getByLabel('Descrição do que foi alterado').fill('Incluidos novos servicos <teste>');
  await page.locator('[data-context-action="save-escopo"]').click();
  await page.locator('[data-context-action="view-escopo-history"]').click();
  const modal = page.locator('#contextScopeHistoryModal');
  await expect(modal).toContainText('Incluidos novos servicos <teste>');
  await expect(modal).toContainText('Revisao legada');
  await page.getByRole('button', { name: 'Fechar histórico' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-context-action="clear-escopo"]').click();
  await expect(page.locator('#ctxEscopo-escopoOficial')).toHaveValue('');
  const saved = await page.evaluate(() => contextGet('escopo'));
  expect(saved.historico).toHaveLength(3);
  expect(saved.historico.at(-1).acao).toBe('limpeza');
  expect(saved.historico.at(-1).dados.escopoOficial).toBe('Escopo que deve ser preservado');
  await expect.poll(() => page.evaluate(async () => {
    const response = await fetch('/api/bootstrap');
    const data = await response.json();
    return JSON.stringify(data).includes('Escopo limpo.');
  })).toBe(true);
  await page.reload();
  await page.evaluate(() => { renderModuleDetail('contexto'); currentContextTab = 'escopo'; renderContextTab(); });
  await page.locator('[data-context-action="view-escopo-history"]').click();
  await expect(modal).toContainText('Escopo limpo.');
  await modal.getByText('Dados preservados antes da limpeza').click();
  await expect(modal.getByText('Escopo que deve ser preservado').first()).toBeVisible();
});
