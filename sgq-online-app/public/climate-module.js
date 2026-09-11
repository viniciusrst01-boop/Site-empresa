const climateStyle = document.createElement("style");
climateStyle.textContent = `.climate-page-content{overflow-y:auto}.climate-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin-bottom:28px}.climate-kpis .kpi-card{min-height:164px;padding:15px 16px 13px;border-radius:18px;box-shadow:0 14px 28px rgba(24,54,86,.08)}.climate-kpis .kpi-top{align-items:center;gap:16px}.climate-kpis .kpi-icon{width:50px;height:50px;border-radius:11px;background:color-mix(in srgb,currentColor 10%,transparent)}.climate-kpis .kpi-icon .icon{width:24px;height:24px}.climate-kpis .kpi-label{font-size:12px;letter-spacing:.6px}.climate-kpis .kpi-value.big{font-size:35px;line-height:1}.climate-notice{display:flex;gap:12px;margin-bottom:18px;padding:15px;border:1px solid rgba(52,211,153,.3);border-radius:9px;background:rgba(52,211,153,.06);color:var(--text-secondary)}.climate-determination-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}.climate-determination-grid .full{grid-column:1/-1}.climate-determination-grid textarea{min-height:92px}.climate-relevance{display:inline-flex;padding:4px 8px;border:1px solid;border-radius:7px;font-size:11px;font-weight:800}.climate-relevance.yes{color:var(--accent-green)}.climate-relevance.partial{color:var(--accent-purple)}.climate-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.climate-chart-grid .chart-card{min-height:280px;padding:18px}.climate-chart-wide{grid-column:1/-1}.climate-chart-grid canvas{width:100%!important;height:210px!important}.climate-upload{display:flex;align-items:center;gap:10px;color:var(--text-secondary)}.climate-upload input[type=file]{display:none}@media(max-width:900px){.climate-kpis,.climate-chart-grid,.climate-determination-grid{grid-template-columns:1fr}.climate-determination-grid .full,.climate-chart-wide{grid-column:auto}}`;
document.head.append(climateStyle);
const climateSeed = {
  determination: { relevant: "Sim", justification: "A organização determinou que as mudanças climáticas são uma questão externa relevante para o contexto do SGQ, pois eventos climáticos podem afetar a continuidade de fornecimento, a logística de entrega e os requisitos ambientais exigidos pelos clientes.", stakeholderRequirement: "Sim", stakeholderDetail: "Clientes e organismos certificadores têm apresentado expectativas relacionadas à responsabilidade ambiental e à resiliência climática da cadeia de fornecimento.", status: "Aprovado", owner: "Hugo Melo", reviewedAt: "2026-07-18", nextReview: "2027-07-18" },
  issues: [
    { id: "CLI-0001", description: "Mudanças climáticas", relevant: "Sim", impact: "Eventos climáticos extremos podem afetar transporte, fornecimento e produção.", action: "Mapear rotas e fornecedores alternativos; incluir clima na análise de riscos.", owner: "Hugo Melo", role: "Diretor Geral", due: "2026-09-30", status: "Em andamento", evidence: "Analise_risco_climatico.pdf" },
    { id: "CLI-0002", description: "Temperaturas extremas", relevant: "Sim", impact: "Pode afetar condições de trabalho e o desempenho de processos sensíveis.", action: "Adequar ambiente de trabalho e monitorar processos sensíveis à temperatura.", owner: "Marina Souza", role: "Coordenadora de Pessoas", due: "2026-08-20", status: "Concluída", evidence: "" },
    { id: "CLI-0003", description: "Chuvas intensas", relevant: "Sim", impact: "Pode causar interrupções logísticas e atrasos de entrega.", action: "Aplicar plano de contingência logística e comunicação proativa a clientes.", owner: "Rafael Costa", role: "Analista Financeiro", due: "2026-10-15", status: "Em andamento", evidence: "Plano_contingencia_logistica.pdf" },
  ],
};

let climateTab = "determination";
let climateCharts = {};

