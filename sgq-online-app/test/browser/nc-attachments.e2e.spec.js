const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test("NC aceita tres fotos e permite excluir em todas as origens e temas", async ({ page }, testInfo) => {
  const image = fs.readFileSync(path.join(__dirname, "../../public/assets/qualitypro-cloud-logo-app.png"));
  const photo = (name) => ({ name, mimeType: "image/png", buffer: image });
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
  const rejectedLimit = await page.evaluate(async () => {
    const response = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "state", moduleId: "nao-conformidades", value: { ncs: [{ evidencias: [{}, {}, {}, {}] }] } }) });
    return { status: response.status, body: await response.json() };
  });
  expect(rejectedLimit).toEqual({ status: 400, body: { error: "too_many_nc_attachments" } });
  for (const origin of ["Interno", "Cliente", "Fornecedor"]) {
    await page.locator('[data-view="modulos"]').click();
    await page.locator('[data-module-card="nao-conformidades"]').first().click();
    await page.getByRole("button", { name: "Registrar NC", exact: true }).first().click();
    await page.locator("#ncOrigin").selectOption(origin);
    if (origin !== "Interno") await page.locator("#ncReference").selectOption({ index: 1 });
    if (origin === "Fornecedor") await page.locator("#ncSupplierEmail").fill("supplier@example.com");
    await page.locator("#ncSector").selectOption({ index: 1 });
    await page.locator("#ncProcess").selectOption({ index: 1 });
    await page.locator("#ncDescription").fill("Teste fotos " + origin);
    await page.locator("#ncEvidence").setInputFiles([photo("foto-1.png"), photo("foto-2.png")]);
    await page.locator("#ncEvidence").setInputFiles(photo("foto-3.png"));
    await expect(page.locator("#ncEvidenceList .nc-attachment-row")).toHaveCount(3);
    await page.locator("#ncEvidence").setInputFiles(photo("foto-4.png"));
    await expect(page.getByText("Selecione no máximo 3 fotos por NC.", { exact: true })).toBeVisible();
    await expect(page.locator("#ncEvidenceList .nc-attachment-row")).toHaveCount(3);
    await page.getByRole("button", { name: "Excluir foto-2.png", exact: true }).click();
    await page.locator("#ncEvidence").setInputFiles(photo("foto-4.png"));
    for (const theme of ["dark", "light", "white"]) {
      await page.evaluate((theme) => {
        document.body.classList.toggle("theme-white", theme === "white");
        document.body.classList.toggle("theme-light", theme === "light");
      }, theme);
      await page.setViewportSize({ width: theme === "white" ? 390 : 1440, height: 900 });
      await page.locator("#ncEvidenceList").scrollIntoViewIfNeeded();
      await expect(page.getByRole("button", { name: "Excluir foto-1.png", exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(origin + "-" + theme + ".png"), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("[data-nc-save]").click();
    await expect(page.locator("#ncMainTabs .active")).toHaveText("Controle");
    const bootstrap = await (await page.request.get("/api/bootstrap")).json();
    const nc = bootstrap.state.ncs.find((row) => row.descricao === "Teste fotos " + origin);
    expect(nc.evidencias.map((file) => file.name)).toEqual(["foto-1.png", "foto-3.png", "foto-4.png"]);
    const stored = await page.request.get("/api/nc-attachments?id=" + nc.evidencias[0].id);
    expect(stored.status()).toBe(200);
    expect(await stored.body()).toEqual(image);
    const noCsrf = await page.request.post("/api/nc-attachments", { data: { name: "bad.png", base64: image.toString("base64") } });
    expect(noCsrf.status()).toBe(403);
    await page.locator('[data-nc-edit="' + nc.id + '"]').click();
    await expect(page.locator("#ncEditEvidenceList .nc-attachment-row")).toHaveCount(3);
    await page.getByRole("button", { name: "Excluir foto-1.png", exact: true }).click();
    await page.locator("#ncEditSave").click();
    await expect(page.locator("#ncEditSave")).toHaveCount(0);
    expect((await page.request.get("/api/nc-attachments?id=" + nc.evidencias[0].id)).status()).toBe(404);
    await page.reload();
    const updated = await (await page.request.get("/api/bootstrap")).json();
    expect(updated.state.ncs.find((row) => row.id === nc.id).evidencias).toHaveLength(2);
  }
});
