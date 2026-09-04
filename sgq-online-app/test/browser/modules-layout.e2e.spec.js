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
  await expect(page.getByRole("heading", { name: "Meus módulos", exact: true })).toBeVisible();

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
  expect(layout.columns).toBe(6);
  expect(layout.rows).toBe(2);
  await expect(page.locator(".mymod-title", { hasText: "Satisfação do Cliente" })).toBeVisible();
  await expect(page.getByText("Treinamentos", { exact: true })).toHaveCount(0);
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
  expect(premiumLayout.columns).toBe(6);
  expect(premiumLayout.rows).toBe(2);
  expect(Math.max(...premiumLayout.cardOverflows)).toBeLessThanOrEqual(2);
  expect(premiumLayout.compressedDescriptions).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("modules-layout-seven-cards.png"), fullPage: true });

  for (const viewport of [{ width: 720, columns: 2 }, { width: 390, columns: 1 }]) {
    await page.setViewportSize({ width: viewport.width, height: 820 });
    const responsive = await page.evaluate(() => {
      const content = document.querySelector(".modules-page-content");
      const grid = document.querySelector(".mymods-grid");
      return {
        contentX: content.scrollWidth - content.clientWidth,
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
      };
    });
    expect(responsive.contentX).toBeLessThanOrEqual(0);
    expect(responsive.columns).toBe(viewport.columns);
    await expect(page.locator(".mymod-card")).toHaveCount(9);
  }
});