const climateChangeTooltips = Object.freeze({
  relevance: "Informe se as mudanças climáticas podem afetar o contexto, os processos, produtos, serviços ou a capacidade da organização de alcançar os resultados pretendidos do SGQ.",
  stakeholders: "Informe se clientes, órgãos reguladores, certificadores ou outras partes interessadas possuem requisitos ou expectativas relacionados às mudanças climáticas.",
  justification: "Descreva os motivos que sustentam a avaliação realizada, considerando possíveis impactos climáticos nas operações, fornecedores, logística, infraestrutura, requisitos legais, ambientais ou de clientes.",
  stakeholderDetail: "Registre quais requisitos, necessidades ou expectativas relacionados às mudanças climáticas foram identificados e indique, quando aplicável, a parte interessada correspondente.",
  status: "Selecione a situação atual desta avaliação, indicando a etapa em que se encontra a determinação sobre a relevância das mudanças climáticas para o SGQ.",
  owner: "Selecione o responsável por acompanhar, manter atualizada e realizar as revisões desta determinação.",
  nextReview: "Informe a data prevista para reavaliar esta determinação, considerando mudanças no contexto da organização, requisitos das partes interessadas ou novas condições climáticas relevantes.",
});

function climateRequiredHint(key) {
  const message = climateChangeTooltips[key];
  return `<span class="required-hint" tabindex="0" data-tooltip="${escapeHtml(message)}" aria-label="${escapeHtml(message)}">*</span>`;
}

function climateData() {
  state.climate = { ...structuredClone(climateSeed), ...(state.climate || {}) };
  state.climate.issues = Array.isArray(state.climate.issues) ? state.climate.issues : structuredClone(climateSeed.issues);
  state.climate.determination = { ...climateSeed.determination, ...(state.climate.determination || {}) };
  return state.climate;
}

async function climateSave(message) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (await saveRemoteData("state", state, "mudancas-climaticas")) {
    if (message) toast(message);
  } else toast("Não foi possível salvar a avaliação climática.");
}
function climateIsLate(item) { return item.status !== "Concluída" && item.due && item.due < new Date().toISOString().slice(0, 10); }
function climateStatus(item) { const text = climateIsLate(item) ? "Atrasada" : item.status; return `<span class="status-pill ${text === "Concluída" ? "s-done" : text === "Atrasada" ? "s-late" : text === "Em andamento" ? "s-prog" : text === "Monitorando" ? "s-info" : "s-pend"}"><span class="status-dot2"></span>${escapeHtml(text || "Não iniciada")}</span>`; }
function climateRelevant(value) { return `<span class="climate-relevance ${value === "Sim" ? "yes" : value === "Parcial" ? "partial" : "no"}">${escapeHtml(value)}</span>`; }
function climatePeopleOptions(selected = "") { return peopleOptions().replace(`>${escapeHtml(selected || "Hugo Melo")}<`, ` selected>${escapeHtml(selected || "Hugo Melo")}<`); }

