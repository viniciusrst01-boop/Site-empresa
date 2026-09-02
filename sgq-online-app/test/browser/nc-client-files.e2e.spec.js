const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test("cliente tem descricao abaixo de Setor e PDFs independentes com exclusao", async ({ page }, testInfo) => {
  const buffer = fs.readFileSync(path.join(__dirname, "../fixtures/rnc-cliente.pdf"));
  const pdf = (name) => ({ name, mimeType: "application/pdf", buffer });
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.locator('[data-view="modulos"]').click();
  await page.locator('[data-module-card="nao-conformidades"]').first().click();
  await page.locator("#ncDescription").fill("RNC com varios PDFs");
  for (const theme of ["dark", "light", "white"]) {
    await page.evaluate((theme) => {
      document.body.classList.toggle("theme-light", theme === "light");
      document.body.classList.toggle("theme-white", theme === "white");
    }, theme);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.locator("#ncOrigin").selectOption("Cliente");
      expect(await page.locator("#ncSector").evaluate((sector) => sector.closest(".field").nextElementSibling.classList.contains("nc-description-field"))).toBe(true);
      await expect(page.locator("#ncDescription")).toHaveValue("RNC com varios PDFs");
      await page.screenshot({ path: testInfo.outputPath(theme + "-" + width + ".png"), fullPage: true });
      await page.locator("#ncOrigin").selectOption("Interno");
      await expect(page.locator(".nc-register-column-right #ncDescription")).toHaveCount(1);
      await expect(page.locator("#ncDescription")).toHaveValue("RNC com varios PDFs");
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("#ncOrigin").selectOption("Cliente");
  await page.locator("#ncReference").selectOption({ index: 1 });
  await page.locator("#ncSector").selectOption({ index: 1 });
  await page.locator("#ncProcess").selectOption({ index: 1 });
  await page.locator("#ncClientPdf").setInputFiles([pdf("rnc-a.pdf"), pdf("rnc-b.pdf")]);
  await page.locator("#ncClientPdf").setInputFiles(pdf("rnc-c.pdf"));
  await expect(page.locator("#ncClientPdfList .nc-attachment-row")).toHaveCount(3);
  await page.getByRole("button", { name: "Excluir rnc-b.pdf", exact: true }).click();
  await expect(page.locator("#ncClientPdfList .nc-attachment-row")).toHaveCount(2);
  await page.locator("#ncClientPdf").setInputFiles({ name: "nao-pdf.txt", mimeType: "text/plain", buffer: Buffer.from("teste") });
  await expect(page.locator("#ncClientPdfList .nc-attachment-row")).toHaveCount(2);
  await page.locator("[data-nc-save]").click();
  await expect(page.locator("#ncMainTabs .active")).toHaveText("Controle");
  const state = await (await page.request.get("/api/bootstrap")).json();
  const nc = state.state.ncs.find((row) => row.descricao === "RNC com varios PDFs");
  expect(nc.rncClienteArquivos.map((file) => file.name)).toEqual(["rnc-a.pdf", "rnc-c.pdf"]);
  expect(await (await page.request.get("/api/nc-attachments?id=" + nc.rncClienteArquivos[0].id)).body()).toEqual(buffer);
  await page.locator('[data-nc-edit="' + nc.id + '"]').click();
  await expect(page.locator("#ncEditClientPdfList .nc-attachment-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Excluir rnc-a.pdf", exact: true }).click();
  await page.locator("#ncEditSave").click();
  await expect(page.locator("#ncEditSave")).toHaveCount(0);
  expect((await page.request.get("/api/nc-attachments?id=" + nc.rncClienteArquivos[0].id)).status()).toBe(404);
  await page.reload();
  const saved = await (await page.request.get("/api/bootstrap")).json();
  expect(saved.state.ncs.find((row) => row.id === nc.id).rncClienteArquivos).toHaveLength(1);
});
