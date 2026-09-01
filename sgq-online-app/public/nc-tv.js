const STORAGE_KEY = "qualitypro-cloud-state-v1";
const params = new URLSearchParams(location.search);
let selectedYear = params.get("ano") || "todos";
let selectedDimension = params.get("dim") || "processo";
let currentState = null;
let companyName = "Empresa";

const colors = ["#46d9f5", "#4fa3ff", "#34d399", "#fbbf24", "#f87171", "#fb923c", "#a78bfa"];
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function today() {
  return new Date().toISOString().slice(0, 10);
}

function actionStatus(action) {
  if (action?.status === "Concluída") return "Concluída";
  return action?.prazo && action.prazo < today() ? "Atrasada" : "Pendente";
}

function grouped(rows, getter) {
  return rows.reduce((result, row) => {
    const key = getter(row) || "Não informado";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function lastMonths() {
  const result = [];
  const now = new Date();
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    result.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
}

function aggregate(state) {
  const allRows = Array.isArray(state?.ncs) ? state.ncs : [];
  const rows = selectedYear === "todos" ? allRows : allRows.filter((row) => String(row.dataOrigem || "").startsWith(selectedYear));
  const actions = rows.flatMap((row) => Array.isArray(row.acoes) ? row.acoes : []);
  const closed = rows.filter((row) => row.status === "Encerrado").length;
  const months = lastMonths();
  const openedByMonth = Object.fromEntries(months.map((month) => [month, 0]));
  const closedByMonth = Object.fromEntries(months.map((month) => [month, 0]));
  rows.forEach((row) => {
    const openedMonth = String(row.dataOrigem || "").slice(0, 7);
    const closedMonth = String(row.encerradoEm || "").slice(0, 7);
    if (openedMonth in openedByMonth) openedByMonth[openedMonth] += 1;
    if (closedMonth in closedByMonth) closedByMonth[closedMonth] += 1;
  });
  const dimensions = {
    processo: grouped(rows, (row) => row.processo),
    setor: grouped(rows, (row) => row.setor),
    origem: grouped(rows, (row) => row.origem),
    gravidade: grouped(rows, (row) => row.gravidade),
    referencia: grouped(rows, (row) => row.origemRef || (row.origem === "Interno" ? "Interno" : "Não informado")),
  };
  return {
    rows,
    total: rows.length,
    open: rows.length - closed,
    closed,
    major: rows.filter((row) => row.gravidade === "Maior").length,
    repeat: rows.filter((row) => row.reincidente).length,
    closeRate: rows.length ? Math.round((closed / rows.length) * 100) : 0,
    dimensions,
    status: grouped(rows, (row) => row.status),
    severity: grouped(rows, (row) => row.gravidade),
    origin: grouped(rows, (row) => row.origem),
    recurrence: { Reincidentes: rows.filter((row) => row.reincidente).length, "Não reincidentes": rows.filter((row) => !row.reincidente).length },
    actionSummary: {
      Concluídas: actions.filter((action) => actionStatus(action) === "Concluída").length,
      Pendentes: actions.filter((action) => actionStatus(action) === "Pendente").length,
      Atrasadas: actions.filter((action) => actionStatus(action) === "Atrasada").length,
    },
    sectors: dimensions.setor,
    months,
    openedByMonth,
    closedByMonth,
  };
}

function entries(object, preferredOrder = []) {
  const source = object || {};
  const order = [...preferredOrder, ...Object.keys(source).filter((key) => !preferredOrder.includes(key))];
  return order.map((key) => [key, Number(source[key] || 0)]).filter(([, value]) => value > 0);
}

const tvCharts = {};

const centerTextPlugin = {
  id: "centerText",
  afterDraw(chart, _args, options) {
    if (!options?.display || chart.config.type !== "doughnut") return;
    const { ctx, chartArea } = chart;
    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f5f7fa";
    ctx.font = "800 21px 'JetBrains Mono'";
    ctx.fillText(String(options.value ?? 0), x, y - 5);
    ctx.fillStyle = "#8b98ab";
    ctx.font = "700 8px 'Plus Jakarta Sans'";
    ctx.fillText("TOTAL", x, y + 13);
    ctx.restore();
  },
};

Chart.register(ChartDataLabels, centerTextPlugin);
Chart.defaults.color = "#9babc0";
Chart.defaults.borderColor = "rgba(255,255,255,.07)";
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

function chartCanvas(id) {
  const host = $(`#${id}`);
  if (tvCharts[id]) tvCharts[id].destroy();
  host.innerHTML = "<canvas></canvas>";
  return host.querySelector("canvas");
}

function chartBaseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650, easing: "easeOutQuart" },
    layout: { padding: { top: 8, right: 8, bottom: 2, left: 4 } },
    plugins: {
      tooltip: { backgroundColor: "#16253b", titleColor: "#f5f7fa", bodyColor: "#c7d2e0", borderColor: "rgba(255,255,255,.12)", borderWidth: 1, padding: 10 },
      datalabels: { display: false },
    },
  };
}