function renderClimateModule() {
  pageContent.classList.add("climate-page-content");
  const data = climateData();
  const issues = data.issues;
  const relevant = issues.filter((item) => item.relevant === "Sim").length;
  const complete = issues.filter((item) => item.status === "Concluída").length;
  const late = issues.filter(climateIsLate).length;
  pageContent.innerHTML = `
    ${moduleHeaderHtml("mudancas-climaticas", { category: "", description: "ISO 9001:2015 · EMENDA 2024", actions: false })}
    <div class="climate-kpis">
      ${climateKpi(moduleIcon("documentos"), "Determinação", data.determination.relevant === "Sim" ? "Relevante" : "Não relevante", `${data.determination.status} · ${data.determination.owner}`, "#34D399", "check-circle")}
      ${climateKpi(moduleIcon("riscos"), "Questões avaliadas", issues.length, `${relevant} relevante(s) · ${issues.filter((item) => item.relevant === "Parcial").length} parcial(is)`, "#4fa3ff", "bar-chart")}
      ${climateKpi(moduleIcon("check-circle"), "Questões tratadas", `${complete}/${issues.length}`, `${issues.length ? Math.round((complete / issues.length) * 100) : 0}% concluídas`, "#FBBF24", "documentos")}
      ${climateKpi(moduleIcon("nao-conformidades"), "Questões atrasadas", late, late ? "Prazo vencido" : "Nenhum prazo vencido", "#F87171", "calendar-clock")}
    </div>
    <div class="ctx-tabs climate-tabs">
      <button type="button" class="ctx-tab${climateTab === "determination" ? " active" : ""}" data-climate-tab="determination">Determinação da empresa</button>
      <button type="button" class="ctx-tab${climateTab === "issues" ? " active" : ""}" data-climate-tab="issues">Questões climáticas</button>
      <button type="button" class="ctx-tab${climateTab === "indicators" ? " active" : ""}" data-climate-tab="indicators">Indicadores</button>
      <div class="module-tabs-actions">${moduleHistoryControlsHtml("mudancas-climaticas")}</div>
    </div>
    <div id="climateTabContent"></div>
    ${climateModalHtml()}`;
  document.querySelectorAll("[data-climate-tab]").forEach((button) => button.addEventListener("click", () => {
    climateTab = button.dataset.climateTab;
    document.querySelectorAll("[data-climate-tab]").forEach((item) => item.classList.toggle("active", item.dataset.climateTab === climateTab));
    animateTabChange(document.querySelector("#climateTabContent"), renderClimateTab);
  }));
  document.querySelectorAll("[data-climate-close]").forEach((button) => button.addEventListener("click", () => climateCloseModal()));
  document.querySelector("#climateModal")?.addEventListener("click", (event) => { if (event.target.id === "climateModal") climateCloseModal(); });
  renderClimateTab();
  scrollPageToTop();
}

function climateKpi(icon, label, value, caption, color, detailIcon) { return `<article class="kpi-card climate-kpi" style="--accent-line:${color}"><div class="kpi-top"><div class="kpi-icon" style="color:${color};border-color:${color}66">${icon}</div><div><div class="kpi-label">${label}</div><div class="kpi-value big">${escapeHtml(value)}</div></div></div><div class="module-kpi-detail">${moduleIcon(detailIcon)}<div class="kpi-caption">${escapeHtml(caption)}</div>${moduleIcon("arrow-right")}</div></article>`; }
function renderClimateTab() { const target = document.querySelector("#climateTabContent"); if (!target) return; if (climateTab === "issues") target.innerHTML = climateIssuesHtml(); else if (climateTab === "indicators") { target.innerHTML = climateIndicatorsHtml(); climateRenderCharts(); } else target.innerHTML = climateDeterminationHtml(); climateBindActions(); }

