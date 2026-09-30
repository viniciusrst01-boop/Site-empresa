const { test, expect } = require("@playwright/test");

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("satisfação do cliente é integrada com abas, dados demonstrativos e tema do aplicativo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.evaluate(() => {
    state.settings.theme = "light";
    applyTheme();
    renderModuleDetail("satisfacao-clientes");
  });

  const satisfactionFrame = page.frameLocator('iframe[title="Satisfação do Cliente"]');
  await satisfactionFrame.locator("#kpiRow").waitFor({ state: "visible" });
  await expect(satisfactionFrame.locator(".sidebar")).toBeHidden();
  await expect(satisfactionFrame.locator('[data-tab="formulario"]')).toBeVisible();
  await expect.poll(() => satisfactionFrame.locator("body").evaluate((body) => body.classList.contains("theme-light"))).toBe(true);
  await expect.poll(() => satisfactionFrame.locator("body").evaluate((body) => getComputedStyle(body).getPropertyValue("--bg-panel").trim())).toBe("#0c2a4e");

  await satisfactionFrame.locator('[data-tab="indicadores"]').click();
  await expect(satisfactionFrame.locator("#satNps")).toBeVisible();
  await expect(satisfactionFrame.locator("#satAcoes")).toBeVisible();

  await page.evaluate(() => {
    state.settings.theme = "white";
    applyTheme();
  });
  await expect.poll(() => satisfactionFrame.locator("body").evaluate((body) => body.classList.contains("theme-white"))).toBe(true);
});

test("critérios de fornecedores só podem ser alterados no modo de edição", async ({ page }) => {
  await login(page);
  await page.evaluate(() => renderModuleDetail("fornecedores"));

  const frame = page.frameLocator('iframe[title="Fornecedores"]');
  await frame.locator('[data-tab="criterios"]').click();

  const firstName = frame.locator('.crit-item .ci-nome input').first();
  const firstWeight = frame.locator('.crit-item .ci-peso input').first();
  await expect(firstName).toBeDisabled();
  await expect(firstWeight).toBeDisabled();
  await expect(frame.getByText('Editar critérios', { exact: true })).toBeVisible();

  await frame.getByText('Editar critérios', { exact: true }).click();
  await expect(firstName).toBeEnabled();
  await expect(firstWeight).toBeEnabled();
  await firstName.fill('Qualidade validada');
  await frame.getByText('Salvar critérios', { exact: true }).click();

  await expect(firstName).toBeDisabled();
  await expect(firstName).toHaveValue('Qualidade validada');
  await expect(frame.getByText('Editar critérios', { exact: true })).toBeVisible();

  await frame.getByText('Editar critérios', { exact: true }).click();
  await firstWeight.fill('31');
  await firstWeight.press('Tab');
  await expect(frame.locator('#toastText')).toHaveText('O valor desejado excedeu a soma de 100%.');
  await expect(firstWeight).toHaveValue('30');
});

test("envio manual de satisfação exige todos os dados do cliente", async ({ page }) => {
  await login(page);
  await page.evaluate(() => renderModuleDetail("satisfacao-clientes"));

  const frame = page.frameLocator('iframe[title="Satisfação do Cliente"]');
  await frame.locator('[data-tab="envio"]').click();
  await frame.locator('#envCliente').selectOption('__manual');
  await frame.locator('#envEmpresa').fill('Empresa Exemplo Ltda.');
  await frame.locator('#envEmail').fill('contato@exemplo.com.br');
  await frame.getByText('Enviar pesquisa', { exact: true }).click();

  const alert = frame.locator('#envValidationAlert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Responsável (contato)');
  await expect(alert).toContainText('CNPJ');
  await expect(frame.locator('#modalEnvio')).not.toHaveClass(/show/);

  await frame.locator('#envResponsavel').fill('Maria da Silva');
  await frame.locator('#envCnpj').fill('12.345.678/0001-90');
  const bootstrap = await (await page.request.get('/api/bootstrap')).json();
  const form = await frame.locator('body').evaluate(() => store.get('qps_sat_form'));
  await page.request.post('/api/data', { headers: { 'X-CSRF-Token': bootstrap.csrfToken }, data: {
    key: 'state', value: { ...(bootstrap.state || {}), satisfaction: { ...(bootstrap.state?.satisfaction || {}), qps_sat_form: form } },
  } });
  await frame.getByText('Enviar pesquisa', { exact: true }).click();
  await expect(frame.getByText('Pesquisa salva, mas o e-mail não foi enviado.', { exact: false })).toBeVisible();
  await expect(frame.locator('#modalEnvio')).not.toHaveClass(/show/);
});

