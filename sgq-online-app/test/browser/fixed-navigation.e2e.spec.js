const { test, expect } = require("@playwright/test");

test("abas dos modulos incorporados ficam fixas durante a rolagem", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
  for (const width of [1366, 1024]) {
    await page.setViewportSize({ width, height: 768 });
    for (const id of ["equipamentos", "auditorias", "fornecedores", "satisfacao-clientes"]) {
      await page.evaluate(id => renderModuleDetail(id), id);
      const frame = page.frameLocator(".page-content iframe").first();
      await expect(frame.locator("#mainTabs")).toBeVisible();
      const result = await frame.locator("#tabContent").evaluate(content => {
        const marker = document.createElement("div");
        marker.style.height = "2000px";
        content.append(marker);
        const tabs = document.querySelector("#mainTabs");
        const before = tabs.getBoundingClientRect().top;
        content.scrollTop = content.scrollHeight;
        return {
          scrolled: content.scrollTop,
          before,
          after: tabs.getBoundingClientRect().top,
          bottom: content.getBoundingClientRect().bottom,
          viewport: innerHeight,
        };
      });
      expect(result.scrolled, id).toBeGreaterThan(0);
      expect(result.after, id).toBe(result.before);
      expect(result.bottom, id).toBeLessThanOrEqual(result.viewport + 1);
    }
  }
});