function climateDeterminationHtml() {
  const item = climateData().determination;
  return `
    <div class="climate-notice">${moduleIcon("documentos")}<p>A ISO 9001:2015, em sua Emenda 2024, exige que a organização determine se as mudanças climáticas são relevantes ao contexto do SGQ e às necessidades das partes interessadas.</p></div>
    <section class="dcc climate-determination">
      <header class="dcc-hd climate-determination-head">
        <div><div class="dcc-title">Determinação da empresa quanto a condições climáticas</div><div class="dcc-sub">Avaliação formal de relevância para as cláusulas 4.1 e 4.2</div></div>
        <div class="climate-meta">
          <div class="climate-meta-item">${moduleIcon("edit")}<div><span>Status</span><strong>${escapeHtml(item.status)}</strong></div></div>
          <div class="climate-meta-item">${moduleIcon("contexto")}<div><span>Responsável</span><strong>${escapeHtml(item.owner)}</strong></div></div>
          <div class="climate-meta-item">${moduleIcon("calendar")}<div><span>Avaliado em</span><strong>${formatDate(item.reviewedAt)}</strong></div></div>
        </div>
      </header>
      <div class="climate-determination-grid">
        <div class="field"><label>Relevante para o SGQ? ${climateRequiredHint("relevance")}</label><select class="input-basic" id="climateRelevant"><option${item.relevant === "Sim" ? " selected" : ""}>Sim</option><option${item.relevant === "Não" ? " selected" : ""}>Não</option></select></div>
        <div class="field"><label>Partes interessadas exigem? ${climateRequiredHint("stakeholders")}</label><select class="input-basic" id="climateStakeholder"><option${item.stakeholderRequirement === "Sim" ? " selected" : ""}>Sim</option><option${item.stakeholderRequirement === "Não" ? " selected" : ""}>Não</option></select></div>
        <div class="field full"><label>Justificativa da determinação ${climateRequiredHint("justification")}</label><textarea class="input-basic" id="climateJustification">${escapeHtml(item.justification)}</textarea></div>
        <div class="field full"><label>Detalhe das necessidades das partes interessadas ${climateRequiredHint("stakeholderDetail")}</label><textarea class="input-basic" id="climateStakeholderDetail">${escapeHtml(item.stakeholderDetail)}</textarea></div>
        <div class="field"><label>Status ${climateRequiredHint("status")}</label><select class="input-basic" id="climateStatus"><option${item.status === "Pendente" ? " selected" : ""}>Pendente</option><option${item.status === "Aprovado" ? " selected" : ""}>Aprovado</option><option${item.status === "Em revisão" ? " selected" : ""}>Em revisão</option></select></div>
        <div class="field"><label>Responsável ${climateRequiredHint("owner")}</label><select class="input-basic" id="climateOwner">${climatePeopleOptions(item.owner)}</select></div>
        <div class="field"><label>Próxima revisão ${climateRequiredHint("nextReview")}</label><input class="input-basic" type="date" id="climateNextReview" value="${escapeHtml(item.nextReview)}"></div>
      </div>
      <footer class="climate-determination-footer"><button class="btn-primary" data-climate-action="save-determination" type="button">${moduleIcon("save")}Salvar determinação</button></footer>
    </section>`;
}

function climateIssuesHtml() { const rows = climateData().issues; return `<section class="dcc"><div class="dcc-hd"><div><div class="dcc-title">Questões climáticas avaliadas</div><div class="dcc-sub">Determinação de relevância e tratamento das questões identificadas</div></div>${canEditModule("mudancas-climaticas") ? `<button class="btn-grad" data-climate-action="new-issue" type="button">${moduleIcon("plus")}Nova questão</button>` : ""}</div><div class="risk-table-wrap"><table class="ctxtbl climate-table"><thead><tr><th>Descrição</th><th>Relevância</th><th>Possível impacto</th><th>Ação / tratamento</th><th>Responsável</th><th>Prazo</th><th>Status</th><th>Evidência</th><th>Ações</th></tr></thead><tbody>${rows.map((item) => `<tr><td class="strong-cell">${escapeHtml(item.description)}</td><td>${climateRelevant(item.relevant)}</td><td class="desc-cell">${escapeHtml(item.impact)}</td><td class="desc-cell">${escapeHtml(item.action)}</td><td>${personCell(item.owner, item.role)}</td><td class="mono">${formatDate(item.due)}</td><td>${climateStatus(item)}</td><td>${item.evidence ? `<span class="climate-evidence">${moduleIcon("documentos")}${escapeHtml(item.evidence)}</span>` : "-"}</td><td>${canEditModule("mudancas-climaticas") ? `<div class="row-actions"><button class="abtn" data-climate-action="edit-issue" data-id="${item.id}" title="Editar" type="button">${moduleIcon("edit")}</button><button class="abtn danger" data-climate-action="delete-issue" data-id="${item.id}" title="Excluir" type="button">${moduleIcon("trash")}</button></div>` : "-"}</td></tr>`).join("") || `<tr><td colspan="9"><div class="empty-state">Nenhuma questão climática avaliada.</div></td></tr>`}</tbody></table></div></section>`; }

function climateIndicatorsHtml() { return `<div class="climate-chart-grid"><section class="chart-card"><div class="chart-card-hd"><h4>Status das questões</h4><span>Distribuição por situação</span></div><canvas id="climateStatusChart"></canvas></section><section class="chart-card"><div class="chart-card-hd"><h4>Relevância para o SGQ</h4><span>Sim, parcial e não</span></div><canvas id="climateRelevanceChart"></canvas></section><section class="chart-card climate-chart-wide"><div class="chart-card-hd"><h4>Questões climáticas por situação</h4><span>Panorama do tratamento</span></div><canvas id="climateSituationChart"></canvas></section></div>`; }