function createChart(id, config) {
  tvCharts[id] = new Chart(chartCanvas(id), config);
}

function doughnutChart(id, data, palette) {
  const labels = data.length ? data.map(([label]) => label) : ["Sem registros"];
  const values = data.length ? data.map(([, value]) => value) : [1];
  const total = data.reduce((sum, [, value]) => sum + value, 0);
  const options = chartBaseOptions();
  options.cutout = "68%";
  options.rotation = -90;
  options.circumference = 360;
  options.radius = "82%";
  options.plugins.legend = { position: "bottom", labels: { boxWidth: 9, boxHeight: 9, usePointStyle: true, pointStyle: "circle", padding: 10, font: { size: 9, weight: "600" } } };
  options.plugins.centerText = { display: true, value: total };
  options.plugins.datalabels = { display: (context) => total > 0 && context.dataset.data[context.dataIndex] > 0, color: "#f5f7fa", font: { size: 10, weight: "800" }, formatter: (value) => value };
  createChart(id, { type: "doughnut", data: { labels, datasets: [{ data: values, backgroundColor: data.length ? palette : ["rgba(255,255,255,.08)"], borderColor: "#0b1526", borderWidth: 2, spacing: 0, hoverOffset: 4 }] }, options });
}

function horizontalBarChart(id, data, palette = colors) {
  const options = chartBaseOptions();
  options.indexAxis = "y";
  options.plugins.legend = { display: false };
  options.plugins.datalabels = { display: (context) => context.dataset.data[context.dataIndex] > 0, anchor: "end", align: "right", color: "#f5f7fa", font: { size: 10, weight: "800" } };
  options.scales = {
    x: { beginAtZero: true, grace: "18%", ticks: { precision: 0, font: { size: 9 } }, grid: { color: "rgba(255,255,255,.05)" } },
    y: { ticks: { color: "#c7d2e0", font: { size: 10, weight: "600" } }, grid: { display: false } },
  };
  createChart(id, { type: "bar", data: { labels: data.map(([label]) => label), datasets: [{ data: data.map(([, value]) => value), backgroundColor: data.map((_, index) => palette[index % palette.length]), borderRadius: 5, borderSkipped: false, maxBarThickness: 28, barPercentage: .62, categoryPercentage: .72 }] }, options });
}

