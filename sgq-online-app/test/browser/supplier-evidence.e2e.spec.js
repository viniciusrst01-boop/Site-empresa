const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test("evidências do fornecedor abrem ampliadas sem download nos três temas", async ({ page }, testInfo) => {
  const downloads = [];
  page.on("download", (download) => downloads.push(download.suggestedFilename()));
  await page.route("**/api/bootstrap", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.state = { ...(body.state || {}), ncs: [{ id: "RNC-PREVIA", origem: "Fornecedor", origemRef: "Fornecedor Teste", descricao: "Evidências para inspeção visual", dataOrigem: "2026-09-02", ishikawa: {}, acoes: [], historico: [] }] };
    body.needsOnboarding = false;
    await route.fulfill({ response, json: body });
  });
  await page.route("**/api/nc-supplier?*", (route) => route.fulfill({ json: { email: "teste@example.com", respondedAt: "2026-09-02T12:00:00Z", files: [{ id: "image-1", name: "evidencia.png" }, { id: "image-2", name: "imagem-indisponivel.png" }, { id: "pdf-1", name: "relatorio.pdf" }] } }));
  await page.route("**/api/nc-evidence?*", (route) => {
    if (new URL(route.request().url()).searchParams.get("file") === "image-2") return route.fulfill({ status: 404 });
    return route.fulfill({ contentType: "application/octet-stream", headers: { "Content-Disposition": 'attachment; filename="evidencia.png"' }, body: fs.readFileSync(path.join(__dirname, "../../public/assets/qualitypro-cloud-logo-app.png")) });
  });
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await page.locator('[data-view="modulos"]').click();
  await page.locator('[data-module-card="nao-conformidades"]').first().click();
  await page.getByRole("button", { name: "Controle", exact: true }).click();
  await page.getByRole("button", { name: "RNC-PREVIA", exact: true }).click();
  const thumb = page.getByRole("button", { name: "Visualizar evidencia.png", exact: true });
  await expect(thumb).toBeEnabled();
  await expect(page.getByRole("link", { name: "relatorio.pdf", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /imagem-indisponivel.png/ })).toBeVisible();
  expect(await thumb.locator("img").evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  for (const theme of ["dark", "light", "white"]) {
    await page.evaluate((theme) => { document.body.classList.toggle("theme-white", theme === "white"); document.body.classList.toggle("theme-light", theme === "light"); }, theme);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await thumb.click();
      const viewer = page.getByRole("dialog", { name: "Visualizar evidencia.png" });
      await expect(viewer).toBeVisible();
      await expect(viewer.locator("img")).toBeInViewport();
      const layout = await viewer.evaluate((dialog) => ({ width: dialog.getBoundingClientRect().width, imageWidth: dialog.querySelector("img").naturalWidth, overflow: dialog.scrollWidth > dialog.clientWidth }));
      expect(layout.width).toBeLessThanOrEqual(width);
      expect(layout.imageWidth).toBeGreaterThan(0);
      expect(layout.overflow).toBe(false);
      await page.screenshot({ path: testInfo.outputPath(`evidence-${theme}-${width}.png`) });
      await page.keyboard.press("Escape");
      await expect(viewer).not.toBeVisible();
      await expect(thumb).toBeFocused();
    }
  }
  await thumb.click();
  await page.getByRole("button", { name: "Fechar visualização", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(downloads).toEqual([]);
  await page.locator(".nc-rnc-modal > .modal-hd [data-nc-close]").click();
  await expect(page.locator(".nc-evidence-viewer")).toHaveCount(0);
});
