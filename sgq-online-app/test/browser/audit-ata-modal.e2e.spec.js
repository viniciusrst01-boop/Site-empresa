const { test, expect } = require("@playwright/test");

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("ata de fechamento cabe na janela e bloqueia a rolagem externa", async ({ page }) => {
  await login(page);

  for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 600 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => {
      state.audits = [{
        id: "AUD-ATA-001", tipo: "Interna", alvo: "Qualidade", responsavel: "Hugo Melo",
        equipe: [], dataInicio: "2026-09-10", dataFim: "2026-09-10", norma: "ISO 9001:2015",
        descricao: "Auditoria de validação", ataFechamento: [{ matricula: "001", nome: "Hugo Melo", cargo: "Administrador", assinatura: "" }],
      }];
      renderModuleDetail("auditorias");
    });

    const frame = page.frameLocator('iframe[title="Auditorias"]');
    await frame.locator("#kpiRow").waitFor({ state: "visible" });
    await frame.locator("body").evaluate(() => {
      document.getElementById("regEditId").value = "AUD-ATA-001";
      abrirAta("fechamento");
    });

    await expect(frame.locator("#modalAta")).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/audits-reg-modal-open/);
    const layout = await frame.locator("#ataBox").evaluate((modal) => {
      const rect = modal.getBoundingClientRect();
      return {
        overflowing: modal.scrollHeight > modal.clientHeight,
        fitsViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
        bodyLocked: getComputedStyle(document.body).overflow === "hidden",
        controlsVisible: [".modal-close", ".modal-actions .btn-ghost", ".modal-actions .btn-primary"].every((selector) => {
          const element = modal.querySelector(selector);
          if (!element) return false;
          const bounds = element.getBoundingClientRect();
          return bounds.top >= rect.top && bounds.bottom <= rect.bottom;
        }),
      };
    });
    expect(layout.overflowing).toBe(false);
    expect(layout.fitsViewport).toBe(true);
    expect(layout.bodyLocked).toBe(true);
    expect(layout.controlsVisible).toBe(true);

    await frame.locator("#modalAta .modal-close").click();
    await expect(page.locator("body")).not.toHaveClass(/audits-reg-modal-open/);
  }
});

test("resumo da auditoria cabe na janela e bloqueia a rolagem externa", async ({ page }) => {
  await login(page);

  for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 600 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => {
      state.audits = [{
        id: "AUD-DET-001", tipo: "Interna", alvo: "Qualidade", responsavel: "Hugo Melo",
        equipe: ["Admin Qualitypro Com Br"], dataInicio: "2026-09-10", dataFim: "2026-09-10",
        norma: "ISO 9001:2015", descricao: "Auditoria de validação",
        historico: [{ ts: "2026-09-10T12:00:00.000Z", texto: "Auditoria registrada para validação." }],
      }];
      renderModuleDetail("auditorias");
    });

    const frame = page.frameLocator('iframe[title="Auditorias"]');
    await frame.locator("#kpiRow").waitFor({ state: "visible" });
    await frame.locator("body").evaluate(() => viewAud("AUD-DET-001"));

    await expect(frame.locator("#modalDet")).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/audits-reg-modal-open/);
    const layout = await frame.locator("#modalDet .modal-box").evaluate((modal) => {
      const rect = modal.getBoundingClientRect();
      return {
        overflowing: modal.scrollHeight > modal.clientHeight,
        fitsViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
        bodyLocked: getComputedStyle(document.body).overflow === "hidden",
        controlsVisible: [".modal-close", ".modal-actions .btn-ghost", ".modal-actions .btn-primary"].every((selector) => {
          const element = modal.querySelector(selector);
          if (!element) return false;
          const bounds = element.getBoundingClientRect();
          return bounds.top >= rect.top && bounds.bottom <= rect.bottom;
        }),
      };
    });
    expect(layout.overflowing).toBe(false);
    expect(layout.fitsViewport).toBe(true);
    expect(layout.bodyLocked).toBe(true);
    expect(layout.controlsVisible).toBe(true);

    await frame.locator("#modalDet .modal-close").click();
    await expect(page.locator("body")).not.toHaveClass(/audits-reg-modal-open/);
  }
});

