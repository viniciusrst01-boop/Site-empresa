(() => {
  const pluginId = "qualityproDoughnutCenter";
  const paletteShades = {
    "#f87171": ["#ffa399", "#ff6670"], "#F87171": ["#ffa399", "#ff6670"],
    "#fbbf24": ["#ffe866", "#ffcb0a"], "#FBBF24": ["#ffe866", "#ffcb0a"],
    "#46d9f5": ["#7bebff", "#00bde0"], "#46D9F5": ["#7bebff", "#00bde0"],
    "#34d399": ["#53e6b2", "#00bf8c"], "#34D399": ["#53e6b2", "#00bf8c"],
  };

  function addStyles() {
    if (document.getElementById("qualitypro-doughnut-layout")) return;
    const style = document.createElement("style");
    style.id = "qualitypro-doughnut-layout";
    style.textContent = `.qualitypro-doughnut-body{display:grid;grid-template-columns:minmax(96px,.95fr) minmax(130px,1.05fr);align-items:center;gap:12px;min-width:0;min-height:0;height:100%}.qualitypro-doughnut-plot{position:relative;align-self:stretch;min-width:0;min-height:0}.qualitypro-doughnut-plot>canvas{display:block!important;width:100%!important;height:100%!important}.qualitypro-doughnut-legend{margin:0;padding:0;list-style:none;min-width:0}.qualitypro-doughnut-legend li+li{border-top:1px solid var(--border-subtle,rgba(255,255,255,.1))}.qualitypro-doughnut-legend button{display:grid;grid-template-columns:10px minmax(0,1fr) auto;align-items:center;gap:6px;width:100%;min-height:26px;padding:5px 0;border:0;background:transparent;color:var(--text-primary,#f5f7fa);font:inherit;font-size:10px;text-align:left;cursor:pointer}.qualitypro-doughnut-legend button:hover,.qualitypro-doughnut-legend button:focus-visible{color:var(--accent-cyan,#46d9f5);outline:none}.qualitypro-doughnut-legend button[aria-pressed=\"false\"]{opacity:.48}.qualitypro-doughnut-legend button[aria-pressed=\"false\"] .qualitypro-doughnut-label{text-decoration:line-through}.qualitypro-doughnut-dot{width:10px;height:10px;border-radius:50%;background:linear-gradient(145deg,color-mix(in srgb,var(--doughnut-color) 68%,#fff),var(--doughnut-color));box-shadow:0 0 0 1px color-mix(in srgb,var(--doughnut-color) 42%,transparent)}.qualitypro-doughnut-label{min-width:0;overflow-wrap:anywhere;line-height:1.32}.qualitypro-doughnut-legend strong{font-size:11px;font-variant-numeric:tabular-nums}@container (max-width:360px){.qualitypro-doughnut-body{grid-template-columns:minmax(90px,.92fr) minmax(112px,1.08fr);gap:8px}.qualitypro-doughnut-legend button{font-size:9px;gap:5px}.qualitypro-doughnut-legend strong{font-size:10px}}`;
    document.head.append(style);
  }

  const centerPlugin = {
    id: pluginId,
    beforeDraw(chart, _args, options) {
      if (!options?.display || chart.config.type !== "doughnut") return;
      const arc = chart.getDatasetMeta(0).data[0];
      if (!arc?.outerRadius) return;
      const { ctx } = chart;
      const discRadius = arc.innerRadius * .9;
      ctx.save();
      ctx.beginPath();
      ctx.arc(arc.x, arc.y, arc.outerRadius * 1.08, 0, Math.PI * 2);
      ctx.fillStyle = options.surface;
      ctx.fill();
      ctx.strokeStyle = options.border;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(arc.x, arc.y, discRadius, 0, Math.PI * 2);
      const fill = ctx.createRadialGradient(arc.x, arc.y - discRadius * .25, 0, arc.x, arc.y, discRadius);
      fill.addColorStop(0, options.panel);
      fill.addColorStop(.7, options.panel);
      fill.addColorStop(1, options.surface);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = options.accent;
      ctx.globalAlpha = .45;
      ctx.lineWidth = .75;
      ctx.stroke();
      ctx.restore();
    },
    afterDraw(chart, _args, options) {
      if (!options?.display || chart.config.type !== "doughnut") return;
      const arc = chart.getDatasetMeta(0).data[0];
      if (!arc?.innerRadius) return;
      const { ctx, chartArea } = chart;
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;
      const discRadius = arc.innerRadius * .9;
      const value = String(options.value ?? 0);
      let size = Math.min(48, discRadius * .68);
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = options.text;
      ctx.font = `800 ${size}px 'Plus Jakarta Sans'`;
      if (ctx.measureText(value).width > discRadius * 1.55) {
        size *= discRadius * 1.55 / ctx.measureText(value).width;
        ctx.font = `800 ${size}px 'Plus Jakarta Sans'`;
      }
      ctx.fillText(value, x, y - discRadius * .15);
      ctx.fillStyle = options.muted;
      ctx.font = `700 ${Math.max(7, Math.min(14, discRadius * .26))}px 'Plus Jakarta Sans'`;
      ctx.fillText("TOTAL", x, y + discRadius * .45);
      ctx.restore();
    },
  };

  function tokens() {
    const css = getComputedStyle(document.body);
    const get = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    return { text: get("--text-primary", "#f5f7fa"), muted: get("--text-secondary", "#8b98ab"), panel: get("--bg-panel", "#0b1526"), surface: get("--bg-deep", "#06101f"), border: get("--border-subtle", "rgba(255,255,255,.1)"), accent: get("--accent-blue-bright", "#4fa3ff") };
  }

  function gradient(colors) {
    return (context) => {
      const color = colors[context.dataIndex % colors.length];
      const area = context.chart.chartArea;
      if (!area) return color;
      const [top, bottom] = paletteShades[color] || [color, color];
      const fill = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
      fill.addColorStop(0, top);
      fill.addColorStop(1, bottom);
      return fill;
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }

  function layoutFor(canvas) {
    const existing = canvas.closest(".qualitypro-doughnut-body");
    if (existing) return existing;
    const host = canvas.parentElement;
    let body = host.querySelector(":scope > .qualitypro-doughnut-body");
    if (body) return body;
    body = document.createElement("div");
    body.className = "qualitypro-doughnut-body";
    const plot = document.createElement("div");
    plot.className = "qualitypro-doughnut-plot";
    host.insertBefore(body, canvas);
    body.append(plot);
    plot.append(canvas);
    return body;
  }

  function decorate(canvas, { labels, values, colors }) {
    addStyles();
    if (window.Chart && !Chart.registry.plugins.get(pluginId)) Chart.register(centerPlugin);
    const body = layoutFor(canvas);
    let legend = body.querySelector(".qualitypro-doughnut-legend");
    if (!legend) {
      legend = document.createElement("ul");
      legend.className = "qualitypro-doughnut-legend";
      body.append(legend);
    }
    const total = values.reduce((sum, value) => sum + (Number(value) || 0), 0);
    legend.innerHTML = labels.map((label, index) => `<li><button type="button" data-slice="${index}" aria-pressed="true" title="Mostrar ou ocultar ${escapeHtml(label)}"><i class="qualitypro-doughnut-dot" style="--doughnut-color:${colors[index % colors.length]}" aria-hidden="true"></i><span class="qualitypro-doughnut-label">${escapeHtml(label)}</span><strong>${Number(values[index]) || 0}</strong></button></li>`).join("");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${total} no total. ${labels.map((label, index) => `${label}: ${Number(values[index]) || 0}`).join("; ")}.`);
    return {
      total,
      colors,
      dataset: { backgroundColor: gradient(colors), borderColor: tokens().panel, borderWidth: 1, borderRadius: 3, spacing: 0, hoverOffset: 3 },
      options: { cutout: "64%", radius: "100%", layout: { padding: 4 }, plugins: { legend: { display: false }, qualityproDoughnutCenter: { display: true, value: total, ...tokens() }, datalabels: { display: (context) => total > 0 && Number(context.dataset.data[context.dataIndex]) > 0 ? "auto" : false, color: "#f5f7fa", font: (context) => ({ size: Math.max(10, Math.min(16, Math.min(context.chart.width, context.chart.height) * .085)), weight: "800" }), textShadowBlur: 3, textShadowColor: "rgba(0,0,0,.3)" } } },
      bind(chart) {
        legend.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
          const index = Number(button.dataset.slice);
          chart.toggleDataVisibility(index);
          button.setAttribute("aria-pressed", String(chart.getDataVisibility(index)));
          chart.update();
        }));
      },
    };
  }

  window.QualityProDoughnut = { decorate };
})();
