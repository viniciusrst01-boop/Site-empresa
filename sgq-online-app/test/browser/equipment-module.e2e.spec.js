const { test, expect } = require("@playwright/test");

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("equipamentos carrega a base demonstrativa para empresa sem cadastros", async ({ page }) => {
  await login(page);
  await page.evaluate(() => {
    state.equipment = [];
    state.equipmentDistributions = [];
    delete state.equipmentDemoVersion;
    renderModuleDetail("equipamentos");
  });

  const frame = page.frameLocator('iframe[title="Equipamentos de Medição"]');
  await expect(frame.locator("#kpiRow")).toBeVisible();
  await expect(frame.locator("#kpiRow .dash-solid-card")).toHaveCount(4);
  await expect(frame.locator("#kpiRow .kpi-card")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => ({ equipment: state.equipment.length, distributions: state.equipmentDistributions.length }))).toEqual({ equipment: 20, distributions: 12 });
  await frame.locator('[data-tab="indicadores"]').click();
  await expect(frame.locator("#tabContent .dash-solid-card")).toHaveCount(0);
  await expect(frame.locator("canvas#eqModelo")).toBeVisible();
  const indicatorData = await frame.locator("canvas#eqDist").evaluate(() => ({
    distributions: eqCharts.eqDist.data.datasets[0].data,
    situations: eqCharts.eqRadar.data.datasets[0].data,
  }));
  expect(indicatorData.distributions.filter(Boolean)).toHaveLength(12);
  expect(indicatorData.situations.filter(Boolean).length).toBeGreaterThan(3);
});

test("equipamentos usa dados da empresa e persiste cadastro e distribuição", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await login(page);
  await page.evaluate(() => {
    state.equipment = [];
    state.equipmentDistributions = [];
    state.equipmentDemoVersion = 2;
    renderModuleDetail("equipamentos");
  });

  const frame = page.frameLocator('iframe[title="Equipamentos de Medição"]');
  await expect(frame.locator("#kpiRow")).toBeVisible();
  await expect(frame.locator(".sidebar")).toHaveCount(0);
  await expect(frame.locator(".topbar")).toHaveCount(0);
  await expect(frame.getByText("Cadastro de equipamento")).toBeVisible();

  await frame.locator("#fCodigo").fill("EQ-TESTE-001");
  await frame.locator("#fDescricao").fill("Paquímetro de integração");
  await frame.locator("#fSetor").fill("Qualidade");
  await frame.getByText("Salvar equipamento", { exact: true }).click();
  await expect(frame.getByText("Equipamento cadastrado com sucesso")).toBeVisible();
  await expect.poll(() => page.evaluate(() => state.equipment.length)).toBe(1);

  await frame.locator('[data-tab="controle"]').click();
  await expect(frame.getByText("Paquímetro de integração")).toBeVisible();

  await frame.locator('[data-tab="distribuicao"]').click();
  await frame.locator("#tabContent .btn-grad").click();
  await frame.locator("#distEquipBusca").fill("EQ-TESTE-001");
  await frame.locator(".combo-item").first().click();
  await frame.locator("#distSetor").fill("Qualidade");
  await frame.locator("#modalDist .btn-primary").evaluate((button) => button.click());
  await expect.poll(() => page.evaluate(() => state.equipmentDistributions.length)).toBe(1);

  await frame.locator('[data-tab="indicadores"]').click();
  await expect(frame.locator("canvas#eqModelo")).toBeVisible();
  expect(pageErrors).toEqual([]);
  const treeType = await frame.locator("canvas#eqTree").evaluate(() => ({
    chartType: eqCharts.eqTree?.getDatasetMeta(0)?.type,
    charts: Object.keys(eqCharts),
    registered: Boolean(Chart.registry.controllers.get("treemap")),
  }));
  expect(treeType).toEqual({ chartType: "treemap", charts: ["eqCombo", "eqSetor", "eqModelo", "eqDist", "eqRadar", "eqTree"], registered: true });
});
