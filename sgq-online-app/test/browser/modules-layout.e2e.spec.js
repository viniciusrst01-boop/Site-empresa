const { test, expect } = require("@playwright/test");

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("Meus módulos segue a grade compacta sem rolagem", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1830, height: 860 });
  await login(page);
  await page.locator('[data-view="modulos"]').click();
  await expect(page.getByRole("heading", { name: "Módulos contratados" })).toBeVisible();

  const cards = page.locator(".mymods-grid .mymod-card");
  await expect(cards).toHaveCount(9);
  const layout = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const content = document.querySelector(".modules-page-content");
    const grid = document.querySelector(".mymods-grid");
    return {
      rootX: root.scrollWidth - root.clientWidth,
      rootY: root.scrollHeight - root.clientHeight,
      bodyX: body.scrollWidth - body.clientWidth,
      bodyY: body.scrollHeight - body.clientHeight,
      contentX: content.scrollWidth - content.clientWidth,
      contentY: content.scrollHeight - content.clientHeight,
      columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
      rows: getComputedStyle(grid).gridTemplateRows.split(" ").length,
    };
  });

  expect(layout.rootX).toBeLessThanOrEqual(0);
  expect(layout.rootY).toBeLessThanOrEqual(0);
  expect(layout.bodyX).toBeLessThanOrEqual(0);
  expect(layout.bodyY).toBeLessThanOrEqual(0);
  expect(layout.contentX).toBeLessThanOrEqual(0);
  expect(layout.contentY).toBeLessThanOrEqual(0);
  expect(layout.columns).toBe(3);
  expect(layout.rows).toBe(3);
  await expect(page.locator(".mymod-title", { hasText: "Treinamentos" })).toBeVisible();
  await expect(page.locator(".mymod-title", { hasText: "Fornecedores" })).toBeVisible();
  await expect(page.getByText("7 / 9", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Módulos disponíveis para contratação" })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("modules-layout-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const laptopLayout = await page.evaluate(() => {
    const root = document.documentElement;
    const content = document.querySelector(".modules-page-content");
    const cards = [...document.querySelectorAll(".mymods-grid .mymod-card")];
    return {
      rootX: root.scrollWidth - root.clientWidth,
      rootY: root.scrollHeight - root.clientHeight,
      contentX: content.scrollWidth - content.clientWidth,
      contentY: content.scrollHeight - content.clientHeight,
      scrollY: window.scrollY,
      cardOverflows: cards.map((card) => card.scrollHeight - card.clientHeight),
      compressedDescriptions: cards.filter((card) => card.querySelector(".mymod-desc").getBoundingClientRect().height < 12).length,
    };
  });
  expect(laptopLayout.rootX).toBeLessThanOrEqual(0);
  expect(laptopLayout.rootY).toBeLessThanOrEqual(0);
  expect(laptopLayout.contentX).toBeLessThanOrEqual(0);
  expect(laptopLayout.contentY).toBeLessThanOrEqual(0);
  expect(laptopLayout.scrollY).toBe(0);
  expect(Math.max(...laptopLayout.cardOverflows)).toBeLessThanOrEqual(2);
  expect(laptopLayout.compressedDescriptions).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("modules-layout-laptop.png"), fullPage: true });

  await page.evaluate(() => {
    state.settings.companyAccess = "Plano Premium";
    render("modulos");
  });
  const premiumCards = page.locator(".mymods-grid .mymod-card");
  await expect(premiumCards).toHaveCount(9);
  await expect(page.getByText("7 / 9", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Módulos disponíveis para contratação" })).toHaveCount(0);
  const premiumLayout = await page.evaluate(() => {
    const root = document.documentElement;
    const grid = document.querySelector(".mymods-grid");
    const cards = [...grid.querySelectorAll(".mymod-card")];
    return {
      rootX: root.scrollWidth - root.clientWidth,
      rootY: root.scrollHeight - root.clientHeight,
      columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
      rows: getComputedStyle(grid).gridTemplateRows.split(" ").length,
      cardOverflows: cards.map((card) => card.scrollHeight - card.clientHeight),
      compressedDescriptions: cards.filter((card) => card.querySelector(".mymod-desc").getBoundingClientRect().height < 12).length,
    };
  });
  expect(premiumLayout.rootX).toBeLessThanOrEqual(0);
  expect(premiumLayout.rootY).toBeLessThanOrEqual(0);
  expect(premiumLayout.columns).toBe(3);
  expect(premiumLayout.rows).toBe(3);
  expect(Math.max(...premiumLayout.cardOverflows)).toBeLessThanOrEqual(2);
  expect(premiumLayout.compressedDescriptions).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("modules-layout-seven-cards.png"), fullPage: true });
});

test("todos os módulos usam título no topo e breadcrumb sem terceiro título", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  const moduleDefinitions = [
    ["contexto", "Contexto da Organização"],
    ["lideranca", "Liderança e Comprometimento"],
    ["riscos", "Riscos e Oportunidades"],
    ["documentos", "Documentos"],
    ["auditorias", "Auditorias"],
    ["nao-conformidades", "Não Conformidades"],
    ["equipamentos", "Equipamentos de Medição"],
  ];

  await page.locator('[data-view="modulos"]').click();
  await expect(page.getByRole("heading", { name: "Módulos contratados" })).toBeVisible();
  await page.evaluate(() => {
    state.settings.companyAccess = "Plano Premium";
    render("modulos");
  });

  for (const [id, title] of moduleDefinitions) {
    await page.evaluate((moduleId) => renderModuleDetail(moduleId), id);
    await expect(page.locator(".topbar-title")).toHaveText(title);
    await expect(page.locator(".topbar-title")).toBeVisible();
    await expect(page.locator(".topbar-subtitle")).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/module-detail-view/);
    await expect(page.locator(".breadcrumb button")).toHaveText("Meus módulos");
    await expect(page.locator(".breadcrumb .cur")).toHaveText(title);
    await expect(page.locator(".module-summary-toolbar")).toHaveCount(1);
    await expect(page.locator(".module-summary-toolbar .welcome-eyebrow")).not.toBeEmpty();
    await expect(page.locator(".module-summary-toolbar .welcome-sub")).not.toBeEmpty();
    await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
    const visibleTitleOccurrences = await page.evaluate((expectedTitle) => [...document.querySelectorAll("body *")]
      .filter((element) => element.children.length === 0
        && element.textContent.trim() === expectedTitle
        && getComputedStyle(element).display !== "none"
        && getComputedStyle(element).visibility !== "hidden")
      .length, title);
    expect(visibleTitleOccurrences).toBe(2);
  }

  await page.evaluate(() => renderModuleDetail("contexto"));
  await page.screenshot({ path: testInfo.outputPath("context-module-header-pattern.png"), fullPage: true });
  await page.evaluate(() => renderModuleDetail("nao-conformidades"));
  await page.screenshot({ path: testInfo.outputPath("module-header-pattern.png"), fullPage: true });
});
