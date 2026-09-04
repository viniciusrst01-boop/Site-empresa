const { test, expect } = require("@playwright/test");
const { planCatalog } = require("../../billing");

async function finishOnboardingIfNeeded(page) {
  await page.locator(".home-v2, #onboardingForm").first().waitFor({ state: "attached", timeout: 10_000 });
  const button = page.getByRole("button", { name: "Salvar e entrar no sistema" });
  if (await button.count()) {
    await button.click();
    await expect(page.locator(".home-v2")).toBeVisible({ timeout: 10_000 });
  }
}

test("billing shows one plan with monthly and annual totals on desktop and mobile", async ({ page }, testInfo) => {
  await page.route("**/api/billing", (route) => route.fulfill({
    json: {
      configured: true, canManage: true, company: { plan: "Plano QualityPro", accessLimit: 5 }, invoices: [],
      plans: planCatalog().map((plan) => ({ ...plan, priceId: `price_${plan.key}_test` })),
    },
  }));
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await finishOnboardingIfNeeded(page);
  await page.locator('[data-view="configuracoes"]').click();
  const cards = page.locator(".billing-plan-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("Mensal");
  await expect(cards.nth(0)).toContainText(/R\$\s*297,00\/mês/);
  await expect(cards.nth(1)).toContainText(/R\$\s*2\.970,00\/ano/);
  await expect(cards.nth(1)).toContainText("Pagamento único anual");
  await expect(cards.nth(1)).toContainText("R$ 594,00");
  await expect(cards.getByRole("button", { name: "Assinar" }).first()).toBeEnabled();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await cards.nth(0).scrollIntoViewIfNeeded();
    const layout = await cards.evaluateAll((elements) => elements.map((element) => ({
      overflow: element.scrollWidth - element.clientWidth,
      right: element.getBoundingClientRect().right,
    })));
    for (const card of layout) {
      expect(card.overflow).toBeLessThanOrEqual(1);
      expect(card.right).toBeLessThanOrEqual(width);
    }
    await page.screenshot({ path: testInfo.outputPath(`billing-${width}.png`) });
  }
});
