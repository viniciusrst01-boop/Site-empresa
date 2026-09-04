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

async function expectResponsiveHomeContained(page) {
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
      contentOverflowY: getComputedStyle(content).overflowY,
    };
  });

  expect(measurements.rootX).toBeLessThanOrEqual(0);
  expect(measurements.rootY).toBeLessThanOrEqual(0);
  expect(measurements.bodyX).toBeLessThanOrEqual(0);
  expect(measurements.bodyY).toBeLessThanOrEqual(0);
  expect(measurements.contentX).toBeLessThanOrEqual(0);
  expect(measurements.contentOverflowY).toBe("auto");
}

test("página inicial ocupa a viewport sem rolagem", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);
  await expect(page.locator(".home-v2")).toBeVisible();
  await expect(page.locator(".topbar-title")).toHaveText("Olá, Browser!");
  await expect(page.locator(".topbar-subtitle")).toHaveText("Aqui está um resumo do seu Sistema de Gestão.");
  await expect(page.locator(".home-v2-welcome")).toHaveCount(0);
  await expectDashboardWithoutScroll(page);
  const healthBars = await page.locator(".home-v2-bar").evaluateAll((rows) => rows.map((row) => ({
    value: Number(row.querySelector("strong")?.textContent || 0),
    fillWidth: row.querySelector("b")?.getBoundingClientRect().width || 0,
  })));
  for (const bar of healthBars) {
    if (bar.value > 0) expect(bar.fillWidth).toBeGreaterThan(0);
  }
  const clippedModuleDescriptions = await page.locator(".home-v2-module-copy").evaluateAll((items) =>
    items
      .filter((item) => {
        const description = item.querySelector("p");
        return description && description.scrollHeight - description.clientHeight > 1;
      })
      .map((item) => item.querySelector("h3")?.textContent || ""),
  );
  expect(clippedModuleDescriptions).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("home-dashboard-desktop.png") });

  await page.setViewportSize({ width: 390, height: 844 });
  await expectResponsiveHomeContained(page);
  await expect(page.locator(".home-v2-kpi")).toHaveCount(5);
  await page.screenshot({ path: testInfo.outputPath("home-dashboard-mobile.png") });
});

test("página inicial compacta em telas menores de computador", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  for (const size of [
    { width: 1600, height: 760, name: "notebook-standard" },
    { width: 1024, height: 768, name: "tablet-landscape" },
    { width: 1024, height: 700, name: "notebook-low" },
    { width: 820, height: 760, name: "tablet-compact" },
  ]) {
    await page.setViewportSize(size);
    await expectDashboardWithoutScroll(page);
    await expect(page.locator(".home-v2")).toBeVisible();
    await expect(page.locator(".home-v2-kpi")).toHaveCount(5);
    await expect(page.locator(".home-v2-module")).toHaveCount(7);
    const moduleAccents = await page.locator(".home-v2-module").evaluateAll((cards) => cards.map((card) => getComputedStyle(card).borderTopColor));
    expect(new Set(moduleAccents).size).toBe(7);
    expect(moduleAccents).toContain("rgb(239, 68, 68)");

    await expect.poll(() => page.locator(".home-v2-module-copy h3").evaluateAll((titles) =>
      titles.filter((title) => getComputedStyle(title).whiteSpace !== "nowrap" || title.scrollWidth > title.clientWidth + 1).length,
    )).toBe(0);

    const shell = await page.evaluate(() => {
      const sidebar = document.querySelector(".sidebar");
      const search = document.querySelector(".topbar-search");
      const firstModule = document.querySelector(".home-v2-module");
      const moduleHeading = document.querySelector(".home-v2-modules .home-v2-heading");
      const moduleHeadingTitle = moduleHeading?.querySelector("h2");
      const moduleHeadingDescription = moduleHeading?.querySelector("p");
      return {
        sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : 0,
        searchDisplay: search ? getComputedStyle(search).display : "none",
        moduleWidth: firstModule ? firstModule.getBoundingClientRect().width : 0,
        moduleDescriptionDisplay: firstModule ? getComputedStyle(firstModule.querySelector("p")).display : "none",
        moduleTitleFont: firstModule ? Number.parseFloat(getComputedStyle(firstModule.querySelector("h3")).fontSize) : 0,
        moduleDescriptionFont: firstModule ? Number.parseFloat(getComputedStyle(firstModule.querySelector("p")).fontSize) : 0,
        headingTitleBottom: moduleHeadingTitle?.getBoundingClientRect().bottom || 0,
        headingDescriptionBottom: moduleHeadingDescription?.getBoundingClientRect().bottom || 0,
        clippedModuleText: firstModule
          ? [...document.querySelectorAll(".home-v2-module-copy h3, .home-v2-module-copy p")]
            .filter((item) => item.scrollHeight - item.clientHeight > 1).length
          : 0,
      };
    });

    expect(shell.moduleWidth).toBeGreaterThan(0);
    if (size.width === 1600) {
      expect(shell.sidebarWidth).toBe(204);
      expect(shell.moduleDescriptionDisplay).not.toBe("none");
      expect(shell.moduleDescriptionFont).toBeGreaterThanOrEqual(9);
      expect(Math.abs(shell.headingTitleBottom - shell.headingDescriptionBottom)).toBeLessThanOrEqual(3);
      expect(shell.clippedModuleText).toBe(0);
    }
    if (size.width === 820) expect(shell.sidebarWidth).toBeLessThanOrEqual(90);

    await page.screenshot({ path: testInfo.outputPath(`home-responsive-${size.name}.png`) });
  }
});

