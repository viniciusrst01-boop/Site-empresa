const { test, expect } = require("@playwright/test");

test("editing sends a fresh notification to previously invited selected participants", async ({ page }) => {
  const notifications = [];
  await page.route("**/api/leadership/meeting-invitations", async (route) => {
    const body = route.request().postDataJSON();
    notifications.push(body);
    await route.fulfill({ json: { sent: body.participantIds.length, deliveries: body.participantIds.map((userId) => ({ userId, delivery: "sent" })) } });
  });
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.waitForFunction(() => typeof window.renderModuleDetail === "function");
  await page.evaluate(() => renderModuleDetail("lideranca"));
  for (let edit = 0; edit < 2; edit++) {
    await page.locator('[data-lc-action="edit-acao"]').first().click();
    await page.locator("[data-lc-participant]").first().check();
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.locator("#leadershipRecordModal")).toHaveCount(0);
    await expect(page.getByText(/(?:Nova ação salva|Ação atualizada)\. Verifique seu calendário\./)).toBeVisible();
  }
  expect(notifications).toHaveLength(2);
  expect(notifications[1].participantIds).toEqual(notifications[0].participantIds);
  expect(notifications[1].notificationId).not.toBe(notifications[0].notificationId);
});