function climateModalHtml() { return `<div class="modal-overlay" id="climateModal"><div class="modal-box wide climate-modal"><div class="modal-hd"><div><h3 id="climateModalTitle">Nova questão climática</h3><p>Determinação de relevância · cláusulas 4.1 e 4.2</p></div><button class="modal-close" data-climate-close type="button">${moduleIcon("close")}</button></div><input type="hidden" id="climateIssueId"><div class="field-row2"><div class="field"><label>Descrição</label><input class="input-basic" id="climateIssueDescription"></div><div class="field"><label>É relevante?</label><select class="input-basic" id="climateIssueRelevant"><option>Sim</option><option>Não</option><option>Parcial</option></select></div></div><div class="field"><label>Possível impacto</label><textarea class="input-basic" id="climateIssueImpact"></textarea></div><div class="field"><label>Ação / tratamento previsto</label><textarea class="input-basic" id="climateIssueAction"></textarea></div><div class="field-row2"><div class="field"><label>Responsável</label><select class="input-basic" id="climateIssueOwner">${peopleOptions()}</select></div><div class="field"><label>Cargo do responsável</label><input class="input-basic" id="climateIssueRole"></div></div><div class="field-row2"><div class="field"><label>Prazo</label><input class="input-basic" type="date" id="climateIssueDue"></div><div class="field"><label>Status</label><select class="input-basic" id="climateIssueStatus"><option>Não iniciada</option><option>Em andamento</option><option>Monitorando</option><option>Concluída</option></select></div></div><div class="field"><label>Evidência</label><div class="climate-upload"><label class="btn-ghost">${moduleIcon("documentos")}Anexar arquivo<input type="file" id="climateIssueFile"></label><span id="climateIssueEvidence">Nenhum arquivo selecionado</span><button class="abtn danger" id="climateRemoveEvidence" type="button" title="Remover evidência">${moduleIcon("trash")}</button></div><input type="hidden" id="climateIssueEvidenceValue"></div><div class="modal-actions"><button class="btn-ghost" data-climate-close type="button">Cancelar</button><button class="btn-primary" data-climate-action="save-issue" type="button">Salvar</button></div></div></div>`; }