test("menu e cabeçalho mantêm o mesmo layout entre as telas", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  const sharedStyles = () => page.evaluate(() => {
    const sidebar = getComputedStyle(document.querySelector(".sidebar"));
    const topbar = getComputedStyle(document.querySelector(".topbar"));
    const search = getComputedStyle(document.querySelector(".topbar-search"));
    const menuIcon = getComputedStyle(document.querySelector(".menu-toggle"));
    return {
      sidebarWidth: sidebar.width,
      sidebarBackground: sidebar.backgroundImage,
      topbarHeight: topbar.height,
      topbarBackground: topbar.backgroundColor,
      searchDisplay: search.display,
      searchWidth: search.width,
      menuIconDisplay: menuIcon.display,
      menuIconPointerEvents: menuIcon.pointerEvents,
      menuIconCursor: menuIcon.cursor,
    };
  });

  const home = await sharedStyles();
  await expect(page.locator(".menu-toggle")).toBeHidden();
  await page.locator('[data-view="modulos"]').click();
  await expect(page.getByRole("heading", { name: "Meus módulos", exact: true })).toBeVisible();
  await expect(page.locator(".menu-toggle")).toBeVisible();
  const modules = await sharedStyles();
  await page.screenshot({ path: testInfo.outputPath("modules-global-shell.png") });

  expect(modules).toEqual({ ...home, menuIconDisplay: "flex" });
  expect(modules.searchDisplay).toBe("flex");
  expect(modules.menuIconDisplay).toBe("flex");
  expect(modules.menuIconPointerEvents).toBe("none");
  expect(modules.menuIconCursor).toBe("default");
  await expect(page.locator(".menu-toggle")).toHaveAttribute("aria-hidden", "true");
});

test("barra lateral compacta mantém a mesma largura em todas as abas", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 760 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  for (const view of ["inicio", "modulos", "empresa", "usuarios", "relatorios", "configuracoes"]) {
    await page.locator(`[data-view="${view}"]`).click();
    await expect(page.locator(".sidebar")).toHaveCSS("width", "204px");
  }
});

test("módulo aberto pela página inicial seleciona Meus módulos", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  await page.locator('[data-module-card="nao-conformidades"]').first().click();
  await expect(page.locator(".topbar-title")).toHaveText("Não Conformidades");
  await expect(page.locator(".breadcrumb .cur")).toHaveText("Não Conformidades");
  await expect(page.locator('[data-view="modulos"]')).toHaveClass(/active/);
  await expect(page.locator('[data-view="inicio"]')).not.toHaveClass(/active/);
});

test("busca global sugere resultados e abre a aba correspondente", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  const search = page.locator("#dashboardGlobalSearch");
  await search.fill("partes interessadas");
  await expect(page.locator("#dashboardSearchResults")).toBeVisible();
  await page.getByRole("option", { name: /^Partes interessadas Contexto/i }).click();

  await expect(page.locator(".topbar-title")).toHaveText("Contexto da Organização");
  await expect(page.locator('[data-context-tab="partes"]')).toHaveClass(/active/);
  await expect(page.locator("#contextTabContent")).toBeVisible();
});

