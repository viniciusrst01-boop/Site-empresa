const { test, expect } = require("@playwright/test");

async function loginOwner(page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("módulo de não conformidades mantém o fluxo funcional", async ({ page }, testInfo) => {
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await loginOwner(page);
  await page.locator('[data-module-card="nao-conformidades"]').first().click();
  await expect(page.getByRole("heading", { name: "Não Conformidades", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toHaveClass(/home-dashboard/);

  await page.getByRole("button", { name: "Cadastros" }).click();
  await page.getByRole("button", { name: "Inserir novo" }).click();
  await page.locator("#ncCatalogName").fill("Cliente E2E");
  await page.locator("#ncCatalogCode").fill("CLI-E2E");
  await page.locator("#ncCatalogSave").click();
  await expect(page.getByText("Cliente E2E", { exact: true })).toBeVisible();

  const catalogRow = page.locator(".ctxtbl tbody tr", { hasText: "Cliente E2E" });
  page.once("dialog", (dialog) => dialog.accept());
  await catalogRow.getByTitle("Excluir").click();
  await expect(page.getByText("Cliente E2E", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Registrar NC" }).click();
  const registerLayout = await page.locator("body").evaluate((body) => ({
    scrollHeight: body.scrollHeight,
    viewportHeight: window.innerHeight,
    overflowY: getComputedStyle(body).overflowY,
  }));
  expect(registerLayout.scrollHeight).toBeGreaterThan(registerLayout.viewportHeight);
  expect(registerLayout.overflowY).not.toBe("hidden");
  await page.locator("#ncItem").fill("ITEM-E2E");
  await page.locator("#ncOrigin").selectOption({ label: "Interno" });
  await page.locator("#ncSector").selectOption({ index: 1 });
  await page.locator("#ncProcess").selectOption({ index: 1 });
  await page.locator("#ncSeverity").selectOption({ label: "Maior" });
  await page.locator("#ncDescription").fill("Não conformidade criada no teste de navegador");
  await page.locator("[data-nc-save]").click();

  await expect(page.getByText(/RNC-\d{4}-\d{4} registrado com sucesso/)).toBeVisible();
  const rncLink = page.locator(".rnc-link", { hasText: /^RNC-/ }).first();
  await expect(rncLink).toBeVisible();
  await rncLink.click();

  await page.locator("#ncEditIsh").click();
  await page.locator('[data-ish="metodo"]').fill("Procedimento de inspeção incompleto");
  await page.locator('[data-ish="causaRaiz"]').fill("Critério de aceitação não definido");
  await page.locator("#ncSaveIsh").click();
  await expect(page.getByText("Critério de aceitação não definido", { exact: true })).toBeVisible();

  await page.locator("#ncManageActions").click();
  await page.locator("#ncActionDesc").fill("Revisar procedimento de inspeção");
  await page.locator("#ncActionDue").fill("2027-01-15");
  await page.locator("#ncActionStatus").selectOption({ label: "Concluída" });
  await page.locator("#ncSaveAction").click();
  await expect(page.getByText("Revisar procedimento de inspeção", { exact: true })).toBeVisible();
  await page.locator("[data-nc-close]").first().click();

  await page.getByRole("button", { name: "Dashboards" }).click();
  await expect(page.getByRole("heading", { name: "Gráfico de Pareto" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Transmitir/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("dashboard-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".dash-cards")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("dashboard-mobile.png"), fullPage: true });
  expect(browserErrors).toEqual([]);
});