test("ações de melhoria exibem os responsáveis na lista suspensa", async ({ page }) => {
  await login(page);
  await page.evaluate(() => renderModuleDetail("satisfacao-clientes"));

  const frame = page.frameLocator('iframe[title="Satisfação do Cliente"]');
  await frame.locator("#kpiRow").waitFor({ state: "visible" });

  await frame.locator("body").evaluate(() => abrirMelhoria("PSQ-0001"));
  await expect(frame.locator("#modalMelhoria")).toHaveClass(/show/);
  await expect(frame.locator("#melResponsavel option")).toHaveCount(7);

  await frame.locator("#melResponsavel").locator("xpath=..")
    .locator(".qp-select-trigger").evaluate((trigger) => trigger.click());
  const menu = frame.locator(".qp-select-menu.is-open");
  await expect(menu).toContainText("Hugo Melo");
  await expect(menu).toContainText("Marina Souza");

  const savedResponsavel = await frame.locator("body").evaluate(() => {
    const action = (store.get("qps_sat_melhorias") || [])[0];
    abrirMelhoria(action.pesqId, action.id);
    return action.responsavel;
  });
  await expect(frame.locator("#melResponsavel")).toHaveValue(savedResponsavel);
});

test("satisfação do cliente mantém a rolagem na área de trabalho sem rolagem lateral", async ({ page }) => {
  await login(page);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 600 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => renderModuleDetail("satisfacao-clientes"));

    const satisfactionFrame = page.frameLocator('iframe[title="Satisfação do Cliente"]');
    await satisfactionFrame.locator(".pergunta-item").last().waitFor({ state: "visible" });

    const dimensions = await satisfactionFrame.locator("body").evaluate((body) => ({
      contentHeight: document.querySelector("#tabContent").scrollHeight,
      contentWidth: Math.max(body.scrollWidth, document.documentElement.scrollWidth),
      viewportWidth: window.innerWidth,
      viewportHeight: document.querySelector("#tabContent").clientHeight,
    }));
    const frameHeight = await page.locator(".satisfaction-module-frame").evaluate((frame) => frame.getBoundingClientRect().height);
    const pageSize = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));

    expect(frameHeight).toBeLessThanOrEqual(viewport.height);
    expect(dimensions.contentHeight).toBeGreaterThan(dimensions.viewportHeight);
    expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
    expect(pageSize.width).toBeLessThanOrEqual(viewport.width);
    expect(pageSize.height).toBeLessThanOrEqual(viewport.height);

    await satisfactionFrame.locator(".pergunta-item").last().scrollIntoViewIfNeeded();
    await expect(satisfactionFrame.locator(".pergunta-item").last()).toBeVisible();
  }
});

test("indicadores de satisfação se recuperam após redimensionar a página", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 920, height: 760 });
  await page.evaluate(() => renderModuleDetail("satisfacao-clientes"));

  const frame = page.frameLocator('iframe[title="Satisfação do Cliente"]');
  await frame.locator('[data-tab="indicadores"]').click();
  await expect(frame.locator("#satNps")).toBeVisible();
  await expect(frame.locator("#satMedia")).toBeVisible();
  await page.waitForTimeout(120);
  const compactHeight = await page.locator(".satisfaction-module-frame").evaluate((element) => element.getBoundingClientRect().height);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(180);
  const layout = await frame.locator("body").evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    chartSizes: ["satNps", "satCriterio", "satStatus", "satAcoes", "satEvol", "satMedia"].map((id) => {
      const chart = Chart.getChart(id);
      return { id, width: chart?.width || 0, height: chart?.height || 0 };
    }),
  }));
  const wideHeight = await page.locator(".satisfaction-module-frame").evaluate((element) => element.getBoundingClientRect().height);

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.scrollHeight).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.chartSizes.every((chart) => chart.width > 0 && chart.height > 0)).toBe(true);
  expect(wideHeight).toBeLessThan(compactHeight);
});

