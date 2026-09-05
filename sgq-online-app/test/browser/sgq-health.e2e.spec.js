const { test, expect } = require("@playwright/test");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

async function home(page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("browser.owner@example.com");
  await page.getByLabel("Senha").fill("Browser-Teste-123");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await page.locator(".home-v2, #onboardingForm").first().waitFor();
  const onboarding = page.getByRole("button", { name: "Salvar e entrar no sistema" });
  if (await onboarding.count()) await onboarding.click();
  await expect(page.locator(".home-v2-health")).toBeVisible();
}

const bounds = (page) => page.evaluate(() => Object.fromEntries([
  ".home-v2-health", ".home-v2-tasks", ".home-v2-summary", ".home-v2-modules", ".home-v2-bottom-grid", ".topbar", ".sidebar", ".app-footer",
].map((selector) => {
  const rect = document.querySelector(selector)?.getBoundingClientRect();
  return [selector, rect ? [rect.x, rect.y, rect.width, rect.height].map((n) => Math.round(n * 100) / 100) : null];
})));

// Only browser tests use synthetic history to exercise all four lines.
const fixture = (months = 6) => {
  const points = Array.from({ length: months }, (_, i) => ({
    month: new Date(Date.UTC(2026, 9 - months + i, 15)).toISOString().slice(0, 7),
    nonConformities: 2 + i % 3, actions: 18 + i * 4, audits: 2 + i % 2, documents: 1,
  }));
  return { months, points, current: { ...points.at(-1) }, hasData: true };
};

test("health keeps the desktop shell and renders contained charts in all themes", async ({ page }, info) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  const repo = path.join(__dirname, "../..");
  for (const file of ["app.js", "home-dashboard.css"]) {
    const body = execFileSync("git", ["show", `HEAD:sgq-online-app/public/${file}`], { cwd: repo, encoding: "utf8", maxBuffer: 8_000_000 });
    await page.route(`**/${file}*`, (route) => route.fulfill({ body, contentType: file.endsWith("js") ? "text/javascript" : "text/css" }));
  }
  await home(page);
  const sizes = [{ width: 1920, height: 1080 }, { width: 1600, height: 900 }, { width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 1024, height: 768 }];
  const before = [];
  for (const size of sizes) { await page.setViewportSize(size); before.push(await bounds(page)); }
  await page.unrouteAll();
  await page.route("**/api/dashboard/health-history?*", (route) => route.fulfill({ json: fixture(Number(new URL(route.request().url()).searchParams.get("months"))) }));
  await page.reload();
  await expect(page.locator(".sgq-health-plot")).toHaveAttribute("aria-busy", "false");
  const problems = [];
  for (const [index, size] of sizes.entries()) {
    await page.setViewportSize(size);
    await expect.poll(() => bounds(page)).toEqual(before[index]);
    for (const theme of ["theme-dark", "theme-light", "theme-white"]) {
      await page.evaluate((name) => { document.body.classList.remove("theme-light", "theme-white", "theme-dark"); document.body.classList.add(name); mountSGQHealth(); }, theme);
      await expect(page.locator(".sgq-health-plot")).toHaveAttribute("aria-busy", "false");
      const measured = await page.locator(".home-v2-health").evaluate((root) => {
        const rect = root.getBoundingClientRect();
        const clipped = [...root.querySelectorAll(".sgq-health-layout, .sgq-health-indicator, .sgq-health-copy, .sgq-health-legend, .sgq-health-title, .sgq-health-period, canvas")].filter((node) => {
          const box = node.getBoundingClientRect();
          return box.bottom > rect.bottom + 1 || box.right > rect.right + 1;
        }).map((node) => node.className || node.tagName);
        const canvas = root.querySelector("canvas");
        const chart = Chart.getChart(canvas);
        return { clipped, chart: [chart.chartArea.width, chart.chartArea.height], size: [rect.width, rect.height], canvasHeight: canvas.getBoundingClientRect().height, renderHeight: chart.height };
      });
      if (measured.clipped.length || measured.chart[1] < 30) problems.push({ size, theme, ...measured });
      await page.locator(".home-v2-health").screenshot({ path: info.outputPath(`health-${size.width}-${theme}.png`), animations: "disabled" });
      const point = await page.locator("canvas").first().evaluate((canvas) => {
        const chart = Chart.getChart(canvas);
        const dot = chart.getDatasetMeta(1).data.at(-1);
        return { x: dot.x, y: dot.y };
      });
      await page.locator(".sgq-health-canvas canvas").hover({ position: point });
      await expect(page.locator(".sgq-health-tooltip")).toBeVisible();
      await expect(page.locator(".sgq-health-tooltip > div")).toHaveCount(4);
      const overflow = await page.locator(".sgq-health-tooltip").evaluate((tip) => {
        const a = tip.getBoundingClientRect();
        const b = tip.closest(".home-v2-health").getBoundingClientRect();
        return a.left < b.left || a.right > b.right || a.top < b.top || a.bottom > b.bottom;
      });
      expect(overflow).toBe(false);
      await page.mouse.move(0, 0);
    }
  }
  expect(problems).toEqual([]);
});

