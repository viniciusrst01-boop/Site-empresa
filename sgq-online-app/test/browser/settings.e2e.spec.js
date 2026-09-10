const { test, expect } = require("@playwright/test");

async function signIn(page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await page.locator(".home-v2, #onboardingForm").first().waitFor();
  const onboarding = page.getByRole("button", { name: "Salvar e entrar no sistema" });
  if (await onboarding.count()) await onboarding.click();
}

test("theme preference persists after reloading the application", async ({ page }) => {
  await signIn(page);
  await page.locator('[data-view="configuracoes"]').click();
  const theme = page.locator('#settingsForm select[name="theme"]');
  await theme.selectOption("light");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByText("Configurações salvas.")).toBeVisible();
  await expect(page.locator("body")).toHaveClass(/theme-light/);

  await page.reload();
  await page.locator('#settingsForm').waitFor();
  await expect(page.locator('#settingsForm select[name="theme"]')).toHaveValue("light");
  await expect(page.locator("body")).toHaveClass(/theme-light/);
});

test("a new login always opens the home page", async ({ page }) => {
  await signIn(page);
  await page.locator('[data-view="configuracoes"]').click();
  await page.locator('#settingsForm').waitFor();
  await page.locator('form[action="/logout"]').evaluate((form) => form.submit());
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator(".home-v2")).toBeVisible();
});

test("support button opens and submits a request", async ({ page }) => {
  await signIn(page);
  await page.locator(".btn-support").click();
  await expect(page.getByRole("dialog", { name: "Abrir chamado de suporte" })).toBeVisible();
  await page.locator("#supportCategory").selectOption("technical");
  await page.locator("#supportDescription").fill("O painel não atualiza os dados depois de salvar o formulário.");
  await page.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(page.getByText("Solicitação enviada ao suporte.")).toBeVisible();
  await page.locator(".btn-support").click();
  await page.locator(".support-open-ticket").first().waitFor();
  await page.locator(".support-open-ticket").first().click();
  await expect(page.getByRole("dialog", { name: "Chamado de suporte" })).toBeVisible();
  await expect(page.locator(".support-chat-composer")).toBeVisible();
});