function paretoChart(id, data) {
  const shown = data.slice(0, 10);
  const total = shown.reduce((sum, [, value]) => sum + value, 0) || 1;
  let cumulative = 0;
  const percentages = shown.map(([, value]) => Math.round(((cumulative += value) / total) * 100));
  const options = chartBaseOptions();
  options.plugins.legend = { position: "top", align: "end", labels: { boxWidth: 10, usePointStyle: true, padding: 14, font: { size: 10 } } };
  options.plugins.datalabels = { display: (context) => context.dataset.type === "bar", anchor: "end", align: "top", color: "#f5f7fa", font: { size: 10, weight: "800" } };
  options.scales = {
    x: { grid: { display: false }, ticks: { color: "#c7d2e0", font: { size: 10 }, maxRotation: 0, callback(value) { const label = this.getLabelForValue(value); return label.length > 16 ? `${label.slice(0, 15)}…` : label; } } },
    y: { beginAtZero: true, grace: "15%", ticks: { precision: 0 }, grid: { color: "rgba(255,255,255,.05)" }, title: { display: true, text: "Ocorrências", color: "#8b98ab", font: { size: 9 } } },
    percentage: { position: "right", beginAtZero: true, min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { callback: (value) => `${value}%`, font: { size: 9 } }, title: { display: true, text: "Acumulado", color: "#8b98ab", font: { size: 9 } } },
  };
  createChart(id, { data: { labels: shown.map(([label]) => label), datasets: [{ type: "bar", label: "Ocorrências", data: shown.map(([, value]) => value), backgroundColor: "rgba(70,217,245,.74)", borderColor: "#46d9f5", borderWidth: 1, borderRadius: 5, borderSkipped: false, barPercentage: .62 }, { type: "line", label: "% acumulado", data: percentages, yAxisID: "percentage", borderColor: "#fbbf24", backgroundColor: "#fbbf24", pointRadius: 3, pointHoverRadius: 5, tension: .28, borderWidth: 2.5, datalabels: { display: false } }] }, options });
}

function evolutionChart(id, agg) {
  const options = chartBaseOptions();
  options.plugins.legend = { position: "top", align: "start", labels: { boxWidth: 9, usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 9 } } };
  options.scales = { x: { grid: { display: false }, ticks: { font: { size: 8 }, callback(value, index) { const month = agg.months[index]; return index % 2 ? "" : `${month.slice(5)}/${month.slice(2, 4)}`; } } }, y: { beginAtZero: true, ticks: { precision: 0, font: { size: 9 } }, grid: { color: "rgba(255,255,255,.05)" } } };
  createChart(id, { type: "line", data: { labels: agg.months, datasets: [{ label: "Aberturas", data: agg.months.map((month) => agg.openedByMonth[month]), borderColor: "#f87171", backgroundColor: "rgba(248,113,113,.13)", fill: true, tension: .35, pointRadius: 2.5, pointHoverRadius: 5, borderWidth: 2.5 }, { label: "Encerramentos", data: agg.months.map((month) => agg.closedByMonth[month]), borderColor: "#34d399", backgroundColor: "rgba(52,211,153,.1)", fill: true, tension: .35, pointRadius: 2.5, pointHoverRadius: 5, borderWidth: 2.5 }] }, options });
}

