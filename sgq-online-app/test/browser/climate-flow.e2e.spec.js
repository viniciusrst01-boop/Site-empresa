const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

async function login(page, username = "browser.owner@example.com", password = "Browser-Teste-123") {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill(username);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function open(page, tab = "determination") {
  await page.evaluate((tab) => { climateTab = tab; renderModuleDetail("mudancas-climaticas"); }, tab);
}

async function saved(page) {
  const response = await page.request.get("/api/bootstrap");
  expect(response.ok()).toBe(true);
  return (await response.json()).state.climate;
}

async function determine(page, relevant = "Sim", stakeholder = "Não") {
  await open(page);
  await page.locator("#climateRelevant").selectOption(relevant);
  await page.locator("#climateStakeholder").selectOption(stakeholder);
  await page.locator("#climateJustification").fill("Análise da continuidade dos processos e dos requisitos dos clientes.");
  if (stakeholder === "Sim") await page.locator("#climateStakeholderDetail").fill("Cliente exige plano de continuidade.");
  await page.locator("#climateStatus").selectOption("Em revisão");
  await page.locator("#climateOwner").selectOption({ index: 1 });
  await page.locator("#climateNextReview").fill("2027-06-30");
  const response = page.waitForResponse(r => r.url().endsWith("/api/data") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Salvar determinação" }).click();
  expect((await response).ok()).toBe(true);
  await expect.poll(() => page.evaluate(() => climateSaving)).toBe(false);
}

async function newIssue(page, description, relevant = "Sim", status = "Não iniciada", due = "2999-12-31") {
  await page.getByRole("button", { name: "Nova questão", exact: true }).click();
  await page.locator("#climateIssueDescription").fill(description);
  await page.locator("#climateIssueRelevant").selectOption(relevant);
  await page.locator("#climateIssueImpact").fill("Justificativa documentada para a avaliação.");
  if (relevant !== "Não") {
    await page.locator("#climateIssueStatus").selectOption(status);
    await page.locator("#climateIssueAction").fill("Acompanhar a continuidade do processo.");
    await page.locator("#climateIssueOwner").selectOption({ index: 1 });
    await page.locator("#climateIssueDue").fill(due);
  }
}

async function saveIssue(page) {
  await page.locator('[data-climate-action="save-issue"]').click();
  await expect(page.locator("#climateModal")).not.toHaveClass(/show/);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await page.evaluate(async () => {
    state.climate = {};
    climateData();
    if (!await saveRemoteData("state", state, "mudancas-climaticas")) throw new Error("Fixture save failed");
    moduleHistory["mudancas-climaticas"] = { undo: [], redo: [] };
  });
  await open(page);
});

test("determination validates prerequisites, persists answers, and hides only dependent fields", async ({ page }, testInfo) => {
  await expect(page.locator(".climate-kpis")).toContainText("Não definida");
  await expect(page.locator('[data-climate-tab="issues"]')).toHaveCount(0);
  await expect(page.locator("#climateStakeholderDetail")).toBeHidden();
  for (const id of ["climateRelevant", "climateStakeholder", "climateOwner", "climateStatus"]) await expect(page.locator(`#${id}`)).toHaveValue("");
  await page.getByRole("button", { name: "Salvar determinação" }).click();
  expect((await saved(page)).determination.reviewedAt).toBe("");
  await determine(page, "Não", "Não");
  await expect(page.locator('[data-climate-tab="issues"]')).toHaveCount(0);
  await expect(page.locator("#climateJustification")).toBeVisible();
  await page.reload();
  await open(page);
  await expect(page.locator("#climateRelevant")).toHaveValue("Não");
  await determine(page, "Não", "Sim");
  await expect(page.locator('[data-climate-tab="issues"]')).toBeVisible();
  await expect(page.locator("#climateStakeholderDetail")).toBeVisible();
  await page.locator("#climateStakeholder").selectOption("Não");
  await expect(page.locator("#climateStakeholderDetail")).toBeHidden();
  await page.locator("#climateStakeholder").selectOption("Sim");
  await expect(page.locator("#climateStakeholderDetail")).toHaveValue("Cliente exige plano de continuidade.");
  await determine(page, "Sim", "Não");
  await page.reload();
  await open(page);
  await expect(page.locator("#climateStakeholderDetail")).toBeHidden();
  expect((await saved(page)).determination.stakeholderDetail).toBe("Cliente exige plano de continuidade.");
  await page.screenshot({ path: testInfo.outputPath("determination-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: [...document.querySelectorAll("body *")].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && el.getBoundingClientRect().width > 0).slice(0, 15).map(el => ({ tag: el.tagName, id: el.id, class: el.className, right: el.getBoundingClientRect().right })) }));
  expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width + 1);
  await page.screenshot({ path: testInfo.outputPath("determination-mobile.png"), fullPage: true });
});

test("CRUD is persisted once after repeated tab changes; deletion and creation do not duplicate ids", async ({ page }) => {
  await determine(page);
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-climate-tab="issues"]').click();
    await page.locator('[data-climate-tab="determination"]').click();
  }
  await page.locator('[data-climate-tab="issues"]').click();
  await newIssue(page, "Primeira questão");
  let requests = 0;
  page.on("request", request => { if (request.url().endsWith("/api/data") && request.method() === "POST") requests++; });
  await saveIssue(page);
  expect(requests).toBe(1);
  await newIssue(page, "Segunda questão", "Parcial", "Monitorando");
  await saveIssue(page);
  await newIssue(page, "Terceira questão", "Não");
  await expect(page.locator("#climateIssueTreatment")).toBeHidden();
  await saveIssue(page);
  let data = await saved(page);
  expect(data.issues).toHaveLength(3);
  await page.locator(`[data-climate-action="delete-issue"][data-id="${data.issues[1].id}"]`).click();
  await expect(page.locator(".climate-table tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Voltar ação" }).click();
  await expect(page.locator(".climate-table tbody tr")).toHaveCount(3);
  expect((await saved(page)).issues).toHaveLength(3);
  await page.getByRole("button", { name: "Avançar ação" }).click();
  await expect(page.locator(".climate-table tbody tr")).toHaveCount(2);
  await newIssue(page, "Quarta questão");
  await saveIssue(page);
  data = await saved(page);
  expect(data.issues.map(row => row.id)).toEqual(["CLI-0001", "CLI-0003", "CLI-0004"]);
  await page.locator('[data-climate-action="edit-issue"]').first().click();
  await page.locator("#climateIssueDescription").fill("Primeira questão revisada");
  await page.locator("#climateIssueStatus").selectOption("Concluída");
  await saveIssue(page);
  await page.reload();
  await open(page, "issues");
  await expect(page.locator(".climate-table")).toContainText("Primeira questão revisada");
  expect((await saved(page)).issues[0].status).toBe("Concluída");
});

test("save failures preserve drafts and do not change persisted records or undo history", async ({ page }) => {
  await determine(page);
  await page.locator('[data-climate-tab="issues"]').click();
  await newIssue(page, "Rascunho preservado");
  const before = await page.evaluate(() => moduleHistoryState("mudancas-climaticas").undo.length);
  const fail = route => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"test_unavailable"}' });
  await page.route("**/api/data", fail);
  await page.locator('[data-climate-action="save-issue"]').click();
  await expect(page.getByText("Não foi possível salvar. Seus campos foram mantidos para tentar novamente.", { exact: true })).toBeVisible();
  await expect(page.locator("#climateIssueDescription")).toHaveValue("Rascunho preservado");
  expect((await saved(page)).issues).toHaveLength(0);
  expect(await page.evaluate(() => state.climate.issues.length)).toBe(0);
  expect(await page.evaluate(() => moduleHistoryState("mudancas-climaticas").undo.length)).toBe(before);
  await page.unroute("**/api/data", fail);
  await saveIssue(page);
  await page.route("**/api/data", fail);
  await page.getByRole("button", { name: "Voltar ação" }).click();
  await expect.poll(() => page.evaluate(() => climateSaving)).toBe(false);
  expect((await saved(page)).issues).toHaveLength(1);
  await expect(page.getByRole("button", { name: "Voltar ação" })).toBeEnabled();
  await page.locator('[data-climate-action="delete-issue"]').click();
  await expect.poll(() => page.evaluate(() => climateSaving)).toBe(false);
  await expect(page.locator(".climate-table")).toContainText("Rascunho preservado");
  await page.unroute("**/api/data", fail);
  await page.getByRole("button", { name: "Voltar ação" }).click();
  await expect(page.locator(".climate-table")).toContainText("Nenhuma questão climática avaliada.");
  expect((await saved(page)).issues).toHaveLength(0);
});