test("equipamentos mantém os itens acessíveis pela rolagem da área de trabalho", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.evaluate(() => renderModuleDetail("equipamentos"));

  const equipmentFrame = page.frameLocator('iframe[title="Equipamentos de Medição"]');
  await equipmentFrame.locator('[data-tab="controle"]').click();
  const rows = equipmentFrame.locator(".ctxtbl tbody tr");
  await expect(rows).toHaveCount(30);

  const scrollable = await equipmentFrame.locator("#tabContent").evaluate((content) => ({
    scrollHeight: content.scrollHeight,
    clientHeight: content.clientHeight,
  }));
  expect(scrollable.scrollHeight).toBeGreaterThan(scrollable.clientHeight);

  await rows.last().scrollIntoViewIfNeeded();
  await expect(rows.last()).toBeVisible();
});

test("satisfação do cliente mostra no máximo cinco revisões recentes", async ({ page }) => {
  await login(page);
  await page.evaluate(() => renderModuleDetail("satisfacao-clientes"));

  const satisfactionFrame = page.frameLocator('iframe[title="Satisfação do Cliente"]');
  await satisfactionFrame.locator("#kpiRow").waitFor({ state: "visible" });
  await satisfactionFrame.locator("body").evaluate(() => {
    const form = getForm();
    const sourceVersion = form.versoes[0];
    form.versoes = Array.from({ length: 6 }, (_, index) => ({
      ...structuredClone(sourceVersion),
      versao: String(index + 1).padStart(2, "0"),
      status: index === 5 ? "Vigente" : "Obsoleto",
    }));
    store.set("qps_sat_form", form);
    renderSatisfaction();
  });

  const revisionChips = satisfactionFrame.locator(".form-status-chips .fstatus");
  await expect(revisionChips).toHaveCount(5);
  await expect(revisionChips.first()).toContainText("Rev. 06");
  await expect(revisionChips.last()).toContainText("Rev. 02");
  await expect(satisfactionFrame.getByText("Rev. 01 · Obsoleto", { exact: true })).toHaveCount(0);
});

test("satisfação do cliente seleciona a Alta Direção antes de enviar a aprovação", async ({ page }) => {
  await login(page);
  await page.evaluate(() => renderModuleDetail("satisfacao-clientes"));
  const frame = page.frameLocator('iframe[title="Satisfação do Cliente"]');
  await frame.locator("#kpiRow").waitFor({ state: "visible" });
  await frame.locator("body").evaluate(() => {
    const form = getForm();
    form.versoes.push({ versao: "02", status: "Rascunho", perguntas: structuredClone(form.versoes[0].perguntas), aprovador: "", dataAprovacao: "", historico: [] });
    approvalApprovers = [{ id: 42, name: "Hugo Melo", email: "hugo@example.test", role: "Administrador" }];
    store.set("qps_sat_form", form);
    renderSatisfaction();
  });
  await expect(frame.getByLabel("Responsável da Alta Direção")).toBeVisible();
  await expect(frame.getByLabel("Responsável da Alta Direção")).toHaveText(/Hugo Melo/);
  await expect(frame.locator(".btn-grad", { hasText: "Enviar para aprovação" })).toBeVisible();
});

test("fornecedores recebe o tema inicial e acompanha as trocas do aplicativo", async ({ page }) => {
  await login(page);
  await page.evaluate(() => {
    state.settings.theme = "light";
    applyTheme();
    renderModuleDetail("fornecedores");
  });

  const suppliersFrame = page.frameLocator('iframe[title="Fornecedores"]');
  await suppliersFrame.locator("#kpiRow").waitFor({ state: "visible" });
  await expect.poll(() => suppliersFrame.locator("body").evaluate((body) => body.classList.contains("theme-light"))).toBe(true);
  await expect.poll(() => suppliersFrame.locator("body").evaluate((body) => getComputedStyle(body).getPropertyValue("--bg-panel").trim())).toBe("#0c2a4e");

  await page.evaluate(() => {
    state.settings.theme = "white";
    applyTheme();
  });
  await expect.poll(() => suppliersFrame.locator("body").evaluate((body) => body.classList.contains("theme-white"))).toBe(true);

  await page.evaluate(() => {
    state.settings.theme = "dark";
    applyTheme();
  });
  await expect.poll(() => suppliersFrame.locator("body").evaluate((body) => !body.classList.contains("theme-light") && !body.classList.contains("theme-white"))).toBe(true);
});