test("periods, error recovery, empty state, mobile layout and navigation", async ({ page }, info) => {
  let mode = "success";
  const calls = [];
  await page.route("**/api/dashboard/health-history?*", async (route) => {
    const months = Number(new URL(route.request().url()).searchParams.get("months"));
    calls.push(months);
    if (mode === "error") return route.fulfill({ status: 503, json: {} });
    const data = fixture(months);
    if (mode === "empty") { data.hasData = false; data.points = []; }
    await route.fulfill({ json: data });
  });
  await page.setViewportSize({ width: 1600, height: 900 });
  await home(page);
  const select = page.getByLabel("Período da saúde do SGQ");
  await expect(page.locator(".sgq-health-plot")).toHaveAttribute("aria-busy", "false");
  for (const months of [1, 3, 12, 6]) {
    await select.selectOption(String(months));
    await expect.poll(() => page.locator(".sgq-health-canvas canvas").evaluate((canvas) => Chart.getChart(canvas)?.data.labels.length)).toBe(months);
  }
  expect(calls).toEqual([6, 1, 3, 12]);
  mode = "error";
  await page.reload();
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
  mode = "empty";
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByText("Nenhum histórico registrado neste período.")).toBeVisible();
  mode = "success";
  await page.reload();
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator(".sgq-health-plot")).toHaveAttribute("aria-busy", "false");
    const overflow = await page.locator(".home-v2-health").evaluate((root) => ({ x: root.scrollWidth - root.clientWidth, y: root.scrollHeight - root.clientHeight }));
    expect(overflow).toEqual({ x: 0, y: 0 });
    await page.locator(".home-v2-health").screenshot({ path: info.outputPath(`health-mobile-${width}.png`) });
  }
  await page.getByRole("button", { name: /Documentos pendentes/ }).click();
  await expect(page.locator(".home-v2-health")).toHaveCount(0);
  expect(await page.evaluate(() => Object.values(Chart.instances).filter((chart) => !chart.canvas.isConnected).length)).toBe(0);
});

test("the real endpoint authenticates, validates periods and reflects persisted edits", async ({ page }, info) => {
  expect((await page.request.get("/api/dashboard/health-history")).status()).toBe(401);
  await home(page);
  expect((await page.request.get("/api/dashboard/health-history?months=2")).status()).toBe(400);
  const bootstrap = await (await page.request.get("/api/bootstrap")).json();
  const save = await page.request.post("/api/data", {
    headers: { "X-CSRF-Token": bootstrap.csrfToken },
    data: { key: "state", moduleId: "documentos", value: { ...bootstrap.state, documents: [{ id: "HEALTH-TEST", title: "Documento de teste", status: "Em revisão" }] } },
  });
  expect(save.status()).toBe(200);
  const response = await page.request.get("/api/dashboard/health-history?months=12&companyId=999999");
  const data = await response.json();
  expect(response.status()).toBe(200);
  expect(data.points).toHaveLength(12);
  expect(data.current.documents).toBe(1);
  expect(data.points.at(-1).documents).toBe(1);
  expect(data.points[0].documents).toBeNull();
  await page.reload();
  await expect(page.locator('[data-health-value="documents"]')).toHaveText("1");
  await expect(page.locator(".sgq-health-history-note")).toBeVisible();
  await page.locator(".home-v2-health").screenshot({ path: info.outputPath("health-real-history.png") });
});