test("evidence stores the actual file, survives reload and undo, and rejects unsafe uploads", async ({ page }) => {
  await determine(page);
  await page.locator('[data-climate-tab="issues"]').click();
  await newIssue(page, "Questão com evidência");
  await page.locator("#climateIssueFile").setInputFiles({ name: "script.html", mimeType: "text/html", buffer: Buffer.from("<script>alert(1)</script>") });
  await expect(page.locator("#climateIssueEvidence")).toHaveText("Nenhum arquivo selecionado");
  const bytes = Buffer.from("%PDF-1.4\n% climate evidence test\n%%EOF");
  await page.locator("#climateIssueFile").setInputFiles({ name: "evidencia.pdf", mimeType: "application/pdf", buffer: bytes });
  await saveIssue(page);
  let data = await saved(page);
  const file = data.issues[0].evidenceFile;
  const url = `/api/climate-attachments?id=${file.id}`;
  const response = await page.request.get(url);
  expect(response.status()).toBe(200);
  expect(await response.body()).toEqual(bytes);
  expect((await page.request.post("/api/climate-attachments", { data: { name: "test.pdf", base64: bytes.toString("base64") } })).status()).toBe(403);
  const errors = await page.evaluate(async ({ id }) => {
    const invalid = await fetch("/api/climate-attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "fake.pdf", base64: btoa("not a pdf") }) });
    const inUse = await fetch(`/api/climate-attachments?id=${id}`, { method: "DELETE" });
    return [invalid.status, inUse.status];
  }, file);
  expect(errors).toEqual([400, 409]);
  await page.reload();
  await open(page, "issues");
  await expect(page.locator(`a[href="${url}"]`)).toBeVisible();
  await page.locator('[data-climate-action="edit-issue"]').click();
  await page.locator("#climateRemoveEvidence").click();
  await saveIssue(page);
  expect((await page.request.get(url)).status()).toBe(404);
  await page.getByRole("button", { name: "Voltar ação" }).click();
  await expect(page.locator(`a[href="${url}"]`)).toBeVisible();
  expect((await page.request.get(url)).status()).toBe(200);
});

test("conditional treatment preserves previous data and does not inflate overdue or completed totals", async ({ page }, testInfo) => {
  await determine(page);
  await page.locator('[data-climate-tab="issues"]').click();
  await newIssue(page, "Concluída", "Sim", "Concluída", "2000-01-01");
  await saveIssue(page);
  await newIssue(page, "Atrasada", "Sim", "Em andamento", "2000-01-01");
  await saveIssue(page);
  await newIssue(page, "Parcial", "Parcial", "Monitorando");
  await saveIssue(page);
  await newIssue(page, "Reavaliada", "Sim", "Em andamento", "2000-01-01");
  await saveIssue(page);
  await page.locator('[data-climate-action="edit-issue"]').last().click();
  await page.locator("#climateIssueRelevant").selectOption("Não");
  await expect(page.locator("#climateIssueTreatment")).toBeHidden();
  await saveIssue(page);
  expect((await saved(page)).issues.at(-1).due).toBe("2000-01-01");
  await expect(page.locator(".climate-table tbody tr").last()).toContainText("Não aplicável");
  await page.locator('[data-climate-tab="indicators"]').click();
  const frame = page.frameLocator("#climateIndicatorsFrame");
  await expect(frame.locator("#dStatus")).toBeVisible();
  const counts = await frame.locator("body").evaluate(() => {
    const a = computeAgg();
    return { total: a.total, applicable: a.aplicaveis, completed: a.concl, late: a.atrasadas, open: a.abertas, rate: a.taxa, evidence: a.comEvid };
  });
  expect(counts).toEqual({ total: 4, applicable: 3, completed: 1, late: 1, open: 2, rate: 33, evidence: 0 });
  const downloadEvent = page.waitForEvent("download");
  await frame.getByRole("button", { name: "Exportar", exact: true }).click();
  const csv = fs.readFileSync(await (await downloadEvent).path(), "utf8");
  expect(csv).toContain('"Questões avaliadas";"4"');
  expect(csv).toContain('"Taxa de tratamento (%)";"33"');
  await frame.getByRole("button", { name: /Expandir gráficos/ }).click();
  await expect(frame.locator("#fullscreenButton")).toHaveAttribute("aria-pressed", "true");
  await frame.locator("#fullscreenButton").click();
  await page.screenshot({ path: testInfo.outputPath("indicators-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => frame.locator("body").evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("indicators-mobile.png"), fullPage: true });
  await page.reload();
  await open(page, "issues");
  await page.locator('[data-climate-action="edit-issue"]').last().click();
  await page.locator("#climateIssueRelevant").selectOption("Sim");
  await expect(page.locator("#climateIssueAction")).toHaveValue("Acompanhar a continuidade do processo.");
});

test("saving climate data does not overwrite unrelated state changed by another session", async ({ page }) => {
  await page.evaluate(async () => {
    const updated = structuredClone(state);
    updated.documents = [{ id: "CONCURRENT-DOC", title: "Documento de outra sessão" }];
    const response = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "state", value: updated }) });
    if (!response.ok) throw new Error("Concurrent fixture failed");
    state.documents = [];
  });
  await determine(page);
  const data = await (await page.request.get("/api/bootstrap")).json();
  expect(data.state.documents).toEqual([{ id: "CONCURRENT-DOC", title: "Documento de outra sessão" }]);
});