test("catálogo compacto acompanha os três temas", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.locator('[data-view="modulos"]').click();

  const snapshot = () => page.evaluate(() => {
    const card = document.querySelector(".mymods-reference-grid .mymod-card");
    const title = card.querySelector(".mymod-title");
    return {
      cardBackground: getComputedStyle(card).backgroundColor,
      titleColor: getComputedStyle(title).color,
      pageBackground: getComputedStyle(document.querySelector(".page-content")).backgroundImage,
    };
  });

  const dark = await snapshot();
  await page.screenshot({ path: testInfo.outputPath("modules-theme-dark.png"), fullPage: true });

  await page.evaluate(() => {
    state.settings.theme = "light";
    applyTheme();
    render("modulos");
  });
  const light = await snapshot();
  await page.screenshot({ path: testInfo.outputPath("modules-theme-light.png"), fullPage: true });

  await page.evaluate(() => {
    state.settings.theme = "white";
    applyTheme();
    render("modulos");
  });
  const white = await snapshot();
  await page.screenshot({ path: testInfo.outputPath("modules-theme-white.png"), fullPage: true });

  expect(light.cardBackground).not.toBe(dark.cardBackground);
  expect(white.cardBackground).not.toBe(light.cardBackground);
  expect(white.titleColor).not.toBe(light.titleColor);
  expect(white.pageBackground).not.toBe(light.pageBackground);
  await expect(page.locator(".mymod-card")).toHaveCount(9);
  const accents = await page.locator(".mymod-card").evaluateAll((cards) => cards.map((card) => card.style.getPropertyValue("--accent-line")));
  expect(new Set(accents).size).toBe(9);
  expect(accents).toContain("#EF4444");
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
  await expect(page.getByRole("heading", { name: "Meus módulos", exact: true })).toBeVisible();
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

test("módulos exibem setas de voltar e avançar ação no lugar de desfazer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function");

  await page.evaluate(() => renderModuleDetail("contexto"));
  await expect(page.getByRole("button", { name: "Desfazer" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Limpar módulo" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Voltar ação" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Avançar ação" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Voltar ação" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Avançar ação" })).toBeDisabled();

  await page.getByRole("button", { name: "Novo item" }).click();
  await page.locator("#contextSwotDescricao").fill("Teste de histórico");
  await page.locator("#contextSwotResponsavel").selectOption("Hugo Melo");
  await page.locator('[data-context-action="save-swot"]').click();

  await expect(page.getByText("Teste de histórico")).toBeVisible();
  await expect(page.getByRole("button", { name: "Voltar ação" })).toBeEnabled();
  await page.getByRole("button", { name: "Voltar ação" }).click();
  await expect(page.getByText("Teste de histórico")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Avançar ação" })).toBeEnabled();
  await page.getByRole("button", { name: "Avançar ação" }).click();
  await expect(page.getByText("Teste de histórico")).toBeVisible();

  for (const moduleId of ["lideranca", "riscos", "nao-conformidades", "documentos", "auditorias", "equipamentos"]) {
    await page.evaluate((id) => renderModuleDetail(id), moduleId);
    await expect(page.getByRole("button", { name: "Voltar ação" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Avançar ação" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Desfazer" })).toHaveCount(0);
  }
});

test("ação da direção aceita evidência em PDF ou imagem", async ({ page }) => {
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function");
  await page.evaluate(() => renderModuleDetail("lideranca"));
  await page.getByRole("button", { name: "Nova ação" }).click();

  await expect(page.locator("#lcEvidenceFile")).toHaveAttribute("accept", /application\/pdf/);
  await page.locator("#lcEvidenceFile").setInputFiles({
    name: "evidencia-da-reuniao.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/8QAAAABJRU5ErkJggg==", "base64"),
  });
  await expect(page.locator("#lcEvidenceFileName")).toHaveText("evidencia-da-reuniao.png");
  const uploadResponse = page.waitForResponse((response) => response.url().includes("/api/leadership-attachments") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Salvar" }).click();
  expect((await uploadResponse).status()).toBe(201);

  const evidence = page.getByRole("link", { name: "evidencia-da-reuniao.png" });
  await expect(evidence).toBeVisible();
  const response = await page.request.get(await evidence.getAttribute("href"));
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
});

test("editar ação lista os usuários cadastrados como participantes selecionáveis", async ({ page }, testInfo) => {
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function");
  await page.evaluate(() => renderModuleDetail("lideranca"));

  const apiParticipants = await page.evaluate(async () => {
    const response = await fetch("/api/leadership/participants", { headers: { Accept: "application/json" } });
    return (await response.json()).users;
  });
  await page.locator('[data-lc-action="edit-acao"]').first().click();

  const options = page.locator("[data-lc-participant]");
  await expect(options).toHaveCount(apiParticipants.length);
  await expect(page.locator("#lcParticipantsHelp")).toHaveText("Selecione um ou mais usuários cadastrados. Os participantes recebem o convite ao salvar uma reunião.");
  await expect(page.locator(".participants-checklist")).toBeVisible();

  if (apiParticipants.length) {
    await expect(page.locator(".participant-option").first()).toContainText(apiParticipants[0].displayName);
    await expect(page.locator(".participant-option").first()).toContainText(apiParticipants[0].email);
    await options.first().check();
    await expect(options.first()).toBeChecked();
  }
  await page.screenshot({ path: testInfo.outputPath("leadership-participants-checklist.png") });
});

test("editar ação permite remover o anexo existente ao salvar", async ({ page }) => {
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function");
  await page.evaluate(() => renderModuleDetail("lideranca"));
  await page.locator('[data-lc-action="edit-acao"]').first().click();

  await expect(page.getByRole("button", { name: "Remover anexo" })).toBeVisible();
  await page.getByRole("button", { name: "Remover anexo" }).click();
  await expect(page.locator("#lcEvidenceFileName")).toHaveText("Anexo será removido ao salvar.");
  await expect(page.locator("#lcRemoveEvidence")).toHaveValue("true");
  await expect(page.getByRole("button", { name: "Remover anexo" })).toBeHidden();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();

  const actionRow = page.locator("tr", { hasText: "Reunião mensal com análise dos indicadores" });
  await expect(actionRow).not.toContainText("Ata_15072026.pdf");
  await actionRow.locator('[data-lc-action="edit-acao"]').click();
  await expect(page.getByRole("button", { name: "Remover anexo" })).toHaveCount(0);
  await expect(page.locator("#lcEvidenceFileName")).toHaveText("Nenhum arquivo selecionado");
});

test("comunicação da política aceita evidência em PDF ou imagem", async ({ page }) => {
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function");
  await page.evaluate(() => {
    renderModuleDetail("lideranca");
    currentLeadershipMainTab = "politica";
    currentLeadershipSubTab = "comunicacao";
    renderLeadershipTabs();
  });
  await page.getByRole("button", { name: "Novo registro" }).click();
  await expect(page.locator("#lcEvidenceFile")).toHaveAttribute("accept", /image\/jpeg/);
  await page.locator("#lcEvidenceFile").setInputFiles({
    name: "comunicacao-politica.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/8QAAAABJRU5ErkJggg==", "base64"),
  });
  await expect(page.locator("#lcEvidenceFileName")).toHaveText("comunicacao-politica.png");
  const uploadResponse = page.waitForResponse((response) => response.url().includes("/api/leadership-attachments") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Salvar" }).click();
  expect((await uploadResponse).status()).toBe(201);

  const evidence = page.getByRole("link", { name: "comunicacao-politica.png" });
  await expect(evidence).toBeVisible();
  expect((await page.request.get(await evidence.getAttribute("href"))).status()).toBe(200);
});

test("política registra revisões e preenche o cargo do responsável", async ({ page }, testInfo) => {
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function");
  await page.evaluate(() => {
    renderModuleDetail("lideranca");
    currentLeadershipMainTab = "politica";
    currentLeadershipSubTab = "politica";
    renderLeadershipTabs();
  });

  await expect(page.locator(".policy-history .empty-state")).toHaveText("Nenhuma revisão registrada.");
  await expect(page.locator(".doc-meta-row")).toContainText("Revisão 00");
  await page.getByRole("button", { name: "Editar" }).click();
  await expect(page.locator("#lcPolicyRevision")).toHaveValue("01");
  await page.locator("#lcPolicyApprover").selectOption("Hugo Melo");
  await expect(page.locator("#lcPolicyApproverRole")).toHaveValue("Diretor Geral");
  await page.screenshot({ path: testInfo.outputPath("policy-edit-role.png") });
  await page.locator('[data-lc-field="dataAprovacao"]').fill("2026-09-04");
  await page.locator('[data-lc-field="descricaoRevisao"]').fill("Versão inicial aprovada.");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();

  await expect(page.locator(".doc-meta-row")).toContainText("Revisão 01");
  await expect(page.locator('.policy-history [data-policy-revision="01"]')).toContainText("04/09/2026 · Versão inicial aprovada. · Hugo Melo (Diretor Geral)");
  await expect(page.locator(".policy-history [data-policy-revision]")).toHaveCount(1);

  await page.getByRole("button", { name: "Editar" }).click();
  await expect(page.locator("#lcPolicyRevision")).toHaveValue("02");
  await page.locator("#lcPolicyApprover").selectOption("Carlos Andrade");
  await expect(page.locator("#lcPolicyApproverRole")).toHaveValue("Gerente da Qualidade");
  await page.locator('[data-lc-field="texto"]').fill("Política revisada e alinhada ao planejamento estratégico.");
  await page.locator('[data-lc-field="dataAprovacao"]').fill("2026-10-10");
  await page.locator('[data-lc-field="descricaoRevisao"]').fill("Alinhamento ao planejamento estratégico.");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();

  await expect(page.locator(".doc-meta-row")).toContainText("Revisão 02");
  await expect(page.locator(".doc-meta-row")).toContainText("10/10/2026");
  await expect(page.locator(".doc-text-box")).toHaveText("Política revisada e alinhada ao planejamento estratégico.");
  await expect(page.locator(".detail-item")).toContainText("Carlos Andrade · Gerente da Qualidade");
  await expect(page.locator(".policy-history [data-policy-revision]")).toHaveCount(2);
  await expect(page.locator('.policy-history [data-policy-revision="02"]')).toContainText("10/10/2026 · Alinhamento ao planejamento estratégico. · Carlos Andrade (Gerente da Qualidade)");
  await page.screenshot({ path: testInfo.outputPath("policy-revision-history.png") });
});

test("delegação de autoridade preenche o cargo do titular selecionado", async ({ page }) => {
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function");
  await page.evaluate(() => {
    renderModuleDetail("lideranca");
    currentLeadershipMainTab = "papeis";
    currentLeadershipSubTab = "delegacoes";
    renderLeadershipTabs();
  });

  await page.locator('[data-lc-action="new-delegacao"]').click();
  await expect(page.getByRole("heading", { name: "Nova delegação" })).toBeVisible();
  await expect(page.locator("#lcDelegationRole")).toHaveValue("Diretor Geral");
  await page.locator("#lcDelegationHolder").selectOption("Carlos Andrade");
  await expect(page.locator("#lcDelegationRole")).toHaveValue("Gerente da Qualidade");
  await expect(page.locator("#lcDelegationRole")).toHaveAttribute("readonly", "");
});

test("indicadores da liderança consolidam os dados do módulo em gráficos", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function" && typeof window.Chart === "function");
  await page.evaluate(() => {
    renderModuleDetail("lideranca");
    currentLeadershipSubTab = "indicadores";
    renderLeadershipTabs();
  });

  await expect(page.getByText("Indicadores de desempenho")).toBeVisible();
  await expect(page.locator(".leadership-chart-card")).toHaveCount(4);
  await page.waitForFunction(() => Object.keys(leadershipCharts).length === 4);
  const charts = await page.evaluate(() => ({
    actions: leadershipCharts.lcActionsStatusChart.config.type,
    plan: leadershipCharts.lcPlanStatusChart.config.type,
    activity: leadershipCharts.lcActivityChart.data.datasets.map((dataset) => dataset.type),
    governance: leadershipCharts.lcGovernanceChart.config.type,
  }));
  expect(charts).toEqual({ actions: "doughnut", plan: "bar", activity: ["bar", "line"], governance: "pie" });

  await page.setViewportSize({ width: 600, height: 900 });
  await expect(page.locator(".leadership-chart-card").first()).toBeVisible();
  const columns = await page.locator(".leadership-chart-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(1);
});

test("indicadores de papéis e responsabilidades consolidam todas as seções", async ({ page }) => {
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function" && typeof window.Chart === "function");
  await page.evaluate(() => {
    renderModuleDetail("lideranca");
    currentLeadershipMainTab = "papeis";
    currentLeadershipSubTab = "indicadoresPapeis";
    renderLeadershipTabs();
  });

  await expect(page.getByText("Indicadores de Papéis e Responsabilidades")).toBeVisible();
  await expect(page.locator(".leadership-chart-card")).toHaveCount(4);
  await page.waitForFunction(() => Object.keys(leadershipCharts).length === 4);
  const charts = await page.evaluate(() => ({
    roles: leadershipCharts.lcRoleStatusChart.config.type,
    raci: leadershipCharts.lcRaciChart.config.type,
    delegationCommitments: leadershipCharts.lcDelegationCommitmentChart.data.datasets.map((dataset) => dataset.type),
    governance: leadershipCharts.lcRoleGovernanceChart.config.type,
  }));
  expect(charts).toEqual({ roles: "doughnut", raci: "bar", delegationCommitments: ["bar", "line"], governance: "pie" });
});

test("calendário da alta direção usa as reuniões cadastradas e abre o resumo", async ({ page }, testInfo) => {
  await login(page);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function");
  await page.evaluate(() => renderModuleDetail("lideranca"));

  await page.getByRole("button", { name: "Calendário da alta direção" }).click();
  await expect(page.locator("#leadershipTabContent .dcc-title", { hasText: "Calendário da alta direção" })).toBeVisible();
  await expect(page.locator(".leadership-calendar-grid")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mês anterior" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Próximo mês" })).toBeVisible();
  await expect(page.locator(".leadership-calendar-event")).not.toHaveCount(0);
  await expect(page.locator(".leadership-calendar-event-status").first()).toHaveText(/Concluída|Programada|Não Realizada/i);
  expect(await page.evaluate(() => ["Concluída", "Programada", "Não Realizada"].map(leadershipMeetingStatusClass))).toEqual(["is-completed", "is-scheduled", "is-not-held"]);

  const meetingDescription = await page.locator(".leadership-calendar-event-title").first().innerText();
  await page.locator(".leadership-calendar-event").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("leadership-calendar-status.png") });
  await page.locator(".leadership-calendar-event").first().click();
  await expect(page.getByRole("heading", { name: "Resumo da reunião" })).toBeVisible();
  await expect(page.locator(".meeting-summary-grid")).toContainText("Descrição");
  await expect(page.locator(".meeting-summary-grid")).toContainText(meetingDescription);
  await expect(page.locator(".meeting-summary-grid")).toContainText("Participantes");
  await expect(page.locator(".meeting-summary-grid")).toContainText("Responsável");
  await page.screenshot({ path: testInfo.outputPath("leadership-meeting-summary.png") });
});
