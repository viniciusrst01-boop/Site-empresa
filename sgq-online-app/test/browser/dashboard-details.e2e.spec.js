const { test, expect } = require("@playwright/test");

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