function radarChart(id, data) {
  const shown = data.slice(0, 8);
  if (shown.length < 3) {
    horizontalBarChart(id, shown, ["#a78bfa", "#4fa3ff", "#46d9f5"]);
    return;
  }
  const options = chartBaseOptions();
  options.plugins.legend = { display: false };
  options.scales = { r: { beginAtZero: true, ticks: { display: false, precision: 0 }, grid: { color: "rgba(255,255,255,.08)" }, angleLines: { color: "rgba(255,255,255,.08)" }, pointLabels: { color: "#c7d2e0", font: { size: 9, weight: "600" } } } };
  createChart(id, { type: "radar", data: { labels: shown.map(([label]) => label), datasets: [{ data: shown.map(([, value]) => value), borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,.18)", pointBackgroundColor: "#a78bfa", pointBorderColor: "#f5f7fa", pointRadius: 3, borderWidth: 2 }] }, options });
}

function buildCharts(agg) {
  paretoChart("chartPareto", entries(agg.dimensions[selectedDimension]).sort((a, b) => b[1] - a[1]));
  doughnutChart("chartStatus", entries(agg.status, ["Aguardando análise", "Ações em andamento", "Aguardando eficácia", "Encerrado"]), ["#f87171", "#fbbf24", "#46d9f5", "#34d399"]);
  doughnutChart("chartSeverity", entries(agg.severity, ["Menor", "Média", "Maior"]), ["#34d399", "#fbbf24", "#f87171"]);
  horizontalBarChart("chartOrigin", entries(agg.origin, ["Interno", "Fornecedor", "Cliente"]), ["#4fa3ff", "#a78bfa", "#46d9f5"]);
  doughnutChart("chartRepeat", entries(agg.recurrence, ["Reincidentes", "Não reincidentes"]), ["#a78bfa", "#34d399"]);
  evolutionChart("chartEvolution", agg);
  horizontalBarChart("chartActions", entries(agg.actionSummary, ["Concluídas", "Pendentes", "Atrasadas"]), ["#34d399", "#fbbf24", "#f87171"]);
  radarChart("chartSector", entries(agg.sectors).sort((a, b) => b[1] - a[1]));
}

function kpiHtml(label, value, caption, color, icon) {
  const paths = {
    alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    repeat: '<path d="M20 7h-5V2M4 17h5v5"/><path d="M18 5a8 8 0 0 0-13 3M6 19a8 8 0 0 0 13-3"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  };
  return `<article class="tv-kpi" style="--kpi:${color}"><svg viewBox="0 0 24 24">${paths[icon] || paths.alert}</svg><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(caption)}</span></article>`;
}

function renderDashboard() {
  const agg = aggregate(currentState || {});
  $("#tvSubtitle").textContent = `${companyName} · gestão à vista · ${selectedYear === "todos" ? "todos os anos" : selectedYear}`;
  $("#tvKpis").innerHTML = [
    kpiHtml("Total de RNCs", agg.total, `${agg.open} em aberto · ${agg.closed} encerrados`, "#f87171", "alert"),
    kpiHtml("Em aberto", agg.open, "em tratamento", "#fbbf24", "clock"),
    kpiHtml("Gravidade maior", agg.major, "maior severidade", "#fb923c", "alert"),
    kpiHtml("Reincidentes", agg.repeat, "atenção especial", "#a78bfa", "repeat"),
    kpiHtml("Taxa de encerramento", `${agg.closeRate}%`, "eficácia comprovada", "#34d399", "check"),
  ].join("");
  buildCharts(agg);
  $("#tvLastUpdate").textContent = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function updateYears() {
  const years = [...new Set((currentState?.ncs || []).map((row) => String(row.dataOrigem || "").slice(0, 4)).filter(Boolean))].sort().reverse();
  $("#tvYear").innerHTML = `<option value="todos">Todos</option>${years.map((year) => `<option value="${year}">${year}</option>`).join("")}`;
  $("#tvYear").value = years.includes(selectedYear) ? selectedYear : "todos";
  selectedYear = $("#tvYear").value;
}

async function refreshFromServer() {
  try {
    const response = await fetch("/api/bootstrap", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (response.status === 401) {
      $("#tvMessage").hidden = false;
      $("#tvMessage").innerHTML = 'Sessão encerrada.<br><a href="/login" style="color:#46d9f5">Entrar novamente</a>';
      return;
    }
    if (!response.ok) throw new Error("Falha ao consultar dados");
    const payload = await response.json();
    if (!Array.isArray(payload.state?.ncs)) throw new Error("Sem acesso ao módulo de Não Conformidades");
    currentState = payload.state;
    companyName = payload.company?.name || payload.state?.company?.name || "Empresa";
    updateYears();
    renderDashboard();
    $("#tvMessage").hidden = true;
  } catch (error) {
    $("#tvMessage").hidden = false;
    $("#tvMessage").textContent = `${error.message}. Tentando novamente automaticamente...`;
  }
}

function updateClock() {
  const now = new Date();
  $("#tvTime").textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  $("#tvDate").textContent = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

$("#tvYear").addEventListener("change", (event) => { selectedYear = event.target.value; renderDashboard(); });
$("#tvDimension").value = ["processo", "setor", "origem", "gravidade", "referencia"].includes(selectedDimension) ? selectedDimension : "processo";
$("#tvDimension").addEventListener("change", (event) => { selectedDimension = event.target.value; renderDashboard(); });
$("#tvFullscreen").addEventListener("click", () => document.documentElement.requestFullscreen?.());
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  try {
    currentState = JSON.parse(event.newValue);
    companyName = currentState?.company?.name || companyName;
    updateYears();
    renderDashboard();
  } catch {}
});

updateClock();
refreshFromServer();
setInterval(updateClock, 1000);
setInterval(refreshFromServer, 60_000);
