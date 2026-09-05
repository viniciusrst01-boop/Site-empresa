const assert = require("node:assert/strict");
const test = require("node:test");
const { healthObservation, getSGQHealthHistory } = require("../sgq-health");

const now = new Date("2026-09-05T12:00:00Z");
const state = {
  ncs: [{ status: "Aberta" }, { status: "Fechada" }],
  audits: [{ status: "Planejada" }, { status: "Concluída" }],
  documents: [{ status: "Em revisão" }, { status: "Aprovado" }],
};
const currentRows = [
  { key: "state", value: state, updatedAt: now },
  { key: "context", value: { swot: [{ planoNecessario: "Sim", status: "Em andamento" }, { planoNecessario: "Não" }] }, updatedAt: now },
  { key: "risk", value: { riscos: [{ status: "Aberto" }], objetivos: [{ status: "Atingido" }], mudancas: [{ status: "Em andamento" }] }, updatedAt: now },
];

test("health counts use saved status values and the dashboard's aggregate", () => {
  const result = getSGQHealthHistory(currentRows, { now });
  assert.deepEqual(result.current, { nonConformities: 1, actions: 6, audits: 1, documents: 1 });
  assert.equal(result.hasData, true);
  assert.equal(result.points.length, 6);
  assert.deepEqual(result.points[0], { month: "2026-04", nonConformities: null, actions: null, audits: null, documents: null });
  assert.deepEqual(result.points.at(-1), { month: "2026-09", ...result.current });
});

test("history carries actual observations forward without backfilling unknown months", () => {
  const saved = [
    healthObservation("state", { ncs: [{ status: "Aberta" }, { status: "Aberta" }] }, "2026-07-10T12:00:00Z"),
    healthObservation("context", {}, "2026-07-10T12:00:00Z"),
    healthObservation("risk", {}, "2026-07-10T12:00:00Z"),
  ];
  const result = getSGQHealthHistory([...currentRows, ...saved], { now });
  assert.equal(result.points[2].nonConformities, null);
  assert.equal(result.points[3].nonConformities, 2);
  assert.equal(result.points[4].actions, 2);
  assert.equal(result.points[5].actions, 6);
});

test("periods cross the year correctly and respect the Sao Paulo month boundary", () => {
  for (const months of [1, 3, 6, 12]) {
    const result = getSGQHealthHistory([], { months, now: new Date("2026-01-01T01:00:00Z") });
    assert.equal(result.points.length, months);
    assert.equal(result.points.at(-1).month, "2025-12");
  }
  assert.throws(() => getSGQHealthHistory([], { months: 2 }), /invalid_health_period/);
  assert.equal(healthObservation("leadership", {}, now), null);
});

test("restricted modules are never included in counts or history", () => {
  const result = getSGQHealthHistory(currentRows, { now, canView: (module) => module === "documentos" });
  assert.deepEqual(result.current, { nonConformities: null, actions: 1, audits: null, documents: 1 });
  assert.ok(result.points.every((point) => point.nonConformities === null && point.audits === null));
  assert.equal(getSGQHealthHistory(currentRows, { now, canView: () => false }).hasData, false);
});

test("a new company has an empty state and real zero counts", () => {
  const result = getSGQHealthHistory([], { now });
  assert.equal(result.hasData, false);
  assert.deepEqual(result.current, { nonConformities: 0, actions: 0, audits: 0, documents: 0 });
});

test("a current document's update date is not fabricated as a historical snapshot", () => {
  const result = getSGQHealthHistory([{ key: "state", value: state, updatedAt: "2026-04-01T12:00:00Z" }], { now });
  assert.equal(result.points[0].documents, null);
  assert.equal(result.current.documents, 1);
  assert.equal(healthObservation("state", null, now).value.documents, 0);
});