test("an old API still displays current saved counts without invented history", async ({ page }, info) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.route("**/api/dashboard/health-history?*", (route) => route.fulfill({ status: 404, json: { error: "not_found" } }));
  await home(page);
  const bootstrap = await (await page.request.get("/api/bootstrap")).json();
  const { getSGQHealthHistory, HEALTH_SOURCES } = require("../../sgq-health");
  const expected = getSGQHealthHistory(HEALTH_SOURCES.filter(key => bootstrap[key]).map(key => ({ key, value: bootstrap[key] })));
  await expect(page.locator(".sgq-health-plot")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toHaveCount(0);
  for (const [key, value] of Object.entries(expected.current)) {
    await expect(page.locator(`[data-health-value="${key}"]`)).toHaveText(new Intl.NumberFormat("pt-BR").format(value));
  }
  await expect(page.locator(".sgq-health-history-note")).toHaveText("Histórico mensal indisponível. Exibindo os dados atuais.");
  const datasets = await page.locator(".sgq-health-canvas canvas").evaluate(canvas => Chart.getChart(canvas).data.datasets.map(dataset => dataset.data));
  expect(datasets).toHaveLength(4);
  expect(datasets.every(values => values.slice(0, -1).every(value => value === null))).toBe(true);
  await page.getByLabel("Período da saúde do SGQ").selectOption("1");
  await expect.poll(() => page.locator(".sgq-health-canvas canvas").evaluate(canvas => Chart.getChart(canvas)?.data.labels.length)).toBe(1);
  await expect(page.locator(".sgq-health-history-note")).toBeVisible();
  await page.locator(".home-v2-health").screenshot({ path: info.outputPath("health-old-api-fallback.png") });
});

test("authorization and server failures do not silently fall back to current data", async ({ page }) => {
  await home(page);
  for (const status of [401, 403, 500]) {
    await page.route("**/api/dashboard/health-history?*", route => route.fulfill({ status, json: { error: "unavailable" } }));
    await page.reload();
    await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
    await expect(page.locator(".sgq-health-history-note")).toBeHidden();
    await page.unroute("**/api/dashboard/health-history?*");
  }
});

test("six-month visual preview is local-only and never saves its samples", async ({ page }, info) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await home(page);
  const before = await (await page.request.get("/api/bootstrap")).json();
  const writes = [];
  const historyRequests = [];
  page.on("request", request => {
    if (request.url().includes("/api/") && !["GET", "HEAD"].includes(request.method())) writes.push(request.url());
    if (request.url().includes("/api/dashboard/health-history")) historyRequests.push(request.url());
  });
  await page.goto("/app?previewHealth=1");
  await expect(page.locator(".sgq-health-history-note")).toHaveText("Simulação local: 6 meses de dados fictícios.");
  const readChart = () => page.locator(".sgq-health-canvas canvas").evaluate(canvas => Chart.getChart(canvas).data.datasets.map(dataset => dataset.data));
  expect(await readChart()).toEqual([
    [8, 11, 7, 9, 5, 2], [18, 24, 21, 30, 34, 38], [1, 2, 4, 3, 4, 2], [6, 5, 3, 4, 2, 1],
  ]);
  for (const [key, value] of Object.entries({ nonConformities: 2, actions: 38, audits: 2, documents: 1 })) {
    await expect(page.locator(`[data-health-value="${key}"]`)).toHaveText(String(value));
  }
  await page.locator(".home-v2-health").screenshot({ path: info.outputPath("health-six-month-local-preview.png"), animations: "disabled" });
  const select = page.getByLabel("Período da saúde do SGQ");
  await select.selectOption("3");
  await expect.poll(async () => (await readChart())[1]).toEqual([30, 34, 38]);
  await select.selectOption("12");
  await expect.poll(async () => (await readChart())[1]).toEqual([null, null, null, null, null, null, 18, 24, 21, 30, 34, 38]);
  expect(historyRequests).toEqual([]);
  expect(writes).toEqual([]);
  const after = await (await page.request.get("/api/bootstrap")).json();
  for (const key of ["state", "context", "risk", "leadership"]) expect(after[key]).toEqual(before[key]);
  for (const url of ["https://example.com/app?previewHealth=1", "https://example.com:4180/app", "https://localhost.example.com/app?previewHealth=1", "http://127.0.0.1/app", "http://127.0.0.1:4180/app?previewHealth=0", "http://127.0.0.1:4198/app?previewHealth=0"]) {
    expect(await page.evaluate(url => sgqHealthPreview(6, url), url)).toBeNull();
  }
  for (const url of ["http://127.0.0.1:4180/app", "http://localhost:4180/app", "http://127.0.0.1:4198/app"]) {
    const preview = await page.evaluate(url => sgqHealthPreview(6, url), url);
    expect(preview.simulated).toBe(true);
    expect(preview.points.map(point => point.actions)).toEqual([18, 24, 21, 30, 34, 38]);
  }
  await page.goto("/app");
  await expect(page.locator(".sgq-health-plot")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".sgq-health-history-note")).not.toHaveText("Simulação local: 6 meses de dados fictícios.");
});
