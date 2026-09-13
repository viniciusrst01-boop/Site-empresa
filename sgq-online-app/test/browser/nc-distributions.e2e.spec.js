const { test, expect } = require("@playwright/test");

async function openDashboard(page, theme = "light") {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.route("**/api/bootstrap", async (route) => {
    const response = await route.fetch();
    const payload = await response.json();
    payload.state ||= {};
    payload.state.ncs = Array.from({ length: 36 }, (_, index) => ({
      id: `RNC-REF-${index}`, dataOrigem: `${index < 12 ? "2025" : "2026"}-01-01`,
      status: index < 2 ? "Aguardando análise" : index < 8 ? "Ações em andamento" : index < 10 ? "Aguardando eficácia" : "Encerrado",
      gravidade: ["Menor", "Média", "Maior"][Math.floor(index / 12)],
      origem: "Interno", setor: "Qualidade", processo: "Inspeção", acoes: [],
    }));
    await route.fulfill({ response, json: payload });
  });
  await page.goto(`/nc-tv?embedded=1&theme=${theme}`);
  await expect(page.locator("#chartStatusLegend strong")).toHaveText(["2", "6", "2", "26"]);
  await expect(page.locator("#chartOriginLegend strong")).toHaveText(["36"]);
  await page.evaluate(() => document.fonts.ready);
}

test("distribuições de RNC seguem a referência nos temas e tamanhos de tela", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDashboard(page);
  for (const theme of ["light", "dark", "white"]) {
    if (theme !== "light") {
      await page.goto(`/nc-tv?embedded=1&theme=${theme}`);
      await expect(page.locator("#chartSeverityLegend strong")).toHaveText(["12", "12", "12"]);
    }
    for (const width of [1440, 1000, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect.poll(() => page.evaluate(() => tvCharts.chartStatus.width)).toBeGreaterThan(100);
      await page.evaluate(() => Object.values(tvCharts).forEach((chart) => { chart.stop(); chart.resize(); chart.update("none"); }));
      const layout = await page.locator(".tv-distribution").evaluateAll((panels) => panels.map((panel) => {
        const canvas = panel.querySelector("canvas");
        const chart = Chart.getChart(canvas);
        const legend = panel.querySelector(".tv-distribution-legend");
        const arc = chart.getDatasetMeta(0).data[0];
        return {
          overflow: panel.scrollWidth - panel.clientWidth,
          verticalOverflow: panel.scrollHeight - panel.clientHeight,
          text: chart.options.plugins.centerText.text,
          themeText: getComputedStyle(panel).getPropertyValue("--text").trim(),
          total: chart.options.plugins.centerText.value,
          values: [...legend.querySelectorAll("strong")].reduce((sum, item) => sum + Number(item.textContent), 0),
          painted: canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0),
          arcMargin: Math.min(arc.x - arc.outerRadius, canvas.width - arc.x - arc.outerRadius, arc.y - arc.outerRadius, canvas.height - arc.y - arc.outerRadius),
        };
      }));
      for (const panel of layout) {
        expect(panel.overflow).toBeLessThanOrEqual(1);
        expect(panel.verticalOverflow).toBeLessThanOrEqual(1);
        expect(panel.text).toBe(panel.themeText);
        expect(panel.total).toBe(36);
        expect(panel.values).toBe(panel.total);
        expect(panel.painted).toBe(true);
        expect(panel.arcMargin).toBeGreaterThanOrEqual(4);
      }
      if (width === 1440) {
        const blocks = await page.locator(".tv-grid > .tv-panel").evaluateAll((panels) => panels.slice(1, 5).map((panel) => {
          const rect = panel.getBoundingClientRect();
          return { top: rect.top, width: rect.width, height: rect.height };
        }));
        expect(new Set(blocks.map((block) => block.top)).size).toBe(1);
        for (const block of blocks) {
          expect(block.height).toBe(190);
          expect(Math.abs(block.width - blocks[0].width)).toBeLessThanOrEqual(1);
        }
      }
      await page.screenshot({ path: testInfo.outputPath(`${theme}-${width}.png`), fullPage: true });
      if (theme === "light" && width === 1440) {
        const panels = await page.locator(".tv-distribution").all();
        const first = await panels[0].boundingBox();
        const last = await panels[1].boundingBox();
        await page.screenshot({ path: testInfo.outputPath("nc-distributions-preview.png"), clip: { x: first.x, y: first.y, width: last.x + last.width - first.x, height: Math.max(first.height, last.height) } });
      }
    }
  }
});

test("legendas preservam cores e totais ao filtrar RNCs e permitem alternar fatias", async ({ page }) => {
  await openDashboard(page);
  expect(await page.evaluate(() => tvCharts.chartOrigin.config.type)).toBe("doughnut");
  expect(await page.evaluate(() => tvCharts.chartOrigin.options.plugins.centerText.value)).toBe(36);
  await page.locator("#chartOriginLegend button").first().click();
  await expect(page.locator("#chartOriginLegend button").first()).toHaveAttribute("aria-pressed", "false");
  await page.locator("#chartStatusLegend button").last().click();
  await expect(page.locator("#chartStatusLegend button").last()).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => tvCharts.chartStatus.getDataVisibility(3))).toBe(false);
  await page.locator("#chartStatusLegend button").last().click();
  await page.locator("#tvYear").selectOption("2026");
  await expect(page.locator("#chartStatusLegend strong")).toHaveText(["0", "0", "0", "24"]);
  await expect(page.locator("#chartSeverityLegend strong")).toHaveText(["0", "12", "12"]);
  expect(await page.locator("#chartStatusLegend .tv-legend-dot").last().evaluate((dot) => dot.style.getPropertyValue("--slice"))).toBe("#34d399");
  expect(await page.evaluate(() => tvCharts.chartStatus.options.plugins.centerText.value)).toBe(24);
  await page.evaluate(() => { currentState.ncs = []; renderDashboard(); });
  await expect(page.locator("#chartStatusLegend strong")).toHaveText(["0", "0", "0", "0"]);
  await expect(page.locator("#chartStatus canvas")).toHaveAttribute("aria-label", /0 RNCs no total/);
  expect(await page.evaluate(() => tvCharts.chartSeverity.options.plugins.centerText.value)).toBe(0);
});