test("fornecedores permite editar as faixas de resultado das próximas avaliações", async ({ page }) => {
  await login(page);
  await page.evaluate(() => renderModuleDetail("fornecedores"));
  const frame = page.frameLocator('iframe[title="Fornecedores"]');
  await frame.locator("#kpiRow").waitFor({ state: "visible" });
  await frame.locator('[data-tab="criterios"]').click();
  await frame.getByText("Editar faixas", { exact: true }).click();
  await frame.locator("#faixaAprovadoMin").fill("8.5");
  await frame.locator("#faixaRestricaoMin").fill("6.5");
  await frame.getByText("Salvar faixas", { exact: true }).click();
  await expect(frame.getByText("Nota final ≥ 8,5", { exact: true })).toBeVisible();
  await expect(frame.getByText("Nota final de 6,5 a 8,4", { exact: true })).toBeVisible();
  await expect.poll(() => frame.locator("body").evaluate(() => resultadoDaNota(8.2))).toBe("Aprovado com restrição");
});

test("modais em módulos incorporados desfocam a lateral", async ({ page }) => {
  await login(page);

  for (const [moduleId, frameTitle, modalId] of [
    ["satisfacao-clientes", "Satisfação do Cliente", "modalHist"],
    ["fornecedores", "Fornecedores", "modalForn"],
  ]) {
    await page.evaluate((target) => renderModuleDetail(target), moduleId);
    const frame = page.frameLocator(`iframe[title="${frameTitle}"]`);
    await frame.locator("#kpiRow").waitFor({ state: "visible" });
    await frame.locator("body").evaluate((body, id) => openModal(id), modalId);
    await expect(page.locator("body")).toHaveClass(/embedded-module-modal-open/);
    await expect(frame.locator(`#${modalId}`)).toHaveClass(/show/);
    await frame.locator("body").evaluate((body, id) => closeModal(id), modalId);
    await expect(page.locator("body")).not.toHaveClass(/embedded-module-modal-open/);
  }
});

test("nova auditoria mantém todos os controles visíveis sem rolagem interna no desktop", async ({ page }) => {
  await login(page);
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1600, height: 900 }, { width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 1024, height: 600 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => renderModuleDetail("auditorias"));

    const auditsFrame = page.frameLocator('iframe[title="Auditorias"]');
    await auditsFrame.locator("#kpiRow").waitFor({ state: "visible" });
    await auditsFrame.getByRole("button", { name: "Nova auditoria" }).click();
    await expect(auditsFrame.locator("#modalReg")).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/audits-reg-modal-open/);

    const sidebarOverlay = await page.locator(".sidebar").evaluate((sidebar) => {
      const overlay = getComputedStyle(sidebar, "::after");
      return {
        content: overlay.content,
        position: overlay.position,
        inset: overlay.inset,
        backdropFilter: overlay.backdropFilter,
      };
    });
    expect(sidebarOverlay.content).toBe('""');
    expect(sidebarOverlay.position).toBe("absolute");
    expect(sidebarOverlay.inset).toBe("0px");
    expect(sidebarOverlay.backdropFilter).toContain("blur");

    const layout = await auditsFrame.locator("#modalReg .modal-box").evaluate((modal) => {
      const viewportHeight = window.innerHeight;
      const rect = modal.getBoundingClientRect();
      const required = [
        "#regTipo", "#regAlvo", "#regStatus", "#regDataInicio", "#regDataFim", "#regNorma", "#regDescricao",
        "#regResponsavel", "#regEquipe", "#btnPlano", "#btnAtaAbertura", "#btnAtaFechamento", "#btnRelatorio",
        ".upload-btn", ".modal-actions .btn-ghost", ".modal-actions .btn-primary",
      ];
      return {
        overflowing: modal.scrollHeight > modal.clientHeight,
        overflowY: getComputedStyle(modal).overflowY,
        fitsViewport: rect.top >= 0 && rect.bottom <= viewportHeight,
        allControlsVisible: required.every((selector) => {
          const element = modal.querySelector(selector);
          if (!element) return false;
          const bounds = element.getBoundingClientRect();
          return bounds.top >= rect.top && bounds.bottom <= rect.bottom && bounds.width > 0 && bounds.height > 0;
        }),
      };
    });
    expect(layout.overflowY).not.toBe("auto");
    expect(layout.fitsViewport).toBe(true);
    expect(layout.allControlsVisible || layout.fitsViewport).toBe(true);

    await auditsFrame.locator("#modalReg .modal-close").click();
    await expect(page.locator("body")).not.toHaveClass(/audits-reg-modal-open/);
  }
});

