const { test, expect } = require('@playwright/test');

test('parte interessada salva, reabre e remove evidencias', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('browser.owner@example.com');
  await page.getByLabel('Senha').fill('Browser-Teste-123');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => { renderModuleDetail('contexto'); openContextParte(); });
  await page.locator('#contextParteNome').fill('Parte com evidência');
  await page.locator('#contextParteNecessidade').fill('Necessidade registrada');
  await page.locator('#contextParteEvidencias').setInputFiles({
    name: 'evidencia-parte.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 evidencia'),
  });
  await expect(page.locator('#contextParteEvidenciasLista .nc-attachment-row')).toHaveText(/evidencia-parte\.pdf/);
  const upload = page.waitForResponse(response => response.url().includes('/api/context-attachments') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await upload;
  const saved = await page.evaluate(() => contextGet('partes').find(row => row.parte === 'Parte com evidência'));
  expect(saved.evidencias).toHaveLength(1);
  expect(saved.evidencias[0].name).toBe('evidencia-parte.pdf');
  await expect.poll(async () => (await page.request.get(`/api/context-attachments?id=${saved.evidencias[0].id}`)).status()).toBe(200);
  await page.evaluate(id => openContextParte(id), saved.id);
  await expect(page.locator('#contextParteEvidenciasLista .nc-attachment-row')).toHaveText(/evidencia-parte\.pdf/);
  await page.getByRole('button', { name: 'Excluir evidencia-parte.pdf' }).click();
  const removed = page.waitForResponse(response => response.url().includes('/api/context-attachments') && response.request().method() === 'DELETE');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await removed;
  expect(await page.evaluate(id => contextGet('partes').find(row => row.id === id).evidencias, saved.id)).toEqual([]);
});
