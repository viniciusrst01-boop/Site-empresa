const { test, expect } = require("@playwright/test");

async function loginOwner(page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function expectCompactNcFrame(page) {
  const layout = await page.locator("body").evaluate((body) => ({
    overflowY: getComputedStyle(body).overflowY,
    tabsTop: document.querySelector("#ncMainTabs")?.getBoundingClientRect().top,
    tabsBottom: document.querySelector("#ncMainTabs")?.getBoundingClientRect().bottom,
    viewportHeight: window.innerHeight,
  }));
  expect(layout.overflowY).toBe("hidden");
  expect(layout.tabsTop).toBeGreaterThan(0);
  expect(layout.tabsBottom).toBeLessThan(layout.viewportHeight);
}

test("módulo de não conformidades mantém o fluxo funcional", async ({ page }, testInfo) => {
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });

  await loginOwner(page);
  await page.locator('[data-view="modulos"]').click();
  await page.evaluate(() => document.body.classList.add("home-dashboard"));
  await page.locator('[data-module-card="nao-conformidades"]').first().click();
  await expect(page.getByRole("heading", { name: "Não Conformidades", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toHaveClass(/home-dashboard/);

  await page.getByRole("button", { name: "Cadastros" }).click();
  await expectCompactNcFrame(page);
  await page.getByRole("button", { name: "Inserir novo" }).click();
  await page.locator("#ncCatalogName").fill("Cliente E2E");
  await page.locator("#ncCatalogCode").fill("CLI-E2E");
  await page.locator("#ncCatalogSave").click();
  await expect(page.getByText("Cliente E2E", { exact: true })).toBeVisible();

  const catalogRow = page.locator(".ctxtbl tbody tr", { hasText: "Cliente E2E" });
  page.once("dialog", (dialog) => dialog.accept());
  await catalogRow.getByTitle("Excluir").click();
  await expect(page.getByText("Cliente E2E", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("cadastros-desktop-fit.png"), fullPage: true });

  await page.getByRole("button", { name: "Registrar NC" }).click();
  await expectCompactNcFrame(page);
  const registerLayout = await page.locator("body").evaluate((body) => ({
    overflowY: getComputedStyle(body).overflowY,
    formBottom: document.querySelector(".nc-register-form")?.getBoundingClientRect().bottom,
    actionsBottom: document.querySelector(".nc-register-footer")?.getBoundingClientRect().bottom,
    viewportHeight: window.innerHeight,
  }));
  expect(registerLayout.overflowY).toBe("hidden");
  expect(registerLayout.formBottom).toBeLessThanOrEqual(registerLayout.viewportHeight - 34);
  expect(registerLayout.actionsBottom).toBeLessThanOrEqual(registerLayout.viewportHeight - 34);
  await expect(page.locator("[data-nc-save]")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("register-desktop-fit.png"), fullPage: true });
  await page.locator("#ncItem").fill("ITEM-E2E");
  await page.locator("#ncOrigin").selectOption({ label: "Interno" });
  await page.locator("#ncSector").selectOption({ index: 1 });
  await page.locator("#ncProcess").selectOption({ index: 1 });
  await page.locator("#ncSeverity").selectOption({ label: "Maior" });
  await page.locator("#ncDescription").fill("Não conformidade criada no teste de navegador");
  await page.locator("[data-nc-save]").click();

  await expect(page.getByText(/RNC-\d{4}-\d{4} registrado com sucesso/)).toBeVisible();
  await expectCompactNcFrame(page);
  await page.screenshot({ path: testInfo.outputPath("controle-desktop-fit.png"), fullPage: true });
  const rncLink = page.locator(".rnc-link", { hasText: /^RNC-/ }).first();
  await expect(rncLink).toBeVisible();
  const rncId = (await rncLink.textContent()).trim();
  const rncRow = page.locator(".nc-control-table tbody tr").filter({ hasText: rncId });
  await expect(rncRow.getByTitle("Editar RNC")).toBeVisible();
  await expect(rncRow.getByTitle("Excluir RNC")).toBeVisible();
  await rncRow.getByTitle("Editar RNC").click();
  await expect(page.getByRole("heading", { name: `Editar ${rncId}` })).toBeVisible();
  await page.locator("#ncEditItem").fill("ITEM-E2E-EDITADO");
  await page.locator("#ncEditDescription").fill("Descrição atualizada pelo teste de navegador");
  await page.locator("#ncEditSave").click();
  await page.waitForTimeout(100);
  expect(browserErrors).toEqual([]);
  await expect(page.getByText(`${rncId} atualizado com sucesso.`)).toBeVisible();
  await expect(rncLink).toBeVisible();
  await rncLink.click();
  await expect(page.getByText("ITEM-E2E-EDITADO", { exact: true })).toBeVisible();
  await expect(page.getByText("Descrição atualizada pelo teste de navegador", { exact: true })).toBeVisible();

  await page.locator("#ncEditIsh").click();
  await page.locator('[data-ish="metodo"]').fill("Procedimento de inspeção incompleto");
  await page.locator('[data-ish="causaRaiz"]').fill("Critério de aceitação não definido");
  await page.locator("#ncSaveIsh").click();
  await expect(page.getByText("Critério de aceitação não definido", { exact: true })).toBeVisible();

  await page.locator("#ncManageActions").click();
  await expect(page.locator("#ncActionStatus option")).toHaveText(["Em andamento", "Concluída"]);
  await expect(page.locator("#ncActionEvidenceWrap")).toBeHidden();
  await page.locator("#ncActionDesc").fill("Revisar procedimento de inspeção");
  await page.locator("#ncActionDue").fill("2020-01-15");
  await page.locator("#ncSaveAction").click();
  const correctiveAction = page.locator(".acao-item", { hasText: "Revisar procedimento de inspeção" });
  await expect(correctiveAction).toContainText("Atrasada");
  await correctiveAction.getByTitle("Editar").click();
  await expect(page.locator("#ncActionStatus")).toHaveValue("Em andamento");
  await expect(page.locator("#ncActionEvidenceWrap")).toBeHidden();
  await page.locator("#ncActionStatus").selectOption({ label: "Concluída" });
  await expect(page.locator("#ncActionEvidenceWrap")).toBeVisible();
  await page.locator("#ncSaveAction").click();
  await expect(correctiveAction).toContainText("Concluída");
  await page.locator("[data-nc-close]").first().click();

  await page.getByRole("button", { name: "Dashboards" }).click();
  await expectCompactNcFrame(page);
  await expect(page.getByRole("heading", { name: "Gráfico de Pareto" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Transmitir/ })).toBeVisible();
  const dashboardLayout = await page.locator("#ncTabContent").evaluate((content) => ({
    clientHeight: content.clientHeight,
    scrollHeight: content.scrollHeight,
  }));
  expect(dashboardLayout.scrollHeight).toBeLessThanOrEqual(dashboardLayout.clientHeight + 1);
  await page.screenshot({ path: testInfo.outputPath("dashboard-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".dash-cards")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("dashboard-mobile.png"), fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Controle" }).click();
  const rowToDelete = page.locator(".nc-control-table tbody tr").filter({ hasText: rncId });
  page.once("dialog", (dialog) => dialog.accept());
  await rowToDelete.getByTitle("Excluir RNC").click();
  await expect(page.getByText(`${rncId} excluído com sucesso.`)).toBeVisible();
  await expect(page.locator(".rnc-link", { hasText: rncId })).toHaveCount(0);
  expect(browserErrors).toEqual([]);
});
