const { test, expect } = require("@playwright/test");
test("master bell opens notifications directly after login", async ({ page }) => {
  await page.route("**/api/bootstrap", async route => {
    const response = await route.fetch();
    const body = await response.json();
    body.user = { ...body.user, isAdmin: true, username: "viniciusrst" };
    await route.fulfill({ response, json: body });
  });
  await page.route("**/api/admin/notifications", route => route.fulfill({ json: {
    storeAvailable: true,
    notifications: [{ id: "store-delivery:test", component: "store", eventType: "store_delivery_attention", createdAt: new Date().toISOString(), message: "Falha no envio", metadata: { productName: "Combo teste", orderId: "test", recipientEmail: "teste@example.com" } }],
  } }));
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page.locator("body")).not.toHaveClass(/app-loading/);
  await page.locator('.topbar [data-view-target="notificacoes"]').click();
  await expect(page.getByText("Falha no envio", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ver detalhes", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("teste@example.com");
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.locator("[data-notification-badge]")).toBeHidden();
});