function climateBindActions() { document.querySelectorAll("[data-climate-action]").forEach((button) => button.addEventListener("click", () => { const action = button.dataset.climateAction; if (action === "save-determination") climateSaveDetermination(); if (action === "new-issue") climateOpenIssue(); if (action === "edit-issue") climateOpenIssue(button.dataset.id); if (action === "delete-issue") climateDeleteIssue(button.dataset.id); if (action === "save-issue") climateSaveIssue(); })); document.querySelector("#climateIssueFile")?.addEventListener("change", (event) => { const file = event.target.files[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { toast("Arquivo muito grande. Máximo: 5 MB."); event.target.value = ""; return; } climateSetEvidence(file.name); }); document.querySelector("#climateRemoveEvidence")?.addEventListener("click", () => climateSetEvidence("")); }
function climateSaveDetermination() { const item = climateData().determination; Object.assign(item, { relevant: inputValue("climateRelevant"), justification: inputValue("climateJustification"), stakeholderRequirement: inputValue("climateStakeholder"), stakeholderDetail: inputValue("climateStakeholderDetail"), status: inputValue("climateStatus"), owner: inputValue("climateOwner"), nextReview: inputValue("climateNextReview"), reviewedAt: new Date().toISOString().slice(0, 10) }); climateSave("Determinação salva."); renderClimateModule(); }
function climateOpenIssue(id = "") { const item = climateData().issues.find((row) => row.id === id); setText("#climateModalTitle", item ? "Editar questão climática" : "Nova questão climática"); setInputValue("climateIssueId", item?.id || ""); setInputValue("climateIssueDescription", item?.description || ""); setInputValue("climateIssueRelevant", item?.relevant || "Sim"); setInputValue("climateIssueImpact", item?.impact || ""); setInputValue("climateIssueAction", item?.action || ""); setInputValue("climateIssueOwner", item?.owner || "Hugo Melo"); setInputValue("climateIssueRole", item?.role || ""); setInputValue("climateIssueDue", item?.due || ""); setInputValue("climateIssueStatus", item?.status || "Não iniciada"); climateSetEvidence(item?.evidence || ""); document.querySelector("#climateModal")?.classList.add("show"); }
function climateSetEvidence(value) { setInputValue("climateIssueEvidenceValue", value); setText("#climateIssueEvidence", value || "Nenhum arquivo selecionado"); document.querySelector("#climateRemoveEvidence")?.toggleAttribute("hidden", !value); }
function climateCloseModal() { document.querySelector("#climateModal")?.classList.remove("show"); }
function climateSaveIssue() { const data = climateData(); const id = inputValue("climateIssueId"); const record = { id: id || `CLI-${String(data.issues.length + 1).padStart(4, "0")}`, description: inputValue("climateIssueDescription"), relevant: inputValue("climateIssueRelevant"), impact: inputValue("climateIssueImpact"), action: inputValue("climateIssueAction"), owner: inputValue("climateIssueOwner"), role: inputValue("climateIssueRole"), due: inputValue("climateIssueDue"), status: inputValue("climateIssueStatus"), evidence: inputValue("climateIssueEvidenceValue") }; const index = data.issues.findIndex((item) => item.id === id); if (index >= 0) data.issues[index] = record; else data.issues.push(record); climateSave("Questão climática salva."); climateCloseModal(); renderClimateModule(); }
function climateDeleteIssue(id) { const data = climateData(); data.issues = data.issues.filter((item) => item.id !== id); climateSave("Questão climática excluída."); renderClimateModule(); }
function climateRenderCharts() { if (typeof Chart === "undefined") return; const issues = climateData().issues; Object.values(climateCharts).forEach((chart) => chart.destroy()); const color = getComputedStyle(document.body).getPropertyValue("--text-secondary"); const draw = (id, type, labels, values, colors) => { const canvas = document.querySelector(`#${id}`); if (!canvas) return; const doughnut = type === "doughnut"; const design = doughnut ? window.QualityProDoughnut?.decorate(canvas, { labels, values, colors }) : null; climateCharts[id] = new Chart(canvas, { type, data: { labels, datasets: [{ data: values, backgroundColor: design?.dataset.backgroundColor || colors, borderColor: design?.dataset.borderColor || "transparent", borderWidth: design?.dataset.borderWidth ?? 0, borderRadius: design?.dataset.borderRadius ?? (type === "bar" ? 6 : 0), spacing: design?.dataset.spacing, hoverOffset: design?.dataset.hoverOffset }] }, options: { responsive: true, maintainAspectRatio: false, ...(design?.options || {}), plugins: design?.options.plugins || { legend: { labels: { color } } }, scales: type === "bar" ? { x: { ticks: { color }, grid: { color: "rgba(255,255,255,.06)" } }, y: { beginAtZero: true, ticks: { precision: 0, color }, grid: { color: "rgba(255,255,255,.06)" } } } : {} } }); if (design) design.bind(climateCharts[id]); }; draw("climateStatusChart", "doughnut", ["Concluída", "Em andamento", "Monitorando", "Não iniciada"], ["Concluída", "Em andamento", "Monitorando", "Não iniciada"].map((status) => issues.filter((item) => item.status === status).length), ["#34D399", "#FBBF24", "#46D9F5", "#8b98ab"]); draw("climateRelevanceChart", "bar", ["Sim", "Parcial", "Não"], ["Sim", "Parcial", "Não"].map((relevant) => issues.filter((item) => item.relevant === relevant).length), ["#34D399", "#A78BFA", "#8b98ab"]); draw("climateSituationChart", "bar", issues.map((item) => item.description), issues.map((item) => item.status === "Concluída" ? 100 : item.status === "Em andamento" ? 60 : item.status === "Monitorando" ? 35 : 10), "#4fa3ff"); }
