const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({
  document: { createElement: () => ({}), head: { append() {} } },
  escapeHtml: (value) => String(value),
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
    assert.equal(context.climateIsLate({ status, due: "2000-01-01" }), true);
    assert.equal(context.climateIsLate({ status, due: "2999-01-01" }), false);
  }
  assert.equal(context.climateIsLate({ status: "Concluída", due: "2000-01-01" }), false);
});

test("missing status defaults to the same value as the editing dialog", () => {
  assert.ok(context.climateStatus({ due: "2000-01-01" }).endsWith("Não iniciada</span>"));
});
