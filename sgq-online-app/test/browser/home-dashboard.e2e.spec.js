const { test, expect } = require("@playwright/test");

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function finishOnboardingIfNeeded(page) {
  await page.locator(".home-v2, #onboardingForm").first().waitFor({ state: "attached", timeout: 10_000 });
  const button = page.getByRole("button", { name: "Salvar e entrar no sistema" });
  if (await button.count()) {
    await button.click();
    await expect(page.locator(".home-v2")).toBeVisible({ timeout: 10_000 });
  }
}

async function expectDashboardWithoutScroll(page) {
  const measurements = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const content = document.querySelector(".page-content");
    return {
      rootX: root.scrollWidth - root.clientWidth,
      rootY: root.scrollHeight - root.clientHeight,
      bodyX: body.scrollWidth - body.clientWidth,
      bodyY: body.scrollHeight - body.clientHeight,
      contentX: content.scrollWidth - content.clientWidth,
      contentY: content.scrollHeight - content.clientHeight,
    };
  });

  for (const overflow of Object.values(measurements)) expect(overflow).toBeLessThanOrEqual(0);
}

test("página inicial ocupa a viewport sem rolagem", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);
  await expect(page.locator(".home-v2")).toBeVisible();
  await expectDashboardWithoutScroll(page);
  await page.screenshot({ path: testInfo.outputPath("home-dashboard-desktop.png") });

  await page.setViewportSize({ width: 390, height: 844 });
  await expectDashboardWithoutScroll(page);
  await page.screenshot({ path: testInfo.outputPath("home-dashboard-mobile.png") });
});

test("menu e cabeçalho mantêm o mesmo layout entre as telas", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  const sharedStyles = () => page.evaluate(() => {
    const sidebar = getComputedStyle(document.querySelector(".sidebar"));
    const topbar = getComputedStyle(document.querySelector(".topbar"));
    const search = getComputedStyle(document.querySelector(".topbar-search"));
    return {
      sidebarWidth: sidebar.width,
      sidebarBackground: sidebar.backgroundImage,
      topbarHeight: topbar.height,
      topbarBackground: topbar.backgroundColor,
      searchDisplay: search.display,
      searchWidth: search.width,
    };
  });

  const home = await sharedStyles();
  await page.locator('[data-view="modulos"]').click();
  await expect(page.getByRole("heading", { name: "Módulos contratados" })).toBeVisible();
  const modules = await sharedStyles();
  await page.screenshot({ path: testInfo.outputPath("modules-global-shell.png") });

  expect(modules).toEqual(home);
  expect(modules.searchDisplay).toBe("flex");
});

test("temas claro azul e escuro mantêm o LED lateral", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  const themeSnapshot = () => page.evaluate(() => {
    const active = document.querySelector(".nav-item.active");
    const led = getComputedStyle(active, "::before");
    return {
      light: document.body.classList.contains("theme-light"),
      pageBackground: getComputedStyle(document.querySelector(".page-content")).backgroundImage,
      activeBackground: getComputedStyle(active).backgroundImage,
      ledDisplay: led.display,
      ledWidth: led.width,
      ledColor: led.backgroundColor,
    };
  });

  const dark = await themeSnapshot();
  await page.screenshot({ path: testInfo.outputPath("theme-dark.png") });
  expect(dark.light).toBe(false);
  expect(dark.ledDisplay).toBe("block");
  expect(dark.ledWidth).toBe("3px");

  await page.locator('[data-view="configuracoes"]').click();
  await page.getByLabel("Tema do sistema").selectOption("light");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await page.locator('[data-view="inicio"]').click();

  const light = await themeSnapshot();
  await page.screenshot({ path: testInfo.outputPath("theme-light-blue.png") });
  expect(light.light).toBe(true);
  expect(light.ledDisplay).toBe("block");
  expect(light.ledWidth).toBe("3px");
  expect(light.pageBackground).not.toBe(dark.pageBackground);
  expect(light.activeBackground).not.toBe(dark.activeBackground);
});

test("Empresa é o primeiro indicador e abre os dados da empresa", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  const indicators = page.locator(".home-v2-kpi");
  await expect(indicators.first()).toContainText("Empresa");
  await expect(page.getByText("Módulos ativos", { exact: true })).toHaveCount(0);
  await indicators.first().locator("strong").evaluate((element) => {
    element.textContent = "Admin Qualitypro Com Br LTDA";
  });
  const companyNameFits = await indicators.first().locator("strong").evaluate((element) =>
    element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight,
  );
  expect(companyNameFits).toBe(true);
  await indicators.first().getByRole("button", { name: /Ver dados da empresa/ }).click();
  await expect(page.locator('[data-view="empresa"]')).toHaveClass(/active/);
});

test("cartões da página inicial exibem salto e brilho ao passar o mouse", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  for (const locator of [page.locator(".home-v2-kpi").first(), page.locator(".home-v2-module").first()]) {
    await locator.hover();
    await page.waitForTimeout(220);
    const hoverStyle = await locator.evaluate((element) => {
      const style = getComputedStyle(element);
      return { transform: style.transform, boxShadow: style.boxShadow };
    });
    expect(hoverStyle.transform).not.toBe("none");
    expect(hoverStyle.boxShadow).not.toBe("none");
  }
});

test("Visão rápida possui rolagem vertical interna", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  const activityList = page.locator(".home-v2-activity-list");
  await activityList.evaluate((list) => {
    const row = list.querySelector("button");
    for (let index = 0; index < 12; index += 1) list.append(row.cloneNode(true));
  });
  const scroll = await activityList.evaluate((list) => {
    const before = { clientHeight: list.clientHeight, scrollHeight: list.scrollHeight };
    list.scrollTop = list.scrollHeight;
    return { ...before, scrollTop: list.scrollTop, overflowY: getComputedStyle(list).overflowY };
  });

  expect(scroll.overflowY).toBe("auto");
  expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
  expect(scroll.scrollTop).toBeGreaterThan(0);
  await expectDashboardWithoutScroll(page);
});

test("tarefas e alertas possuem rolagem vertical interna", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  for (const selector of [".home-v2-list", ".home-v2-alerts"]) {
    const list = page.locator(selector);
    if (selector === ".home-v2-alerts") {
      const itemHeights = await list.locator(":scope > button").evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
      expect(Math.max(...itemHeights)).toBeLessThanOrEqual(60);
    }
    await list.evaluate((element) => {
      const row = element.querySelector("button");
      for (let index = 0; index < 12; index += 1) element.append(row.cloneNode(true));
    });
    const scroll = await list.evaluate((element) => {
      const before = { clientHeight: element.clientHeight, scrollHeight: element.scrollHeight };
      element.scrollTop = element.scrollHeight;
      return { ...before, scrollTop: element.scrollTop, overflowY: getComputedStyle(element).overflowY };
    });
    expect(scroll.overflowY).toBe("auto");
    expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    expect(scroll.scrollTop).toBeGreaterThan(0);
  }

  await expectDashboardWithoutScroll(page);
});
