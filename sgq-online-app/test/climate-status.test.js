const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({
  document: { createElement: () => ({}), head: { append() {} } },
  escapeHtml: (value) => String(value),
  structuredClone,
  moduleIcon: () => "",
  formatDate: () => "",
  peopleOptions: (selected = "") => ["Hugo Melo", "Marina Souza"].map((name) => `<option ${name === selected ? "selected" : ""}>${name}</option>`).join(""),
  canEditModule: () => true,
});
vm.runInContext(fs.readFileSync(path.join(__dirname, "../public/climate-module.js"), "utf8"), context);

test("climate table preserves every editable status even with an overdue deadline", () => {
  for (const [status, className] of [["Não iniciada", "s-pend"], ["Em andamento", "s-prog"], ["Monitorando", "s-info"], ["Concluída", "s-done"]]) {
    for (const due of ["2000-01-01", "2999-01-01", ""]) {
      const html = context.climateStatus({ status, due });
      assert.ok(html.includes(`status-pill ${className}`));
      assert.ok(html.endsWith(`${status}</span>`));
      assert.ok(!html.includes("Atrasada"));
    }
  }
});

test("overdue counting remains independent of the selected status", () => {
  for (const status of ["Não iniciada", "Em andamento", "Monitorando"]) {
    assert.equal(context.climateIsLate({ relevant: "Sim", status, due: "2000-01-01" }), true);
    assert.equal(context.climateIsLate({ relevant: "Parcial", status, due: "2999-01-01" }), false);
  }
  assert.equal(context.climateIsLate({ relevant: "Sim", status: "Concluída", due: "2000-01-01" }), false);
  assert.equal(context.climateIsLate({ relevant: "Não", status: "Em andamento", due: "2000-01-01" }), false);
});

test("missing data stays empty instead of resurrecting demo records", () => {
  for (const climate of [undefined, {}, { issues: [], determination: {} }]) {
    context.state = { climate };
    const data = context.climateData();
    assert.equal(data.issues.length, 0);
    assert.ok(Object.values(data.determination).every((value) => value === ""));
  }
});

test("question availability requires both answers and at least one yes", () => {
  for (const relevant of ["", "Sim", "Não"]) {
    for (const stakeholderRequirement of ["", "Sim", "Não"]) {
      context.state = { climate: { determination: { relevant, stakeholderRequirement } } };
      assert.equal(context.climateCanAssessIssues(), Boolean(relevant && stakeholderRequirement && (relevant === "Sim" || stakeholderRequirement === "Sim")));
      const html = context.climateDeterminationHtml();
      assert.equal(html.includes('id="climateStakeholderDetailField" hidden'), stakeholderRequirement !== "Sim");
    }
  }
});

test("issue ids remain unique after deletions and use a monotonic counter", () => {
  const data = { issues: [{ id: "CLI-0001" }, { id: "CLI-0003" }] };
  assert.equal(context.climateNextIssueId(data), "CLI-0004");
  data.issues = [];
  assert.equal(context.climateNextIssueId(data), "CLI-0005");
});

test("responsible options use company users and preserve previous assignees", () => {
  context.state = { users: [{ name: "Pessoa da empresa" }] };
  const html = context.climatePeopleOptions("Responsável anterior");
  assert.match(html, /Pessoa da empresa/);
  assert.match(html, /value="Responsável anterior" selected/);
  assert.doesNotMatch(html, /Hugo Melo|Marina Souza/);
});

test("missing status defaults to the same value as the editing dialog", () => {
  assert.ok(context.climateStatus({ due: "2000-01-01" }).endsWith("Não iniciada</span>"));
});

test("empty determination fields render with explicit blank selections", () => {
  context.state = {
    climate: {
      determination: {
        relevant: "",
        justification: "",
        stakeholderRequirement: "",
        stakeholderDetail: "",
        status: "",
        owner: "",
        reviewedAt: "",
        nextReview: "",
      },
      issues: [],
    },
  };

  const html = context.climateDeterminationHtml();

  for (const id of ["climateRelevant", "climateStakeholder", "climateStatus", "climateOwner"]) {
    const select = html.match(new RegExp(`<select[^>]*id="${id}"[^>]*>([\\s\\S]*?)</select>`))?.[1];
    assert.ok(select, `expected ${id} select`);
    assert.match(select, /<option value="" selected>Selecione/);
    assert.doesNotMatch(select.slice(select.indexOf("</option>") + 9), / selected/);
  }
});
