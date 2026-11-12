const climateStyle = document.createElement("style");
climateStyle.textContent = `.climate-page-content{min-width:0}.climate-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.climate-kpis .kpi-card{min-height:122px;padding:10px 12px 9px;border-radius:12px;box-shadow:0 10px 22px rgba(24,54,86,.07)}.climate-kpis .kpi-top{align-items:center;gap:10px}.climate-kpis .kpi-icon{width:38px;height:38px;border-radius:9px;background:color-mix(in srgb,currentColor 10%,transparent)}.climate-kpis .kpi-icon .icon{width:18px;height:18px}.climate-kpis .kpi-label{font-size:10px;letter-spacing:.5px}.climate-kpis .kpi-value.big{font-size:26px;line-height:1}.climate-notice{display:flex;gap:12px;margin-bottom:18px;padding:15px;border:1px solid rgba(52,211,153,.3);border-radius:9px;background:rgba(52,211,153,.06);color:var(--text-secondary)}.climate-determination-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}.climate-determination-grid .full{grid-column:1/-1}.climate-determination-grid textarea{min-height:92px}.climate-relevance{display:inline-flex;padding:4px 8px;border:1px solid;border-radius:7px;font-size:11px;font-weight:800}.climate-relevance.yes{color:var(--accent-green)}.climate-relevance.partial{color:var(--accent-purple)}.climate-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.climate-chart-grid .chart-card{min-height:280px;padding:18px}.climate-chart-wide{grid-column:1/-1}.climate-chart-grid canvas{width:100%!important;height:210px!important}.climate-upload{display:flex;align-items:center;gap:10px;color:var(--text-secondary)}.climate-upload input[type=file]{display:none}@media(max-width:900px){.climate-kpis,.climate-chart-grid,.climate-determination-grid{grid-template-columns:1fr}.climate-determination-grid .full,.climate-chart-wide{grid-column:auto}}`;
document.head.append(climateStyle);
climateStyle.textContent += `#climateIndicatorsFrame{display:block;width:100%;height:75vh;min-height:480px;border:0;border-radius:8px;overflow:hidden}#climateTabContent [hidden],#climateModal [hidden]{display:none!important}.climate-treatment-fields{display:grid;gap:12px}@media(min-width:981px){#climateTabContent:has(#climateIndicatorsFrame){overflow:hidden}#climateIndicatorsFrame{height:100%;min-height:0}}`;
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
let climateSaving = false;

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
  state.climate = { ...(state.climate || {}) };
  state.climate.issues = Array.isArray(state.climate.issues) ? state.climate.issues : [];
  const empty = Object.fromEntries(Object.keys(climateSeed.determination).map((key) => [key, ""]));
  state.climate.determination = { ...empty, ...(state.climate.determination || {}) };
  return state.climate;
}

