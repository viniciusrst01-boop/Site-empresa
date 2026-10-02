const { test, expect } = require("@playwright/test");

const pendingRecord = {
  version: "03",
  status: "Pendente",
  approver: "Hugo Melo",
  requestedBy: "Admin Qualitypro Com Br",
  requestedAt: "2026-09-26T16:00:00.000Z",
  decidedAt: null,
  considerations: "",
  questions: [
    { number: 1, text: "Como você avalia a qualidade do atendimento?", type: "escala" },
    { number: 2, text: "Você recomendaria nossa empresa?", type: "escala" },
  ],
};

test("página pública de aprovação permite contestar e confirma o envio", async ({ page }) => {
  let record = { ...pendingRecord };
  await page.route("**/api/satisfaction-approval", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: record });
    const body = route.request().postDataJSON();
    record = {
      ...record,
      status: body.decision === "approved" ? "Aprovado" : "Contestado",
      considerations: body.considerations || "",
      decidedAt: "2026-09-26T16:10:00.000Z",
    };
    return route.fulfill({ json: record });
  });

  await page.goto("/satisfaction-approval#approval-browser-test-token");
  await expect(page.getByRole("heading", { name: "Formulário de satisfação — Rev. 03" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Perguntas do formulário" })).toBeVisible();
  await expect(page.getByText("Como você avalia a qualidade do atendimento?")).toBeVisible();
  await expect(page.getByText("Você recomendaria nossa empresa?")).toBeVisible();
  await page.getByRole("button", { name: "Contestar" }).click();
  await page.getByLabel("Considerações").fill("Ajustar a pergunta de prazo antes da publicação.");
  await page.getByRole("button", { name: "Enviar contestação" }).click();
  await expect(page.getByRole("heading", { name: "Contestação enviada" })).toBeVisible();
  await expect(page.getByText("Suas considerações foram encaminhadas ao responsável pelo formulário.")).toBeVisible();
});
