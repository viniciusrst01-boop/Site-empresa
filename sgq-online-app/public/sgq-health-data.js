(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SGQHealthData = api;
})(globalThis, function () {
const HEALTH_SOURCES = ["state", "context", "risk"];
const HEALTH_PREFIX = "sgqHealth:";
const PERIODS = [1, 3, 6, 12];
const closedStatuses = new Set(["Aprovado", "Atingido", "Concluído", "Concluída", "Fechado", "Fechada", "Resolvido", "Resolvida", "Encerrado", "Encerrada"]);
const rows = (value) => Array.isArray(value) ? value : [];
const openCount = (items) => rows(items).filter((item) => !closedStatuses.has(item.status)).length;

function healthMonth(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(new Date(date));
  return `${parts.find((part) => part.type === "year").value}-${parts.find((part) => part.type === "month").value}`;
}

function healthDay(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(date));
  return `${parts.find((part) => part.type === "year").value}-${parts.find((part) => part.type === "month").value}-${parts.find((part) => part.type === "day").value}`;
}

function healthObservation(source, value, now = new Date()) {
  if (!HEALTH_SOURCES.includes(source) || value === undefined || typeof value !== "object") return null;
  value = value || {};
  const counts = source === "state" ? {
    nonConformities: openCount(value.ncs),
    audits: openCount(value.audits),
    documents: rows(value.documents).filter((item) => item.status !== "Aprovado").length,
  } : source === "context" ? {
    contextActions: rows(value.swot).filter((item) => item.planoNecessario === "Sim" && item.status !== "Concluído").length,
  } : {
    riskActions: openCount(value.riscos) + rows(value.objetivos).filter((item) => item.status !== "Atingido").length + openCount(value.mudancas),
  };
  return { key: `${HEALTH_PREFIX}${source}:${healthDay(now)}`, value: { source, recordedAt: new Date(now).toISOString(), ...counts } };
}

// Missing observations remain null. The latest saved state carries forward only after its first observation.
function getSGQHealthHistory(dataRows, { months = 6, canView = () => true, now = new Date() } = {}) {
  if (!PERIODS.includes(months)) throw new Error("invalid_health_period");
  const endMonth = healthMonth(now);
  const [year, month] = endMonth.split("-").map(Number);
  const observations = Object.fromEntries(HEALTH_SOURCES.map((source) => [source, []]));
  const currentValues = {};
  for (const row of dataRows) {
    if (HEALTH_SOURCES.includes(row.key)) {
      currentValues[row.key] = row.value;
    } else if (row.key.startsWith(HEALTH_PREFIX) && observations[row.value?.source]) {
      observations[row.value.source].push(row.value);
    }
  }
  for (const source of HEALTH_SOURCES) observations[source].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
  const metricSource = { nonConformities: ["state", "nao-conformidades"], audits: ["state", "auditorias"], documents: ["state", "documentos"], contextActions: ["context", "contexto"], riskActions: ["risk", "riscos"] };
  const atKey = (key, current = false, day = false) => {
    const values = {};
    for (const [metric, [source, module]] of Object.entries(metricSource)) {
      if (!canView(module)) { values[metric] = null; continue; }
      const observation = current
        ? healthObservation(source, currentValues[source], now)?.value
        : observations[source].filter((item) => (day ? healthDay(item.recordedAt) : healthMonth(item.recordedAt)) <= key).at(-1);
      values[metric] = observation?.[metric] ?? (current || (!Object.hasOwn(currentValues, source) && !observations[source].length) ? 0 : null);
    }
    const allowed = Object.keys(metricSource).filter((metric) => canView(metricSource[metric][1]));
    const actions = !allowed.length || allowed.some((metric) => values[metric] === null) ? null : allowed.reduce((total, metric) => total + values[metric], 0);
    return { nonConformities: values.nonConformities, actions, audits: values.audits, documents: values.documents };
  };
  const current = atKey(endMonth, true);
  if (months === 1) {
    const currentDay = healthDay(now);
    const [dayYear, dayMonth, dayNumber] = currentDay.split("-").map(Number);
    const points = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(Date.UTC(dayYear, dayMonth - 1, dayNumber - 29 + index));
      const key = date.toISOString().slice(0, 10);
      return { month: key, dayLabel: key.slice(8, 10), ...atKey(key, key === currentDay, true) };
    });
    return { months, granularity: "day", current, points, hasData: Object.entries(metricSource).some(([, [source, module]]) => canView(module) && (Boolean(currentValues[source]) || observations[source].length > 0)) };
  }
  const points = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(year, month - months + index, 15));
    const key = date.toISOString().slice(0, 7);
    return { month: key, ...atKey(key, key === endMonth) };
  });
  return { months, granularity: "month", current, points, hasData: Object.entries(metricSource).some(([, [source, module]]) => canView(module) && (Boolean(currentValues[source]) || observations[source].length > 0)) };
}

return { HEALTH_SOURCES, HEALTH_PREFIX, healthObservation, getSGQHealthHistory };
});