test("upload and save retries retain the file without duplicate records or duplicate uploads", async ({ page }) => {
  await determine(page);
  await page.locator('[data-climate-tab="issues"]').click();
  await newIssue(page, "Envio com nova tentativa");
  const bytes = Buffer.from("%PDF-1.4\nretry evidence\n%%EOF");
  await page.locator("#climateIssueFile").setInputFiles({ name: "retry.pdf", mimeType: "application/pdf", buffer: bytes });
  const fail = route => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"test_unavailable"}' });
  await page.route("**/api/climate-attachments", fail);
  await page.locator('[data-climate-action="save-issue"]').click();
  await expect(page.getByText("Não foi possível enviar a evidência. Tente novamente.", { exact: true })).toBeVisible();
  expect((await saved(page)).issues).toHaveLength(0);
  await page.unroute("**/api/climate-attachments", fail);
  let uploads = 0;
  page.on("request", request => { if (request.url().endsWith("/api/climate-attachments") && request.method() === "POST") uploads++; });
  await page.route("**/api/data", fail);
  await page.locator('[data-climate-action="save-issue"]').click();
  await expect(page.getByText("Não foi possível salvar. Seus campos foram mantidos para tentar novamente.", { exact: true })).toBeVisible();
  expect(uploads).toBe(1);
  await page.unroute("**/api/data", fail);
  await saveIssue(page);
  expect(uploads).toBe(1);
  const data = await saved(page);
  expect(data.issues).toHaveLength(1);
  expect(data.issues[0]._uploadEvidence).toBeUndefined();
  expect(await (await page.request.get(`/api/climate-attachments?id=${data.issues[0].evidenceFile.id}`)).body()).toEqual(bytes);
});

