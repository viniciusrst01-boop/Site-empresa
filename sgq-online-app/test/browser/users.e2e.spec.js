const { test, expect } = require("@playwright/test");

test("proprietário cria e exclui usuário pela interface", async ({ page }) => {
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.locator('[data-view="usuarios"]').click();
  await expect(page.getByRole("heading", { name: "Usuários", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Novo usuário" }).click();
  await page.locator("#userNameField").fill("Usuário Exclusão E2E");
  await page.locator("#userLoginField").fill("exclusao.e2e@example.com");
  await page.locator("#userRoleField").selectOption({ label: "Colaborador" });
  await page.locator("#userStatusField").selectOption("Pendente");
  await page.locator("[data-user-save]").click();
  await page.locator("#securityConfirmPassword").fill("Browser-Teste-123");
  await page.locator("[data-security-confirm]").click();

  const userRow = page.locator("#usersTbody tr", { hasText: "exclusao.e2e@example.com" });
  await expect(userRow).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.accept());
  await userRow.getByTitle("Excluir").click();
  await page.locator("#securityConfirmPassword").fill("Browser-Teste-123");
  await page.locator("[data-security-confirm]").click();

  await expect(page.getByText("Usuário excluído.")).toBeVisible();
  await expect(page.locator("#usersTbody tr", { hasText: "exclusao.e2e@example.com" })).toHaveCount(0);
  expect(browserErrors).toEqual([]);
});