test("edição pelo controle de auditorias mantém o modal em uma tela", async ({ page }) => {
  await login(page);
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => {
      state.audits = [{
        id: "AUD-EDIT-001", tipo: "Interna", alvo: "Qualidade", descricao: "Auditoria de edição",
        dataInicio: "2026-09-01", dataFim: "2026-09-02", norma: "ISO 9001:2015", status: "Agendada",
        responsavel: currentUser?.name || "Usuário", equipe: [], historico: [], anexos: [], acoes: [], plano: [], relatorio: {},
      }];
      renderModuleDetail("auditorias");
    });

    const auditsFrame = page.frameLocator('iframe[title="Auditorias"]');
    await auditsFrame.locator("#kpiRow").waitFor({ state: "visible" });
    await auditsFrame.locator('[data-tab="controle"]').click();
    await auditsFrame.locator('[title="Editar"]').first().click();
    await expect(auditsFrame.locator("#modalReg")).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/audits-reg-modal-open/);

    const layout = await auditsFrame.locator("#modalReg .modal-box").evaluate((modal) => {
      const rect = modal.getBoundingClientRect();
      const required = ["#regTipo", "#regDescricao", "#regResponsavel", "#btnPlano", ".upload-btn", ".modal-actions .btn-primary"];
      return {
        fitsViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
        missing: required.filter((selector) => {
          const element = modal.querySelector(selector);
          const bounds = element?.getBoundingClientRect();
          return !(bounds && bounds.top >= rect.top && bounds.bottom <= rect.bottom);
        }),
      };
    });

    expect(layout.fitsViewport).toBe(true);
    expect(layout.missing, `Controles fora da tela em ${viewport.width}x${viewport.height}`).toEqual([]);
    await auditsFrame.locator("#modalReg .modal-close").click();
  }
});

test("auditorias acompanha os três temas do aplicativo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);

  for (const [theme, expectedClass, expectedPanel] of [
    ["dark", "", "#0b1526"],
    ["light", "theme-light", "#0c2a4e"],
    ["white", "theme-white", "#ffffff"],
  ]) {
    await page.evaluate((selectedTheme) => {
      state.settings.theme = selectedTheme;
      applyTheme();
      renderModuleDetail("auditorias");
    }, theme);

    const auditsFrame = page.frameLocator('iframe[title="Auditorias"]');
    await auditsFrame.locator("#kpiRow").waitFor({ state: "visible" });
    const appliedTheme = await auditsFrame.locator("body").evaluate((body) => ({
      className: body.className,
      panel: getComputedStyle(body).getPropertyValue("--bg-panel").trim(),
    }));

    expect(appliedTheme.className).toContain(expectedClass);
    expect(appliedTheme.panel.toLowerCase()).toBe(expectedPanel);
  }
});

test("busca livre da Lista Mestra mantém o foco durante a filtragem", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.evaluate(() => renderModuleDetail("documentos"));
  await page.getByRole("button", { name: "Lista Mestra" }).click();

  const search = page.locator('[data-doc-filter="search"]');
  const documentTitle = await page.locator(".documents-description").first().textContent();
  await search.click();
  await page.keyboard.type(documentTitle);

  await expect(search).toHaveValue(documentTitle);
  await expect(search).toBeFocused();
  await expect(page.locator(".documents-table tbody")).toContainText(documentTitle);
});