test("required treatment fields follow the selected status, and a slow save cannot be submitted twice", async ({ page }, testInfo) => {
  await determine(page);
  await page.locator('[data-climate-tab="issues"]').click();
  await page.getByRole("button", { name: "Nova questão", exact: true }).click();
  await expect(page.locator("#climateIssueRelevant")).toHaveValue("");
  await expect(page.locator("#climateIssueTreatment")).toBeHidden();
  await page.locator("#climateIssueDescription").fill("Tratamento em andamento");
  await page.locator("#climateIssueRelevant").selectOption("Sim");
  await page.locator("#climateIssueImpact").fill("Impacto avaliado.");
  await expect(page.locator("#climateIssueStatus")).toHaveValue("");
  await page.locator("#climateIssueStatus").selectOption("Em andamento");
  await page.locator('[data-climate-action="save-issue"]').click();
  expect((await saved(page)).issues).toHaveLength(0);
  await expect(page.locator("#climateIssueAction")).toBeFocused();
  await page.locator("#climateIssueAction").fill("Plano de continuidade.");
  await page.locator("#climateIssueOwner").selectOption({ index: 1 });
  await page.locator("#climateIssueDue").fill("2027-01-31");
  await page.screenshot({ path: testInfo.outputPath("issue-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#climateIssueDescription").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("issue-mobile.png"), fullPage: true });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let requests = 0;
  await page.route("**/api/data", async route => { requests++; await gate; await route.continue(); });
  try {
    await page.locator('[data-climate-action="save-issue"]').click();
    await expect(page.locator('[data-climate-action="save-issue"]')).toBeDisabled();
    await page.evaluate(() => climateSaveIssue());
    expect(requests).toBe(1);
  } finally {
    release();
  }
  await expect(page.locator("#climateModal")).not.toHaveClass(/show/);
  expect((await saved(page)).issues).toHaveLength(1);
});