async function climateSave(next, message, history = true) {
  if (climateSaving || !canEditModule("mudancas-climaticas")) return false;
  climateSaving = true;
  const controls = [...document.querySelectorAll('#climateTabContent input, #climateTabContent select, #climateTabContent textarea, #climateModal input, #climateModal select, #climateModal textarea, [data-climate-action], [data-climate-close], [data-climate-tab], [data-module-id="mudancas-climaticas"]')];
  const disabled = controls.map((control) => control.disabled);
  controls.forEach((control) => { control.disabled = true; });
  try {
    const candidate = structuredClone(next);
    const input = document.querySelector("#climateIssueFile");
    const file = candidate.issues.find((row) => row._uploadEvidence);
    if (file) {
      file.evidenceFile = input.climateUploadedFile || await uploadModuleAttachment(input.files[0], "/api/climate-attachments");
      input.climateUploadedFile = file.evidenceFile;
      file.evidence = file.evidenceFile.name;
      delete file._uploadEvidence;
    }
    if (!await saveRemoteData("state", { ...state, climate: candidate }, "mudancas-climaticas")) {
      toast("Não foi possível salvar. Seus campos foram mantidos para tentar novamente.");
      return false;
    }
    if (history) recordModuleSnapshot("mudancas-climaticas");
    state.climate = candidate;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (message) toast(message);
    return true;
  } catch (error) {
    toast(error.message || "Não foi possível salvar a avaliação climática.");
    return false;
  } finally {
    climateSaving = false;
    controls.forEach((control, index) => { control.disabled = disabled[index]; });
    updateModuleHistoryButtons("mudancas-climaticas");
  }
}
function climateToday() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function climateIssueNeedsTreatment(item) { return item.relevant === "Sim" || item.relevant === "Parcial"; }
function climateCanAssessIssues() {
  const item = climateData().determination;
  return [item.relevant, item.stakeholderRequirement].every((answer) => ["Sim", "Não"].includes(answer)) && (item.relevant === "Sim" || item.stakeholderRequirement === "Sim");
}
function climateIsLate(item) { return Boolean(climateIssueNeedsTreatment(item) && item.status !== "Concluída" && item.due && item.due < climateToday()); }
function climateStatus(item) { const text = item.status || "Não iniciada"; return `<span class="status-pill ${text === "Concluída" ? "s-done" : text === "Atrasada" ? "s-late" : text === "Em andamento" ? "s-prog" : text === "Monitorando" ? "s-info" : "s-pend"}"><span class="status-dot2"></span>${escapeHtml(text)}</span>`; }
function climateRelevant(value) { return `<span class="climate-relevance ${value === "Sim" ? "yes" : value === "Parcial" ? "partial" : "no"}">${escapeHtml(value)}</span>`; }
function climatePeopleOptions(selected = "") {
  const names = [...new Set([...(state.users || []).map((user) => user.name || user.displayName), typeof currentUser === "undefined" ? "" : currentUser?.name, selected].filter(Boolean))];
  return `<option value=""${selected ? "" : " selected"}>Selecione um responsável</option>${names.map((name) => `<option value="${escapeHtml(name)}"${name === selected ? " selected" : ""}>${escapeHtml(name)}</option>`).join("")}`;
}