test("status escolhido no documento externo substitui o alerta automático de revisão", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.route("**/api/data", async (route) => {
    if (route.request().method() === "POST") await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    else await route.continue();
  });
  await page.evaluate(() => {
    state.documents = [{ id: "EXT-STATUS", kind: "external", code: "ISO-9001-TEST", title: "Documento externo de teste", source: "ABNT", nextVerification: "2020-01-01", status: "Vigente" }];
    renderModuleDetail("documentos");
  });
  await page.getByRole("button", { name: "Documentos Externos" }).click();
  await expect(page.locator(".documents-table tbody")).toContainText("Vigente");
  await expect(page.locator(".documents-table tbody")).not.toContainText("Revisar documento");
  await page.locator('[data-doc-edit="EXT-STATUS"]').click();
  await page.locator('.documents-modal-card select[name="status"]').selectOption("Em Revisão");
  await page.locator('.documents-modal-card button[type="submit"]').click();
  await expect(page.locator(".documents-table tbody")).toContainText("Em Revisão");
});

test("módulo de mudanças climáticas registra questões e exibe indicadores", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.evaluate(() => renderModuleDetail("mudancas-climaticas"));
  await expect(page.locator(".topbar-title")).toHaveText("Mudanças Climáticas");
  await expect(page.getByText("Determinação da empresa quanto a condições climáticas")).toBeVisible();
  await page.getByRole("button", { name: "Questões climáticas" }).click();
  await page.getByRole("button", { name: "Nova questão" }).click();
  await page.locator("#climateIssueDescription").fill("Risco climático de teste");
  await page.locator("#climateIssueImpact").fill("Pode afetar a continuidade da operação.");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator(".climate-table")).toContainText("Risco climático de teste");
  await page.getByRole("button", { name: "Indicadores" }).click();
  await expect(page.locator("#climateStatusChart")).toBeVisible();
});

test("planejamento de mudanças registra as etapas da cláusula 6.3", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await login(page);
  await page.evaluate(() => renderModuleDetail("riscos"));
  await page.locator('[data-risk-tab="mudancas"]').click();
  await page.getByRole("button", { name: "Nova mudança" }).click();

  await expect(page.locator("#changeModal")).toBeVisible();
  await expect(page.locator(".change-stage")).toHaveCount(6);
  await expect(page.locator(".change-plan-section-title").filter({ hasText: "Planejamento da mudança" })).toBeVisible();
  const stageTextareas = await page.locator(".change-stage textarea").evaluateAll((fields) =>
    fields.map((field) => field.getBoundingClientRect().height),
  );
  expect(Math.min(...stageTextareas)).toBeGreaterThanOrEqual(138);

  await page.locator("#changeMudanca").fill("Substituição de máquina de corte");
  await page.locator("#changeCodigo").fill("MUD-2026-021");
  await page.locator("#changeArea").fill("Produção / Corte");
  await page.locator("#changeImpacto").fill("Avaliar parâmetros, documentação e capacitação da equipe.");
  await page.locator("#changePlanejamento").fill("Programar parada, treinamento e validação da máquina.");
  await page.locator("#changeComunicacao").fill("Comunicar a produção e a manutenção antes da implantação.");
  await page.locator("#changeImplementacao").fill("Instalar, testar e liberar gradualmente a operação.");
  await page.locator("#changeAcompanhamento").fill("Monitorar desempenho e retrabalho nas semanas seguintes.");
  await page.locator("#changeEficacia").fill("Comparar os indicadores antes e depois da alteração.");
  await page.locator("#changeObservacoes").fill("Validar requisitos do produto após a liberação.");
  await page.locator(".change-plan-modal").evaluate((modal) => { modal.scrollTop = 0; });
  await page.screenshot({ path: testInfo.outputPath("change-planning-modal.png"), fullPage: true });
  await page.getByRole("button", { name: "Salvar mudança" }).click();

  await expect(page.locator("#changeModal")).toBeHidden();
  await expect(page.locator(".ctxtbl")).toContainText("MUD-2026-021");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("qps_ro_mudancas") || "[]").find((item) => item.codigo === "MUD-2026-021"));
  expect(saved.planejamento.impacto).toContain("parâmetros");
  expect(saved.planejamento.eficacia).toContain("indicadores");
  expect(saved.observacoes).toContain("produto");
});

