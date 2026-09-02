const { test, expect } = require("@playwright/test");

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAF/gJ+NQdFlAAAAABJRU5ErkJggg==", "base64");

test("fornecedor visualiza e amplia apenas as fotos anexadas a RNC em todos os temas", async ({ page }, testInfo) => {
  const record = {
    id: "RNC-2026-0007", fornecedor: "Aços & Cia Distribuidora", descricao: "Item recebido com avaria.", version: 1,
    ishikawa: { metodo: "", maquina: "", maoObra: "", material: "", medicao: "", meioAmbiente: "", causaRaiz: "" }, acoes: [], evidences: [],
    ncEvidences: [
      { id: "8cb3642b-0d42-4781-b976-ae8eb7d1b062", name: "avaria-frontal.png", size: png.length, type: "image/png" },
      { id: "fd12b57e-bfd7-492d-84ab-543381700adc", name: "avaria-lateral.png", size: png.length, type: "image/png" },
    ],
  };
  const downloads = [];
  page.on("download", (download) => downloads.push(download.suggestedFilename()));
  await page.route("**/api/supplier-rnc/**", async (route) => {
    const request = route.request();
    expect(request.headers().authorization).toBe("Bearer evidence-test-token");
    if (request.url().includes("/nc-evidence/")) return route.fulfill({ status: 200, contentType: "image/png", body: png });
    await route.fulfill({ json: record });
  });
  await page.route("**/api/supplier-rnc", async (route) => route.fulfill({ json: record }));
  await page.goto("/supplier-rnc#evidence-test-token");
  await expect(page.getByRole("heading", { name: "Evidências da não conformidade" })).toBeVisible();
  const photos = page.getByRole("button", { name: /Ampliar evidência/ });
  await expect(photos).toHaveCount(2);
  await expect(photos.first().locator("img")).toHaveAttribute("src", /^blob:/);
  for (const theme of ["white", "light", "dark"]) {
    await page.getByLabel("Tema", { exact: true }).selectOption(theme);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await expect(photos.first()).toBeVisible();
      const layout = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
      expect(layout).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`supplier-nc-evidence-${theme}-${width}.png`), fullPage: true });
    }
  }
  await photos.first().click();
  await expect(page.locator("dialog.supplier-nc-evidence-viewer[open]")).toBeVisible();
  await expect(page.locator("dialog.supplier-nc-evidence-viewer img")).toHaveAttribute("src", /^blob:/);
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(page.locator("dialog.supplier-nc-evidence-viewer")).toHaveCount(0);
  expect(downloads).toEqual([]);
});
