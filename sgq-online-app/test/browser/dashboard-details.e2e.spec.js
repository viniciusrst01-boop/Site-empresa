const { test, expect } = require("@playwright/test");

for (const category of ["Operacional", "Estratégico", "Suporte"]) {
test(`${category} processes wrap after six and center the remaining blocks`, async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page.locator("[data-dashboard-detail]")).toHaveCount(5);
  for (const width of [1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(category => {
      pageContent.innerHTML = `<div class="process-reference-map process-swimlanes process-architecture">${contextProcessArchitectureLane(category, "Entrega de valor", Array.from({ length: 8 }, (_, i) => ({ id: String(i), codigo: `PR-${i}`, nome: `Processo ${i}`, status: "Ativo" })))}</div>`;
    }, category);
    const boxes = await page.locator(".process-architecture-node").evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width }; }));
    expect(boxes.filter(box => Math.abs(box.y - boxes[0].y) < 2)).toHaveLength(6);
    expect(boxes[6].y).toBeGreaterThan(boxes[0].y);
    expect(Math.abs((boxes[6].x + boxes[7].x + boxes[7].width) / 2 - (boxes[0].x + boxes[5].x + boxes[5].width) / 2)).toBeLessThan(2);
  }
});
}

test("dashboard cards open searchable follow-up dialogs", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page.locator("[data-dashboard-detail]")).toHaveCount(5);
  for (const kind of ["modulos", "auditorias", "nao-conformidades", "check-circle", "status"]) {
    const card = page.locator(`[data-dashboard-detail="${kind}"]`);
    await card.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("searchbox")).not.toBeFocused();
    await expect(dialog.locator("h2")).toBeFocused();
    const titleBox = await dialog.locator("h2").boundingBox();
    const searchBox = await dialog.getByRole("searchbox").boundingBox();
    expect(searchBox.x).toBeGreaterThan(titleBox.x + titleBox.width);
    expect(Math.abs(searchBox.y + searchBox.height / 2 - titleBox.y - titleBox.height / 2)).toBeLessThan(2);
    await expect(dialog.locator("tbody tr")).not.toHaveCount(0);
    await dialog.getByRole("searchbox").fill("no-matching-record-123");
    await expect(dialog).toContainText("Nenhum registro disponível");
    await dialog.getByRole("searchbox").fill("");
    if (kind === "status") await page.screenshot({ path: testInfo.outputPath("dashboard-follow-up.png") });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();
  }
  await page.locator('[data-dashboard-detail="auditorias"]').click();
  await page.getByRole("dialog").getByRole("button", { name: /Abrir módulo/ }).first().click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