function renderClimateModule() {
  pageContent.classList.add("climate-page-content");
  const data = climateData();
  const issues = data.issues;
  const relevant = issues.filter((item) => item.relevant === "Sim").length;
  const applicable = issues.filter(climateIssueNeedsTreatment);
  const complete = applicable.filter((item) => item.status === "Concluída").length;
  const late = issues.filter(climateIsLate).length;
  if (climateTab === "issues" && !climateCanAssessIssues()) climateTab = "determination";
  pageContent.innerHTML = `
    <div class="climate-summary-header"><div class="climate-summary-heading">
    ${moduleHeaderHtml("mudancas-climaticas", { category: "", description: "ISO 9001:2015 · EMENDA 2024", actions: false })}
    </div>
    <div class="climate-kpis">
      ${climateKpi(moduleIcon("documentos"), "Determinação", data.determination.relevant === "Sim" ? "Relevante" : data.determination.relevant === "Não" ? "Não relevante" : "Não definida", data.determination.status || "Não avaliada", "#34D399", "check-circle")}
      ${climateKpi(moduleIcon("riscos"), "Questões avaliadas", issues.length, `${relevant} relevante(s) · ${issues.filter((item) => item.relevant === "Parcial").length} parcial(is)`, "#4fa3ff", "bar-chart")}
      ${climateKpi(moduleIcon("check-circle"), "Questões tratadas", complete, `de ${applicable.length} aplicáveis concluídas`, "#FBBF24", "documentos", applicable.length ? complete / applicable.length : 0)}
      ${climateKpi(moduleIcon("nao-conformidades"), "Questões atrasadas", late, late ? "com prazo vencido" : "Nenhum prazo vencido", "#F87171", "calendar-clock", applicable.length ? late / applicable.length : 0)}
    </div>
    </div>
    <div class="ctx-tabs climate-tabs">
      <button type="button" class="ctx-tab${climateTab === "determination" ? " active" : ""}" data-climate-tab="determination">Determinação da empresa</button>
      ${climateCanAssessIssues() ? `<button type="button" class="ctx-tab${climateTab === "issues" ? " active" : ""}" data-climate-tab="issues">Questões climáticas</button>` : ""}
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

function climateKpi(icon, label, value, caption, color, detailIcon, ratio = null) { return `<article class="kpi-card climate-kpi" ${ratio === null ? '' : `data-kpi-progress="${ratio}"`} style="--accent-line:${color}"><div class="kpi-top"><div class="kpi-icon" style="color:${color};border-color:${color}66">${icon}</div><div><div class="kpi-label">${label}</div><div class="kpi-value big">${escapeHtml(value)}</div></div></div><div class="module-kpi-detail">${moduleIcon(detailIcon)}<div class="kpi-caption">${escapeHtml(caption)}</div>${moduleIcon("arrow-right")}</div></article>`; }
function renderClimateTab() { const target = document.querySelector("#climateTabContent"); if (!target) return; if (climateTab === "issues") target.innerHTML = climateIssuesHtml(); else if (climateTab === "indicators") { target.innerHTML = climateIndicatorsHtml();  } else target.innerHTML = climateDeterminationHtml(); climateBindActions(); }

function climateDeterminationHtml() {
  const item = climateData().determination;
  return `
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
        <div class="field"><label>Relevante para o SGQ? ${climateRequiredHint("relevance")}</label><select class="input-basic" id="climateRelevant"><option value=""${item.relevant ? "" : " selected"}>Selecione...</option><option value="Sim"${item.relevant === "Sim" ? " selected" : ""}>Sim</option><option value="Não"${item.relevant === "Não" ? " selected" : ""}>Não</option></select></div>
        <div class="field"><label>Partes interessadas exigem? ${climateRequiredHint("stakeholders")}</label><select class="input-basic" id="climateStakeholder"><option value=""${item.stakeholderRequirement ? "" : " selected"}>Selecione...</option><option value="Sim"${item.stakeholderRequirement === "Sim" ? " selected" : ""}>Sim</option><option value="Não"${item.stakeholderRequirement === "Não" ? " selected" : ""}>Não</option></select></div>
        <div class="field full"><label>Justificativa da determinação ${climateRequiredHint("justification")}</label><textarea class="input-basic" id="climateJustification">${escapeHtml(item.justification)}</textarea></div>
        <div class="field full" id="climateStakeholderDetailField"${item.stakeholderRequirement === "Sim" ? "" : " hidden"}><label for="climateStakeholderDetail">Detalhe das necessidades das partes interessadas ${climateRequiredHint("stakeholderDetail")}</label><textarea class="input-basic" id="climateStakeholderDetail">${escapeHtml(item.stakeholderDetail)}</textarea></div>
        <div class="field"><label>Status ${climateRequiredHint("status")}</label><select class="input-basic" id="climateStatus"><option value=""${item.status ? "" : " selected"}>Selecione...</option><option value="Pendente"${item.status === "Pendente" ? " selected" : ""}>Pendente</option><option value="Aprovado"${item.status === "Aprovado" ? " selected" : ""}>Aprovado</option><option value="Em revisão"${item.status === "Em revisão" ? " selected" : ""}>Em revisão</option></select></div>
        <div class="field"><label>Responsável ${climateRequiredHint("owner")}</label><select class="input-basic" id="climateOwner">${climatePeopleOptions(item.owner)}</select></div>
        <div class="field"><label>Próxima revisão ${climateRequiredHint("nextReview")}</label><input class="input-basic" type="date" id="climateNextReview" value="${escapeHtml(item.nextReview)}"></div>
      </div>
      ${canEditModule("mudancas-climaticas") ? `<footer class="climate-determination-footer"><button class="btn-primary" data-climate-action="save-determination" type="button">${moduleIcon("save")}Salvar determinação</button></footer>` : ""}
    </section>`;
}

function climateEvidenceHtml(item) {
  return item.evidenceFile?.id
    ? `<a class="table-file-link" href="/api/climate-attachments?id=${encodeURIComponent(item.evidenceFile.id)}" target="_blank" rel="noopener">${moduleIcon("documentos")}${escapeHtml(item.evidenceFile.name)}</a>`
    : item.evidence ? `<span class="climate-evidence">${escapeHtml(item.evidence)} (registro sem arquivo)</span>` : "-";
}

function climateIssuesHtml() {
  const rows = climateData().issues;
  return `<section class="dcc"><div class="dcc-hd"><div><div class="dcc-title">Questões climáticas avaliadas</div><div class="dcc-sub">Determinação de relevância e tratamento das questões identificadas</div></div>${canEditModule("mudancas-climaticas") ? `<button class="btn-grad" data-climate-action="new-issue" type="button">${moduleIcon("plus")}Nova questão</button>` : ""}</div><div class="risk-table-wrap"><table class="ctxtbl climate-table"><thead><tr><th>Descrição</th><th>Relevância</th><th>Possível impacto / justificativa</th><th>Ação / tratamento</th><th>Responsável</th><th>Prazo</th><th>Status</th><th>Evidência</th><th>Ações</th></tr></thead><tbody>${rows.map((item) => {
    const applicable = climateIssueNeedsTreatment(item);
    return `<tr><td class="strong-cell">${escapeHtml(item.description)}</td><td>${climateRelevant(item.relevant)}</td><td class="desc-cell">${escapeHtml(item.impact)}</td><td class="desc-cell">${applicable ? escapeHtml(item.action) : "-"}</td><td>${applicable ? personCell(item.owner, item.role) : "-"}</td><td class="mono">${applicable ? formatDate(item.due) : "-"}</td><td>${applicable ? climateStatus(item) : "Não aplicável"}</td><td>${climateEvidenceHtml(item)}</td><td>${canEditModule("mudancas-climaticas") ? `<div class="row-actions"><button class="abtn" data-climate-action="edit-issue" data-id="${escapeHtml(item.id)}" title="Editar" type="button">${moduleIcon("edit")}</button><button class="abtn danger" data-climate-action="delete-issue" data-id="${escapeHtml(item.id)}" title="Excluir" type="button">${moduleIcon("trash")}</button></div>` : "-"}</td></tr>`;
  }).join("") || `<tr><td colspan="9"><div class="empty-state">Nenhuma questão climática avaliada.</div></td></tr>`}</tbody></table></div></section>`;
}

function climateIndicatorsHtml() { return `<iframe id="climateIndicatorsFrame" title="Indicadores de Mudanças Climáticas" src="/climate-indicators-frame.html" allow="fullscreen" allowfullscreen></iframe>`; }

function climateModalHtml() {
  return `<div class="modal-overlay" id="climateModal"><div class="modal-box wide climate-modal" role="dialog" aria-modal="true" aria-labelledby="climateModalTitle">
    <div class="modal-hd"><div><h3 id="climateModalTitle">Nova questão climática</h3><p>Determinação de relevância · cláusulas 4.1 e 4.2</p></div><button class="modal-close" data-climate-close type="button" aria-label="Fechar">${moduleIcon("close")}</button></div>
    <input type="hidden" id="climateIssueId">
    <div class="field-row2">
      <div class="field"><label for="climateIssueDescription">Descrição</label><input class="input-basic" id="climateIssueDescription" required></div>
      <div class="field"><label for="climateIssueRelevant">É relevante?</label><select class="input-basic" id="climateIssueRelevant" required><option value="">Selecione...</option><option>Sim</option><option>Não</option><option>Parcial</option></select></div>
    </div>
    <div class="field"><label for="climateIssueImpact">Possível impacto / justificativa</label><textarea class="input-basic" id="climateIssueImpact" required></textarea></div>
    <div id="climateIssueTreatment" class="climate-treatment-fields" hidden>
      <div class="field"><label for="climateIssueAction">Ação / tratamento previsto</label><textarea class="input-basic" id="climateIssueAction"></textarea></div>
      <div class="field-row2"><div class="field"><label for="climateIssueOwner">Responsável</label><select class="input-basic" id="climateIssueOwner">${climatePeopleOptions()}</select></div><div class="field"><label for="climateIssueRole">Cargo do responsável</label><input class="input-basic" id="climateIssueRole"></div></div>
      <div class="field-row2"><div class="field"><label for="climateIssueDue">Prazo</label><input class="input-basic" type="date" id="climateIssueDue"></div><div class="field"><label for="climateIssueStatus">Status</label><select class="input-basic" id="climateIssueStatus"><option value="">Selecione...</option><option>Não iniciada</option><option>Em andamento</option><option>Monitorando</option><option>Concluída</option></select></div></div>
    </div>
    <div class="field"><label>Evidência</label><div class="climate-upload"><label class="btn-ghost">${moduleIcon("documentos")}Anexar arquivo<input type="file" id="climateIssueFile" accept=".pdf,.png,.jpg,.jpeg,.webp"></label><span id="climateIssueEvidence">Nenhum arquivo selecionado</span><button class="abtn danger" id="climateRemoveEvidence" type="button" title="Remover evidência">${moduleIcon("trash")}</button></div><input type="hidden" id="climateIssueEvidenceValue"></div>
    <div class="modal-actions"><button class="btn-ghost" data-climate-close type="button">Cancelar</button><button class="btn-primary" data-climate-action="save-issue" type="button">Salvar</button></div>
  </div></div>`;
}

function climateSyncConditions() {
  const detail = document.querySelector("#climateStakeholderDetailField");
  if (detail) detail.hidden = inputValue("climateStakeholder") !== "Sim";
  const treatment = document.querySelector("#climateIssueTreatment");
  if (treatment) {
    treatment.hidden = !climateIssueNeedsTreatment({ relevant: inputValue("climateIssueRelevant") });
    treatment.querySelectorAll("input, select, textarea").forEach((control) => { control.disabled = treatment.hidden || climateSaving; });
  }
}

function climateBindActions() {
  // The modal survives tab switches, so replace handlers instead of stacking them.
  document.querySelectorAll("[data-climate-action]").forEach((button) => {
    button.onclick = () => {
      if (climateSaving || !canEditModule("mudancas-climaticas")) return;
      const action = button.dataset.climateAction;
      if (action === "save-determination") climateSaveDetermination();
      if (action === "new-issue") climateOpenIssue();
      if (action === "edit-issue") climateOpenIssue(button.dataset.id);
      if (action === "delete-issue") climateDeleteIssue(button.dataset.id);
      if (action === "save-issue") climateSaveIssue();
    };
  });
  for (const id of ["climateStakeholder", "climateIssueRelevant"]) {
    const select = document.getElementById(id);
    if (select) select.onchange = climateSyncConditions;
  }
  const input = document.querySelector("#climateIssueFile");
  if (input) input.onchange = () => {
    const file = input.files[0];
    input.climateUploadedFile = null;
    if (!file) return;
    if (!file.size || file.size > 2 * 1024 * 1024 || !/\.(pdf|png|jpe?g|webp)$/i.test(file.name)) {
      toast("Anexe um PDF ou imagem PNG, JPG ou WEBP de até 2 MB.");
      input.value = "";
      return;
    }
    climateSetEvidence(file.name);
  };
  const remove = document.querySelector("#climateRemoveEvidence");
  if (remove) remove.onclick = () => {
    if (climateSaving) return;
    input.value = "";
    input.climateUploadedFile = null;
    climateSetEvidence("");
  };
  climateSyncConditions();
  if (!canEditModule("mudancas-climaticas")) {
    document.querySelectorAll("#climateTabContent input, #climateTabContent select, #climateTabContent textarea").forEach((control) => { control.disabled = true; });
  }
}

function climateValidate(ids) {
  for (const id of ids) {
    const input = document.getElementById(id);
    input.setCustomValidity(input.value.trim() ? "" : "Preencha este campo.");
    input.oninput = () => input.setCustomValidity("");
    if (!input.reportValidity()) return false;
  }
  return true;
}
async function climateSaveDetermination() {
  const required = ["climateRelevant", "climateStakeholder", "climateJustification", "climateStatus", "climateOwner", "climateNextReview"];
  if (inputValue("climateStakeholder") === "Sim") required.push("climateStakeholderDetail");
  if (!climateValidate(required)) return;
  const next = structuredClone(climateData());
  Object.assign(next.determination, {
    relevant: inputValue("climateRelevant"), justification: inputValue("climateJustification"),
    stakeholderRequirement: inputValue("climateStakeholder"), stakeholderDetail: inputValue("climateStakeholderDetail"),
    status: inputValue("climateStatus"), owner: inputValue("climateOwner"), nextReview: inputValue("climateNextReview"),
    reviewedAt: climateToday()
  });
  if (await climateSave(next, "Determinação salva.")) renderClimateModule();
}
function climateOpenIssue(id = "") {
  if (!canEditModule("mudancas-climaticas") || !climateCanAssessIssues() || climateSaving) return;
  const item = climateData().issues.find((row) => row.id === id);
  document.querySelector("#climateIssueOwner").innerHTML = climatePeopleOptions(item?.owner || "");
  setText("#climateModalTitle", item ? "Editar questão climática" : "Nova questão climática");
  for (const [field, key] of Object.entries({ Id: "id", Description: "description", Relevant: "relevant", Impact: "impact", Action: "action", Owner: "owner", Role: "role", Due: "due", Status: "status" })) {
    setInputValue(`climateIssue${field}`, item?.[key] || "");
    document.getElementById(`climateIssue${field}`).setCustomValidity("");
  }
  const fileInput = document.querySelector("#climateIssueFile");
  fileInput.value = "";
  fileInput.climateUploadedFile = null;
  climateSetEvidence(item?.evidenceFile?.name || item?.evidence || "");
  climateSyncConditions();
  document.querySelector("#climateModal")?.classList.add("show");
}
function climateSetEvidence(value) { setInputValue("climateIssueEvidenceValue", value); setText("#climateIssueEvidence", value || "Nenhum arquivo selecionado"); document.querySelector("#climateRemoveEvidence")?.toggleAttribute("hidden", !value); }
function climateCloseModal() { if (!climateSaving) document.querySelector("#climateModal")?.classList.remove("show"); }
function climateNextIssueId(data) {
  const number = Math.max(Number(data.nextIssueNumber) || 1, ...data.issues.map((row) => Number(/^CLI-(\d+)$/.exec(row.id)?.[1] || 0) + 1));
  data.nextIssueNumber = number + 1;
  return `CLI-${String(number).padStart(4, "0")}`;
}

async function climateSaveIssue() {
  if (climateSaving || !climateCanAssessIssues()) return;
  const applicable = climateIssueNeedsTreatment({ relevant: inputValue("climateIssueRelevant") });
  const required = ["climateIssueDescription", "climateIssueRelevant", "climateIssueImpact"];
  if (applicable) required.push("climateIssueStatus");
  if (applicable && ["Em andamento", "Monitorando", "Concluída"].includes(inputValue("climateIssueStatus"))) {
    required.push("climateIssueAction", "climateIssueOwner", "climateIssueDue");
  }
  if (!climateValidate(required)) return;
  const next = structuredClone(climateData());
  const id = inputValue("climateIssueId");
  const previous = next.issues.find((item) => item.id === id);
  if (id && !previous) { toast("Questão não encontrada. Reabra a lista."); return; }
  const evidence = inputValue("climateIssueEvidenceValue");
  const record = { ...previous, id: id || climateNextIssueId(next), description: inputValue("climateIssueDescription"), relevant: inputValue("climateIssueRelevant"), impact: inputValue("climateIssueImpact"), evidence };
  // Keep hidden treatment data for a later reassessment, but never count it as applicable.
  for (const [key, field] of Object.entries({ action: "Action", owner: "Owner", role: "Role", due: "Due", status: "Status" })) {
    record[key] = inputValue(`climateIssue${field}`);
  }
  record.evidenceFile = evidence ? previous?.evidenceFile || null : null;
  if (document.querySelector("#climateIssueFile").files.length) record._uploadEvidence = true;
  const index = next.issues.findIndex((item) => item.id === id);
  if (index >= 0) next.issues[index] = record;
  else next.issues.push(record);
  if (await climateSave(next, "Questão climática salva.")) {
    climateCloseModal();
    renderClimateModule();
  }
}
async function climateDeleteIssue(id) {
  const next = structuredClone(climateData());
  if (!next.issues.some((item) => item.id === id)) return;
  next.issues = next.issues.filter((item) => item.id !== id);
  if (await climateSave(next, "Questão climática excluída.")) renderClimateModule();
}

async function climateRestoreHistory(direction) {
  if (climateSaving || !canEditModule("mudancas-climaticas")) return;
  const history = moduleHistoryState("mudancas-climaticas");
  const snapshot = history[direction].at(-1);
  if (!snapshot) return;
  const current = structuredClone(climateData());
  if (await climateSave(snapshot, "", false)) {
    history[direction].pop();
    history[direction === "undo" ? "redo" : "undo"].push(current);
    rerenderModuleAfterHistory("mudancas-climaticas", direction === "undo" ? "Ação desfeita." : "Ação refeita.");
  }
}
function climateRenderCharts() { if (typeof Chart === "undefined") return; const issues = climateData().issues; Object.values(climateCharts).forEach((chart) => chart.destroy()); const color = getComputedStyle(document.body).getPropertyValue("--text-secondary"); const draw = (id, type, labels, values, colors) => { const canvas = document.querySelector(`#${id}`); if (!canvas) return; const doughnut = type === "doughnut"; const design = doughnut ? window.QualityProDoughnut?.decorate(canvas, { labels, values, colors }) : null; climateCharts[id] = new Chart(canvas, { type, data: { labels, datasets: [{ data: values, backgroundColor: design?.dataset.backgroundColor || colors, borderColor: design?.dataset.borderColor || "transparent", borderWidth: design?.dataset.borderWidth ?? 0, borderRadius: design?.dataset.borderRadius ?? (type === "bar" ? 6 : 0), spacing: design?.dataset.spacing, hoverOffset: design?.dataset.hoverOffset }] }, options: { responsive: true, maintainAspectRatio: false, ...(design?.options || {}), plugins: design?.options.plugins || { legend: { labels: { color } } }, scales: type === "bar" ? { x: { ticks: { color }, grid: { color: "rgba(255,255,255,.06)" } }, y: { beginAtZero: true, ticks: { precision: 0, color }, grid: { color: "rgba(255,255,255,.06)" } } } : {} } }); if (design) design.bind(climateCharts[id]); }; draw("climateStatusChart", "doughnut", ["Concluída", "Em andamento", "Monitorando", "Não iniciada"], ["Concluída", "Em andamento", "Monitorando", "Não iniciada"].map((status) => issues.filter((item) => item.status === status).length), ["#34D399", "#FBBF24", "#46D9F5", "#8b98ab"]); draw("climateRelevanceChart", "bar", ["Sim", "Parcial", "Não"], ["Sim", "Parcial", "Não"].map((relevant) => issues.filter((item) => item.relevant === relevant).length), ["#34D399", "#A78BFA", "#8b98ab"]); draw("climateSituationChart", "bar", issues.map((item) => item.description), issues.map((item) => item.status === "Concluída" ? 100 : item.status === "Em andamento" ? 60 : item.status === "Monitorando" ? 35 : 10), "#4fa3ff"); }