test("plano de ações mantém rolagem própria e bloqueia o fundo", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.evaluate(() => {
    state.audits = [{
      id: "AUD-ACOES-001", tipo: "Interna", alvo: "Qualidade", responsavel: "Hugo Melo",
      equipe: [], dataInicio: "2026-09-10", dataFim: "2026-09-10", norma: "ISO 9001:2015",
      descricao: "Auditoria com ações", relatorio: { blocos: [
        { clausula: "5.2", constatacao: "NC Menor", relato: "Primeira constatação." },
        { clausula: "7.1", constatacao: "NC Maior", relato: "Segunda constatação." },
        { clausula: "10.2", constatacao: "Oportunidade de Melhoria", relato: "Terceira constatação." },
      ] },
    }];
    renderModuleDetail("auditorias");
  });

  const frame = page.frameLocator('iframe[title="Auditorias"]');
  await frame.locator("#kpiRow").waitFor({ state: "visible" });
  await frame.locator("body").evaluate(() => abrirPlanoAcoes("AUD-ACOES-001"));

  await expect(frame.locator("#modalPlanoAcoes")).toBeVisible();
  await expect(page.locator("body")).toHaveClass(/audits-reg-modal-open/);
  const layout = await frame.locator("#planoAcoesBox").evaluate((modal) => ({
    overflowY: getComputedStyle(modal).overflowY,
    hasInternalScroll: modal.scrollHeight > modal.clientHeight,
    bodyLocked: getComputedStyle(document.body).overflow === "hidden",
  }));
  expect(layout.overflowY).toBe("auto");
  expect(layout.hasInternalScroll).toBe(true);
  expect(layout.bodyLocked).toBe(true);

  await frame.locator("#modalPlanoAcoes .modal-close").click();
  await expect(page.locator("body")).not.toHaveClass(/audits-reg-modal-open/);
});

test("relatório mantém rolagem própria e bloqueia o fundo", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.evaluate(() => {
    state.audits = [{
      id: "AUD-REL-001", tipo: "Interna", alvo: "Qualidade", responsavel: "Hugo Melo",
      equipe: [], dataInicio: "2026-09-10", dataFim: "2026-09-10", norma: "ISO 9001:2015",
      descricao: "Auditoria com relatório", relatorio: { blocos: [
        { clausula: "4.1", auditadoNome: "", auditadoCargo: "", relato: "", evidencia: "", constatacoesAuditor: "", constatacao: "" },
        { clausula: "5.2", auditadoNome: "", auditadoCargo: "", relato: "", evidencia: "", constatacoesAuditor: "", constatacao: "" },
        { clausula: "7.1", auditadoNome: "", auditadoCargo: "", relato: "", evidencia: "", constatacoesAuditor: "", constatacao: "" },
      ], consideracoes: "" },
    }];
    renderModuleDetail("auditorias");
  });

  const frame = page.frameLocator('iframe[title="Auditorias"]');
  await frame.locator("#kpiRow").waitFor({ state: "visible" });
  await frame.locator("body").evaluate(() => {
    document.getElementById("regEditId").value = "AUD-REL-001";
    abrirRelatorio();
  });

  await expect(frame.locator("#modalRel")).toBeVisible();
  await expect(page.locator("body")).toHaveClass(/audits-reg-modal-open/);
  const layout = await frame.locator("#relBox").evaluate((modal) => ({
    overflowY: getComputedStyle(modal).overflowY,
    hasInternalScroll: modal.scrollHeight > modal.clientHeight,
    bodyLocked: getComputedStyle(document.body).overflow === "hidden",
  }));
  expect(layout.overflowY).toBe("auto");
  expect(layout.hasInternalScroll).toBe(true);
  expect(layout.bodyLocked).toBe(true);

  await frame.locator("#modalRel .modal-close").click();
  await expect(page.locator("body")).not.toHaveClass(/audits-reg-modal-open/);
});