test("Meus módulos segue a grade compacta sem rolagem", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1830, height: 860 });
  await login(page);
  await page.locator('[data-view="modulos"]').click();
  await expect(page.getByRole("heading", { name: "Meus módulos", exact: true })).toBeVisible();

  const cards = page.locator(".mymods-grid .mymod-card");
  await expect(cards).toHaveCount(10);
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
  await expect(page.getByText("8 / 10", { exact: false })).toBeVisible();
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
  await expect(premiumCards).toHaveCount(10);
  await expect(page.getByText("8 / 10", { exact: false })).toBeVisible();
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
  expect(premiumLayout.columns).toBe(4);
  expect(premiumLayout.rows).toBe(3);
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
    await expect(page.locator(".mymod-card")).toHaveCount(10);
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
  await expect(page.locator(".mymod-card")).toHaveCount(10);
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

  for (const moduleId of ["lideranca", "riscos", "nao-conformidades", "equipamentos"]) {
    await page.evaluate((id) => renderModuleDetail(id), moduleId);
    const historyRoot = moduleId === "equipamentos"
      ? page.frameLocator('iframe[title="Equipamentos de Medição"]')
      : page;
    await expect(historyRoot.getByRole("button", { name: "Voltar ação" })).toBeVisible();
    await expect(historyRoot.getByRole("button", { name: "Avançar ação" })).toBeVisible();
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
    roleLegendPosition: leadershipCharts.lcRoleStatusChart.config.options.plugins.legend.position,
    roleLegendAlign: leadershipCharts.lcRoleStatusChart.config.options.plugins.legend.align,
    rolePaddingLeft: leadershipCharts.lcRoleStatusChart.config.options.layout.padding.left,
    raci: leadershipCharts.lcRaciChart.config.type,
    delegationCommitments: leadershipCharts.lcDelegationCommitmentChart.data.datasets.map((dataset) => dataset.type),
    governance: leadershipCharts.lcRoleGovernanceChart.config.type,
  }));
  expect(charts).toEqual({ roles: "doughnut", roleLegendPosition: "right", roleLegendAlign: "center", rolePaddingLeft: 12, raci: "bar", delegationCommitments: ["bar", "line"], governance: "pie" });
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
  await page.locator(".leadership-calendar-day-link").first().click();
  await expect(page.getByRole("heading", { name: "Reuniões do dia" })).toBeVisible();
  await page.locator(".leadership-day-meeting .module-history-btn").first().click();
  await expect(page.getByRole("heading", { name: "Resumo da reunião" })).toBeVisible();
  await expect(page.locator(".meeting-summary-grid")).toContainText("Descrição");
  await expect(page.locator(".meeting-summary-grid")).toContainText(meetingDescription);
  await expect(page.locator(".meeting-summary-grid")).toContainText("Participantes");
  await expect(page.locator(".meeting-summary-grid")).toContainText("Responsável");
  await page.screenshot({ path: testInfo.outputPath("leadership-meeting-summary.png") });
});

test("mapa de processos exibe a arquitetura separada do cadastro", async ({ page }, testInfo) => {
  await login(page);
  await page.evaluate(() => {
    currentContextTab = "mapa-processos";
    renderModuleDetail("contexto");
  });

  await expect(page.getByRole("button", { name: "Mapa de Processos" })).toHaveClass(/active/);
  await expect(page.getByRole("heading", { name: "Interação entre processos" })).toBeVisible();
  await expect(page.locator(".process-architecture-lane")).toHaveCount(3);
  await expect(page.locator(".process-architecture-lane.estrategico")).toContainText("2 processos");
  await expect(page.locator(".process-architecture-lane.operacional")).toContainText("6 processos");
  await expect(page.locator(".process-architecture-lane.suporte")).toContainText("5 processos");
  await expect(page.locator(".proc-summary")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("context-process-architecture.png"), fullPage: true });

  await page.locator('.process-architecture-node[data-id="alta_direcao"]').click();
  await expect(page.getByRole("heading", { name: "Editar processo" })).toBeVisible();
  await expect(page.locator("#contextProcessoCodigo")).toHaveValue("E01");
  await expect(page.locator("#contextProcessoNome")).toHaveValue("Alta Direção");
  await page.locator("#contextProcessoModal .modal-close").click();

  await page.getByRole("button", { name: "Processos", exact: true }).click();
  await expect(page.locator(".process-architecture")).toHaveCount(0);
  await expect(page.locator(".dcc-title")).toHaveText("Processos");
  await expect(page.locator(".ctxtbl")).toBeVisible();
});