test("os três temas mantêm contraste e o LED lateral", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  const themeSnapshot = () => page.evaluate(() => {
    const active = document.querySelector(".nav-item.active");
    const led = getComputedStyle(active, "::before");
    return {
      light: document.body.classList.contains("theme-light"),
      white: document.body.classList.contains("theme-white"),
      pageBackground: getComputedStyle(document.querySelector(".page-content")).backgroundImage,
      cardBackground: getComputedStyle(document.querySelector(".home-v2-panel")).backgroundColor,
      moduleBackground: getComputedStyle(document.querySelector(".home-v2-module")).backgroundColor,
      moduleCountColor: getComputedStyle(document.querySelector(".home-v2-module-foot span")).color,
      cardText: getComputedStyle(document.querySelector(".home-v2-heading h2")).color,
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
  expect(dark.moduleCountColor).toBe("rgb(245, 247, 250)");

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
  expect(light.moduleCountColor).toBe("rgb(232, 244, 255)");

  await page.locator('[data-view="configuracoes"]').click();
  await page.getByLabel("Tema do sistema").selectOption("white");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await page.locator('[data-view="inicio"]').click();

  const white = await themeSnapshot();
  await page.screenshot({ path: testInfo.outputPath("theme-white.png") });
  expect(white.white).toBe(true);
  expect(white.ledDisplay).toBe("block");
  expect(white.pageBackground).not.toBe(light.pageBackground);
  expect(white.cardBackground).not.toBe(light.cardBackground);
  expect(white.cardText).not.toBe(light.cardText);
  expect(white.cardBackground).toBe("rgb(255, 255, 255)");
  expect(white.moduleBackground).toBe("rgb(227, 232, 239)");
  expect(white.moduleCountColor).toBe("rgb(51, 65, 85)");

  await page.setViewportSize({ width: 1600, height: 760 });
  await expectDashboardWithoutScroll(page);
  await expect(page.locator(".sidebar")).toHaveCSS("width", "204px");
  await page.screenshot({ path: testInfo.outputPath("theme-white-notebook-standard.png") });
});

test("resumo inicia pelos registros e apresenta os cinco indicadores", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await finishOnboardingIfNeeded(page);

  const indicators = page.locator(".home-v2-kpi");
  await expect(indicators).toHaveCount(5);
  await expect(indicators.first()).toContainText("Registros do SGQ");
  await expect(indicators.last()).toContainText("Status do SGQ");
  await expect(page.getByText("Módulos ativos", { exact: true })).toHaveCount(0);
});

test("cadastro da empresa cabe inteiro na viewport desktop", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 860 });
  await login(page);
  await finishOnboardingIfNeeded(page);
  await page.locator('[data-view="empresa"]').click();

  await expect(page.locator(".topbar-title")).toHaveText("Empresa");
  await expect(page.locator(".topbar-subtitle")).toHaveText("Dados principais da organização");
  await expect(page.getByRole("heading", { name: "Dados da empresa" })).toBeVisible();
  await expect(page.locator("#fRazaoSocial")).toBeVisible();
  await expect(page.locator("#fEndereco")).toBeVisible();
  await expect(page.locator("#fSite")).toBeVisible();
  await expect(page.locator("#fRespCargo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar alterações" })).toBeVisible();
  await expectDashboardWithoutScroll(page);
  await page.screenshot({ path: testInfo.outputPath("company-fit-layout.png") });

  await page.setViewportSize({ width: 1180, height: 850 });
  await expect(page.getByRole("button", { name: "Salvar alterações" })).toBeVisible();
  await expectDashboardWithoutScroll(page);
  await page.screenshot({ path: testInfo.outputPath("company-fit-layout-compact.png") });
});

test("usuários segue o layout de controle sem rolagem da página", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1830, height: 860 });
  await login(page);
  await finishOnboardingIfNeeded(page);
  await page.locator('[data-view="usuarios"]').click();

  await expect(page.locator(".topbar-title")).toHaveText("Usuários");
  await expect(page.getByRole("heading", { name: "Usuários", exact: true })).toBeVisible();
  await expect(page.locator(".users-kpi-row .kpi-card")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Novo usuário" })).toBeVisible();
  await expect(page.locator("#usersSearchInput")).toBeVisible();
  await expect(page.locator("#usersStatusFilter")).toBeVisible();
  await expect(page.locator("#usersTbody tr").first()).toBeVisible();
  await expectDashboardWithoutScroll(page);
  await page.screenshot({ path: testInfo.outputPath("users-fit-layout.png") });

  await page.setViewportSize({ width: 1180, height: 850 });
  const tableOverflow = await page.locator(".users-table-wrap").evaluate((element) => ({
    horizontal: element.scrollWidth - element.clientWidth,
    verticalMode: getComputedStyle(element).overflowY,
  }));
  expect(tableOverflow.horizontal).toBeLessThanOrEqual(0);
  expect(tableOverflow.verticalMode).toBe("auto");
  await expectDashboardWithoutScroll(page);
  await page.screenshot({ path: testInfo.outputPath("users-fit-layout-compact.png") });
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
