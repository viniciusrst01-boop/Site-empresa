const { test, expect } = require("@playwright/test");

test("corrective action retains multiple file contents and individual removal", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => {
    renderModuleDetail("nao-conformidades");
    ncCurrentId = state.ncs[0].id;
    openNcActions();
  });
  await page.locator("#ncActionDesc").fill("Multiple attachments regression");
  await page.locator("#ncActionStatus").selectOption("Concluída");
  await page.locator("#ncActionEvidence").setInputFiles([1, 2, 3].map((number) => ({ name: `action-${number}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") })));
  await expect(page.locator("#ncEvidenceName .nc-attachment-row")).toHaveCount(3);
  await page.locator("#ncSaveAction").click();
  const action = page.locator(".acao-item", { hasText: "Multiple attachments regression" });
  await action.locator("[data-action-edit]").click();
  await expect(page.locator("#ncEvidenceName .nc-attachment-row")).toHaveCount(3);
  const attachmentId = await page.evaluate(() => document.querySelector("#ncActionEvidence").ncFiles[1].id);
  expect((await page.request.get(`/api/nc-attachments?id=${attachmentId}`)).status()).toBe(200);
  await page.getByRole("button", { name: "Excluir action-2.pdf", exact: true }).click();
  await page.locator("#ncSaveAction").click();
  await action.locator("[data-action-edit]").click();
  await expect(page.locator("#ncEvidenceName .nc-attachment-row")).toHaveCount(2);
});

test("leadership persists three attachments and removes only the selected file", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.evaluate(() => renderModuleDetail("lideranca"));
  await page.locator('[data-lc-action="edit-acao"]').first().click();
  const files = [1, 2, 3].map((number) => ({ name: `evidence-${number}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") }));
  await page.locator("#lcEvidenceFile").setInputFiles(files);
  await expect(page.locator("#lcEvidenceFileName .nc-attachment-row")).toHaveCount(3);
  await page.locator("#lcEvidenceFile").setInputFiles({ ...files[0], name: "fourth.pdf" });
  await expect(page.locator("#lcEvidenceFileName .nc-attachment-row")).toHaveCount(3);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator("#leadershipRecordModal")).toHaveCount(0);
  const row = page.locator("tr", { hasText: "Reunião mensal com análise dos indicadores" });
  await expect(row.locator(".table-file-link")).toHaveCount(3);
  const href = await row.locator(".table-file-link").nth(1).getAttribute("href");
  expect((await page.request.get(href)).status()).toBe(200);
  await row.locator('[data-lc-action="edit-acao"]').click();
  await page.getByRole("button", { name: "Excluir evidence-2.pdf", exact: true }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(row.locator(".table-file-link")).toHaveCount(2);
  await expect(row).not.toContainText("evidence-2.pdf");
});
