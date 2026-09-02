const { test, expect } = require("@playwright/test");

test("fornecedor preenche causas, status livre e evidência em todos os temas", async ({ page }, testInfo) => {
  let record = { id: "RNC-2026-0001", fornecedor: "Fornecedor de componentes", descricao: "Dimensão da peça fora da especificação aprovada.", version: 1, ishikawa: { metodo: "", maquina: "", maoObra: "", material: "", medicao: "", meioAmbiente: "", causaRaiz: "" }, acoes: [], evidences: [] };
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/supplier-rnc**", async (route) => {
    const request = route.request();
    expect(request.headers().authorization).toBe("Bearer browser-test-token");
    if (request.url().endsWith("/evidence")) {
      const file = { id: "evidence-1", name: request.postDataJSON().name, size: 8 };
      record.evidences.push(file);
      return route.fulfill({ status: 201, json: file });
    }
    if (request.method() === "POST") {
      const body = request.postDataJSON();
      expect(body.acoes[0].status).toBe("Aguardando validação externa");
      expect(body.acoes[0].evidenceIds).toEqual(["evidence-1"]);
      record = { ...record, ...body, version: record.version + 1, respondedAt: new Date().toISOString() };
    }
    await route.fulfill({ json: record });
  });
  await page.goto("/supplier-rnc#browser-test-token");
  await expect(page.locator("#response")).toBeVisible();
  await expect(page.locator("nav, .sidebar")).toHaveCount(0);
  await page.getByRole("button", { name: "Adicionar ação" }).click();
  await page.getByLabel("Método", { exact: true }).fill("Revisão do procedimento de inspeção");
  await page.getByLabel("Descrição da ação").fill("Revisar e treinar a equipe de inspeção");
  await page.getByLabel("Prazo", { exact: true }).fill("Até a próxima entrega");
  await page.getByLabel("Responsável pela ação").fill("Equipe de qualidade do fornecedor");
  await page.getByLabel("Status", { exact: true }).fill("Aguardando validação externa");
  await page.getByLabel("Evidências da ação").setInputFiles({ name: "evidencia.txt", mimeType: "text/plain", buffer: Buffer.from("evidencia") });
  await expect(page.getByRole("button", { name: "evidencia.txt" })).toBeVisible();
  const colors = new Set();
  for (const theme of ["dark", "light", "white"]) {
    await page.getByLabel("Tema", { exact: true }).selectOption(theme);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, background: getComputedStyle(document.body).backgroundColor, inputColor: getComputedStyle(document.querySelector("textarea")).color }));
      expect(layout.overflow).toBe(false);
      expect(layout.background).not.toBe(layout.inputColor);
      colors.add(layout.background);
      await page.screenshot({ path: testInfo.outputPath(`supplier-${theme}-${width}.png`), fullPage: true });
    }
  }
  expect(colors.size).toBe(3);
  await page.getByRole("button", { name: "Salvar resposta" }).click();
  await expect(page.getByRole("status")).toHaveText("Resposta salva e disponibilizada à empresa.");
  expect(record.ishikawa.metodo).toBe("Revisão do procedimento de inspeção");
  expect(errors).toEqual([]);
});

test("campo de e-mail do fornecedor acompanha os três temas internos", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await page.locator('[data-view="modulos"]').click();
  await page.locator('[data-module-card="nao-conformidades"]').first().click();
  await page.locator("#ncOrigin").selectOption("Fornecedor");
  await expect(page.getByLabel("E-mail do fornecedor")).toBeVisible();
  for (const theme of ["dark", "light", "white"]) {
    await page.evaluate((theme) => { document.body.classList.toggle("theme-white", theme === "white"); document.body.classList.toggle("theme-light", theme === "light"); }, theme);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.getByLabel("E-mail do fornecedor")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`supplier-email-${theme}.png`), fullPage: true });
  }
  await page.locator("#ncOrigin").selectOption("Interno");
  await expect(page.getByLabel("E-mail do fornecedor")).toBeHidden();
});