test("read-only users can inspect but cannot edit climate data or attachments", async ({ page, browser, baseURL }) => {
  await determine(page);
  const username = `climate.viewer.${Date.now()}@example.com`;
  const invitation = await page.evaluate(async (username) => {
    const response = await fetch("/api/company/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, displayName: "Leitor climático", role: "Qualidade", status: "Pendente", currentPassword: "Browser-Teste-123", permissions: { modules: true, reports: false, manageUsers: false, moduleAccess: { "mudancas-climaticas": "view" } } }) });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }, username);
  const token = new URL(invitation.invitation.invitationLink).searchParams.get("token");
  const accept = await page.request.post("/accept-invite", { form: { token, password: "Climate-Viewer-123", passwordConfirmation: "Climate-Viewer-123" } });
  expect(accept.ok()).toBe(true);
  const context = await browser.newContext({ baseURL });
  try {
    const viewer = await context.newPage();
    await login(viewer, username, "Climate-Viewer-123");
    await open(viewer);
    await expect(viewer.locator("#climateRelevant")).toBeDisabled();
    await expect(viewer.locator('[data-climate-action="save-determination"]')).toHaveCount(0);
    await viewer.locator('[data-climate-tab="issues"]').click();
    await expect(viewer.locator('[data-climate-action="new-issue"]')).toHaveCount(0);
    const statuses = await viewer.evaluate(async () => {
      const write = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "state", moduleId: "mudancas-climaticas", value: { climate: {} } }) });
      const upload = await fetch("/api/climate-attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "file.pdf", base64: btoa("%PDF-1.4") }) });
      return [write.status, upload.status];
    });
    expect(statuses).toEqual([403, 403]);
  } finally {
    await context.close();
  }
});
