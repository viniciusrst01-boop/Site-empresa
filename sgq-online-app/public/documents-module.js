let documentsActiveTab = "cadastro";
let documentsFilters = { type: "", sector: "", status: "", search: "" };
let documentsCharts = {};

const documentTypes = ["Procedimento", "Formulário", "Instrução de Trabalho", "Manual da Qualidade", "Política da Qualidade", "Escopo", "Outro"];
const documentStatuses = ["Aguardando Aprovação", "Vigente", "Em Revisão", "Revisar documento", "Obsoleto"];
const documentExternalSources = ["ABNT", "Cliente", "Fornecedor", "Órgão Governamental", "Fabricante", "Outro"];

function ensureDocumentsData() {
  if (!Array.isArray(state.documents)) state.documents = [];
  state.documents = state.documents.map((row, index) => ({
    ...row,
    id: row.id || `DOC-${String(index + 1).padStart(4, "0")}`,
    kind: row.kind === "external" ? "external" : "internal",
    code: row.code || row.codigo || "",
    title: row.title || row.descricao || "",
    version: row.version || row.revisao || "",
    owner: row.owner || row.elaboradoPor || "",
    status: row.status || "Aguardando Aprovação",
    revisionDate: row.revisionDate || row.dataRevisao || "",
    elaborationDate: row.elaborationDate || row.dataElaboracao || "",
    revisionPeriod: row.revisionPeriod || row.periodoRevisao || "360 dias",
    sector: row.sector || row.setor || "",
    controlledCopy: row.controlledCopy || row.copiaControlada || "Não",
    attachmentName: row.attachmentName || row.anexo || "",
  }));
}

function documentsInternal() { ensureDocumentsData(); return state.documents.filter((row) => row.kind !== "external"); }
function documentsExternal() { ensureDocumentsData(); return state.documents.filter((row) => row.kind === "external"); }
function documentDate(value) { return value ? formatDate(value) : "-"; }
function documentToday() { return new Date().toISOString().slice(0, 10); }
function documentAddDays(value, days) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}
function documentRevisionDays(value) { return Number(String(value || "360").match(/\d+/)?.[0] || 360); }
function documentNextRevision(row) { return row.revisionDate ? documentAddDays(row.revisionDate, documentRevisionDays(row.revisionPeriod)) : ""; }
function documentIsLate(row) { const date = row.kind === "external" ? row.nextVerification : documentNextRevision(row); return Boolean(date && date < documentToday()); }
function documentEffectiveStatus(row) {
  if (row.status === "Obsoleto" || row.status === "Aguardando Aprovação") return row.status;
  if (row.status && row.status !== "Vigente") return row.status;
  return documentIsLate(row) ? "Revisar documento" : (row.status || "Vigente");
}
function documentStatusClass(status) {
  return ({ "Vigente": "vigente", "Em Revisão": "revisao", "Aguardando Aprovação": "aguardando", "Revisar documento": "vencido", "Obsoleto": "obsoleto" })[status] || "obsoleto";
}
function documentStatusHtml(row) {
  const status = documentEffectiveStatus(row);
  return `<span class="documents-status ${documentStatusClass(status)}">${escapeHtml(status)}</span>`;
}
function documentPeople() {
  return [...new Set([currentUser?.name, ...(state.users || []).map((row) => row.name || row.displayName), "Hugo Melo", "Carlos Andrade", "Beatriz Santos"].filter(Boolean))];
}
function documentOptions(values, selected = "", blank = "") {
  return `${blank ? `<option value="">${escapeHtml(blank)}</option>` : ""}${values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}`;
}

function documentCompanySectorOptions(selected = "") {
  const sectors = getCompanyProfile().registry.setores?.map((item) => String(item?.nome || "").trim()).filter(Boolean) || [];
  return documentOptions([...new Set([...sectors, selected].filter(Boolean))], selected, "Selecione...");
}
function documentNewId(kind) {
  const prefix = kind === "external" ? "EXT" : "DOC";
  const rows = state.documents.filter((row) => String(row.id || "").startsWith(`${prefix}-`));
  const next = rows.reduce((highest, row) => Math.max(highest, Number(String(row.id).split("-").pop()) || 0), 0) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

async function saveDocuments(message) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const saved = await saveRemoteData("state", state, "documentos");
  toast(saved ? message : lastSaveError || "Não foi possível salvar os documentos no banco.");
  return saved;
}

function renderDocumentsModule() {
  ensureDocumentsData();
  pageContent.innerHTML = `
    ${moduleHeaderHtml("documentos", { category: "INFORMAÇÃO DOCUMENTADA · 7.5", description: "Cadastro, lista mestra e controle de documentos internos e externos do Sistema de Gestão da Qualidade.", actions: false })}
    <main class="documents-module">
      ${documentsKpisHtml()}
      <nav class="documents-tabs" aria-label="Seções de documentos">
        ${[["cadastro", "Cadastro"], ["lista-mestra", "Lista Mestra"], ["externos", "Documentos Externos"], ["indicadores", "Indicadores"]].map(([key, label]) => `<button class="documents-tab${documentsActiveTab === key ? " active" : ""}" type="button" data-doc-tab="${key}">${label}</button>`).join("")}
      </nav>
      <section data-doc-content></section>
      <div id="documentsModalMount"></div>
    </main>`;
  renderDocumentsTab();
  bindViewTargetButtons();
  scrollPageToTop();
}

function documentsKpisHtml() {
  const internal = documentsInternal(); const external = documentsExternal(); const all = [...internal, ...external];
  const values = [
    ["Total de documentos", all.length, `${internal.length} internos · ${external.length} externos`, "#4fa3ff", "documentos"],
    ["Vigentes", all.filter((row) => documentEffectiveStatus(row) === "Vigente").length, "documentos em vigência", "#34d399", "check-circle"],
    ["Aguardando aprovação", internal.filter((row) => documentEffectiveStatus(row) === "Aguardando Aprovação").length, "pendentes do aprovador", "#46d9f5", "clock"],
    ["A revisar / vencidos", all.filter(documentIsLate).length, "revisões e verificações vencidas", "#fbbf24", "alert"],
  ];
  return `<section class="documents-kpis">${values.map(([label, value, caption, color, icon]) => `<article class="documents-kpi" style="--doc-kpi-color:${color}"><div class="documents-kpi-top"><span class="documents-kpi-icon">${moduleIcon(icon)}</span><div><div class="documents-kpi-label">${label}</div><div class="documents-kpi-value">${value}</div></div></div><div class="documents-kpi-caption">${caption}</div></article>`).join("")}</section>`;
}

function renderDocumentsTab(focus = null) {
  const content = pageContent.querySelector("[data-doc-content]");
  if (!content) return;
  if (documentsActiveTab === "cadastro") content.innerHTML = documentsRegistrationHtml();
  if (documentsActiveTab === "lista-mestra") content.innerHTML = documentsMasterHtml();
  if (documentsActiveTab === "externos") content.innerHTML = documentsExternalHtml();
  if (documentsActiveTab === "indicadores") content.innerHTML = documentsIndicatorsHtml();
  bindDocumentsActions();
  if (documentsActiveTab === "indicadores") renderDocumentsCharts();
  if (focus?.key) {
    const field = content.querySelector(`[data-doc-filter="${focus.key}"]`);
    if (field instanceof HTMLInputElement) {
      field.focus({ preventScroll: true });
      const start = Math.min(focus.start ?? field.value.length, field.value.length);
      const end = Math.min(focus.end ?? start, field.value.length);
      field.setSelectionRange(start, end);
    }
  }
}

function documentsRegistrationHtml() {
  const disabled = canEditModule("documentos") ? "" : "disabled";
  const people = documentOptions(documentPeople(), currentUser?.name || "");
  return `<section class="documents-panel"><header class="documents-panel-head"><div><h2>Cadastro de documento</h2><p>Ao salvar, o documento entra na Lista Mestra aguardando aprovação.</p></div></header><form class="documents-form" data-doc-registration>
    <div class="documents-section-label">Identificação</div>
    <div class="documents-grid"><label class="documents-field"><span class="documents-field-label">Código</span><input class="input-basic" name="code" placeholder="Ex.: PR-QUA-002" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Descrição</span><input class="input-basic" name="title" placeholder="Título / descrição do documento" ${disabled}></label></div>
    <div class="documents-grid"><label class="documents-field"><span class="documents-field-label">Tipo</span><select class="input-basic" name="type" data-doc-type ${disabled}>${documentOptions(documentTypes, "Procedimento")}</select></label><label class="documents-field" data-doc-other-type hidden><span class="documents-field-label">Especifique o tipo</span><input class="input-basic" name="otherType" ${disabled}></label></div>
    <div class="documents-grid three"><label class="documents-field"><span class="documents-field-label">Revisão</span><input class="input-basic" name="version" placeholder="Ex.: 01" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Data da revisão</span><input class="input-basic" name="revisionDate" type="date" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Data da elaboração</span><input class="input-basic" name="elaborationDate" type="date" value="${documentToday()}" ${disabled}></label></div>
    <div class="documents-grid"><label class="documents-field"><span class="documents-field-label">Elaborado por</span><select class="input-basic" name="owner" ${disabled}>${people}</select></label><label class="documents-field"><span class="documents-field-label">Setor</span><input class="input-basic" name="sector" placeholder="Ex.: Qualidade" ${disabled}></label></div>
    <div class="documents-section-label">Controle e retenção</div>
    <div class="documents-grid three"><label class="documents-field"><span class="documents-field-label">Período para revisão</span><select class="input-basic" name="revisionPeriod" ${disabled}>${documentOptions(["90 dias", "180 dias", "360 dias"], "360 dias")}</select></label><label class="documents-field"><span class="documents-field-label">Disposição</span><select class="input-basic" name="disposition" ${disabled}>${documentOptions(["Físico", "Digital", "Digital/Físico"], "Digital")}</select></label><label class="documents-field"><span class="documents-field-label">Período de retenção</span><select class="input-basic" name="retention" ${disabled}>${documentOptions(["Mantido", "2 anos", "3 anos", "5 anos"], "Mantido")}</select></label></div>
    <div class="documents-grid"><label class="documents-field"><span class="documents-field-label">Local de retenção</span><input class="input-basic" name="retentionLocation" placeholder="Ex.: QualityPro Cloud / Arquivo físico" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Cópia controlada</span><select class="input-basic" name="controlledCopy" data-doc-copy ${disabled}>${documentOptions(["Não", "Sim"], "Não")}</select></label></div>
    <div class="documents-conditional" data-doc-copy-fields hidden><div class="documents-grid three"><label class="documents-field"><span class="documents-field-label">Setor</span><input class="input-basic" name="copySector" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Responsável</span><select class="input-basic" name="copyOwner" ${disabled}>${people}</select></label><label class="documents-field"><span class="documents-field-label">Data da entrega</span><input class="input-basic" name="copyDate" type="date" ${disabled}></label></div></div>
    <div class="documents-section-label">Anexo e aprovação</div>
    ${documentsUploadHtml("registration", disabled)}
    <div class="documents-grid"><label class="documents-field"><span class="documents-field-label">Aprovador</span><select class="input-basic" name="approver" ${disabled}>${people}</select></label><label class="documents-field"><span class="documents-field-label">Cargo do aprovador</span><input class="input-basic" name="approverRole" placeholder="Ex.: Diretor Geral" ${disabled}></label></div>
    <div class="documents-actions">${canEditModule("documentos") ? `<button class="documents-action-button" type="reset">Limpar</button><button class="documents-action-button primary" type="submit">${moduleIcon("save")} Salvar</button>` : `<span class="documents-approval-note">Seu perfil possui acesso somente para visualização.</span>`}</div>
  </form></section>`;
}

function documentsUploadHtml(scope, disabled = "") { return `<label class="documents-field full"><span class="documents-field-label">Anexo</span><span class="documents-upload"><label class="documents-action-button" type="button">${moduleIcon("paperclip")} Escolher anexo<input type="file" data-doc-file="${scope}" ${disabled}></label><span class="documents-upload-name" data-doc-file-name="${scope}">Nenhum arquivo selecionado</span><button class="documents-action-button documents-upload-remove" type="button" data-doc-file-remove="${scope}" hidden title="Remover anexo">${moduleIcon("trash")}</button></span></label>`; }

function documentsMasterHtml() {
  const rows = documentsInternal(); const types = [...new Set(rows.map((row) => row.type || "Outro"))]; const sectors = [...new Set(rows.map((row) => row.sector).filter(Boolean))];
  const filtered = rows.filter((row) => (!documentsFilters.type || row.type === documentsFilters.type) && (!documentsFilters.sector || row.sector === documentsFilters.sector) && (!documentsFilters.status || documentEffectiveStatus(row) === documentsFilters.status) && (!documentsFilters.search || `${row.code} ${row.title}`.toLowerCase().includes(documentsFilters.search.toLowerCase())));
  return `${documentsFilterHtml(types, sectors)}<section class="documents-panel"><header class="documents-panel-head"><div><h2>Lista Mestra de Documentos</h2><p>${filtered.length} documento(s) · documentos internos do SGQ</p></div>${canEditModule("documentos") ? `<button class="documents-action-button primary" type="button" data-doc-tab-jump="cadastro">${moduleIcon("plus")} Novo documento</button>` : ""}</header><div class="documents-table-wrap"><table class="documents-table"><thead><tr><th>Código</th><th>Descrição</th><th>Tipo</th><th>Revisão</th><th>Data da revisão</th><th>Setor</th><th>Status</th><th>Ações</th></tr></thead><tbody>${filtered.length ? filtered.map((row) => `<tr><td class="documents-code">${escapeHtml(row.code)}</td><td class="documents-description">${escapeHtml(row.title)}</td><td><span class="documents-chip">${escapeHtml(row.type === "Outro" ? row.otherType || "Outro" : row.type || "-")}</span></td><td class="documents-code">${escapeHtml(row.version || "-")}</td><td>${documentDate(row.revisionDate)}</td><td>${escapeHtml(row.sector || "-")}</td><td>${documentStatusHtml(row)}</td><td>${documentsRowActionsHtml(row)}</td></tr>`).join("") : `<tr><td colspan="8" class="documents-empty">Nenhum documento encontrado.</td></tr>`}</tbody></table></div></section>`;
}

function documentsFilterHtml(types, sectors) { return `<div class="documents-filters"><label class="documents-field"><span class="documents-field-label">Tipo</span><select class="input-basic" data-doc-filter="type">${documentOptions(types, documentsFilters.type, "Todos")}</select></label><label class="documents-field"><span class="documents-field-label">Setor</span><select class="input-basic" data-doc-filter="sector">${documentOptions(sectors, documentsFilters.sector, "Todos")}</select></label><label class="documents-field"><span class="documents-field-label">Status</span><select class="input-basic" data-doc-filter="status">${documentOptions(documentStatuses, documentsFilters.status, "Todos")}</select></label><label class="documents-field"><span class="documents-field-label">Busca livre</span><input class="input-basic" data-doc-filter="search" value="${escapeHtml(documentsFilters.search)}" placeholder="Código, descrição..."></label><button class="documents-action-button documents-filter-clear" type="button" data-doc-clear-filters>Limpar</button></div>`; }
function documentsRowActionsHtml(row) { return `<div class="documents-row-actions">${canEditModule("documentos") ? `<button class="documents-action-button" type="button" data-doc-edit="${escapeHtml(row.id)}" title="Editar documento">${moduleIcon("edit")}</button><button class="documents-action-button" type="button" data-doc-delete="${escapeHtml(row.id)}" title="Excluir documento">${moduleIcon("trash")}</button>` : `<button class="documents-action-button" type="button" data-doc-view="${escapeHtml(row.id)}" title="Ver documento">${moduleIcon("external")}</button>`}</div>`; }

function documentsExternalHtml() {
  const rows = documentsExternal();
  return `<section class="documents-panel"><header class="documents-panel-head"><div><h2>Documentos Externos</h2><p>${rows.length} documento(s) de origem externa · controle de proveniência e verificação</p></div>${canEditModule("documentos") ? `<button class="documents-action-button primary" type="button" data-doc-new-external>${moduleIcon("plus")} Novo documento externo</button>` : ""}</header><div class="documents-table-wrap"><table class="documents-table"><thead><tr><th>Código</th><th>Descrição</th><th>Origem</th><th>Rev.</th><th>Data rev.</th><th>Setor</th><th>Últ. verif.</th><th>Próx. verif.</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows.length ? rows.map((row) => `<tr><td class="documents-code">${escapeHtml(row.code)}</td><td class="documents-description">${escapeHtml(row.title)}</td><td>${escapeHtml(row.source || "-")}${row.sourceDetail ? ` · ${escapeHtml(row.sourceDetail)}` : ""}</td><td class="documents-code">${escapeHtml(row.version || "-")}</td><td>${documentDate(row.revisionDate)}</td><td>${escapeHtml(row.sector || "-")}</td><td>${documentDate(row.lastVerification)}</td><td>${documentDate(row.nextVerification)}</td><td>${documentStatusHtml(row)}</td><td>${documentsRowActionsHtml(row)}</td></tr>`).join("") : `<tr><td colspan="10" class="documents-empty">Nenhum documento externo cadastrado.</td></tr>`}</tbody></table></div></section>`;
}

function documentsIndicatorsHtml() { return `<section class="documents-charts"><article class="documents-chart"><h3>Documentos internos por status</h3><p>Lista Mestra · distribuição por situação</p><canvas id="documentsStatusChart"></canvas></article><article class="documents-chart"><h3>Documentos externos por status</h3><p>Controle de proveniência e verificação</p><canvas id="documentsExternalChart"></canvas></article><article class="documents-chart"><h3>Internos por tipo</h3><p>Distribuição por tipo de documento</p><canvas id="documentsTypeChart"></canvas></article><article class="documents-chart"><h3>Externos por origem</h3><p>Origem controlada dos documentos externos</p><canvas id="documentsSourceChart"></canvas></article><article class="documents-chart wide"><h3>Documentos por setor</h3><p>Internos e externos combinados</p><canvas id="documentsSectorChart"></canvas></article></section>`; }

function documentCount(rows, key) { return Object.entries(rows.reduce((result, row) => { const value = key(row) || "Não informado"; result[value] = (result[value] || 0) + 1; return result; }, {})); }
function renderDocumentsCharts() {
  if (typeof Chart === "undefined") return;
  Object.values(documentsCharts).forEach((chart) => chart.destroy()); documentsCharts = {};
  const colors = ["#34d399", "#fbbf24", "#46d9f5", "#f87171", "#a78bfa", "#4fa3ff"];
  const theme = getComputedStyle(document.body);
  const panel = theme.getPropertyValue("--bg-panel").trim() || "#0b1526";
  const muted = theme.getPropertyValue("--text-secondary").trim() || "#8b98ab";
  const line = theme.getPropertyValue("--border-subtle").trim() || "rgba(255,255,255,.08)";
  const make = (id, type, entries) => { const canvas = document.getElementById(id); if (!canvas) return; const doughnut = type === "doughnut"; const labels = entries.map(([label]) => label); const values = entries.map(([, value]) => value); const design = doughnut ? window.QualityProDoughnut?.decorate(canvas, { labels, values, colors }) : null; documentsCharts[id] = new Chart(canvas, { type, data: { labels, datasets: [{ data: values, backgroundColor: design?.dataset.backgroundColor || colors, borderColor: design?.dataset.borderColor || panel, borderWidth: design?.dataset.borderWidth ?? 2, borderRadius: design?.dataset.borderRadius ?? (type === "bar" ? 5 : 0), spacing: design?.dataset.spacing, hoverOffset: design?.dataset.hoverOffset }] }, options: { responsive: true, maintainAspectRatio: false, ...(design?.options || {}), plugins: design?.options.plugins || { legend: { position: "bottom", labels: { color: muted, boxWidth: 11, font: { size: 10 } } } }, scales: type === "bar" ? { x: { ticks: { color: muted, font: { size: 10 } }, grid: { color: line } }, y: { beginAtZero: true, ticks: { precision: 0, color: muted }, grid: { color: line } } } : {} } }); if (design) design.bind(documentsCharts[id]); };
  make("documentsStatusChart", "doughnut", documentCount(documentsInternal(), documentEffectiveStatus));
  make("documentsExternalChart", "doughnut", documentCount(documentsExternal(), documentEffectiveStatus));
  make("documentsTypeChart", "bar", documentCount(documentsInternal(), (row) => row.type));
  make("documentsSourceChart", "bar", documentCount(documentsExternal(), (row) => row.source));
  make("documentsSectorChart", "bar", documentCount([...documentsInternal(), ...documentsExternal()], (row) => row.sector));
}

function bindDocumentsActions() {
  pageContent.querySelectorAll("[data-doc-tab]").forEach((button) => button.addEventListener("click", () => { documentsActiveTab = button.dataset.docTab; renderDocumentsModule(); }));
  pageContent.querySelectorAll("[data-doc-tab-jump]").forEach((button) => button.addEventListener("click", () => { documentsActiveTab = button.dataset.docTabJump; renderDocumentsModule(); }));
  pageContent.querySelectorAll("[data-doc-filter]").forEach((field) => field.addEventListener(field.tagName === "INPUT" ? "input" : "change", () => {
    documentsFilters[field.dataset.docFilter] = field.value;
    renderDocumentsTab(field instanceof HTMLInputElement ? { key: field.dataset.docFilter, start: field.selectionStart, end: field.selectionEnd } : null);
  }));
  pageContent.querySelector("[data-doc-clear-filters]")?.addEventListener("click", () => { documentsFilters = { type: "", sector: "", status: "", search: "" }; renderDocumentsTab(); });
  pageContent.querySelector("[data-doc-type]")?.addEventListener("change", (event) => { pageContent.querySelector("[data-doc-other-type]").hidden = event.target.value !== "Outro"; });
  pageContent.querySelector("[data-doc-copy]")?.addEventListener("change", (event) => { pageContent.querySelector("[data-doc-copy-fields]").hidden = event.target.value !== "Sim"; });
  pageContent.querySelector("[data-doc-registration]")?.addEventListener("submit", saveNewDocument);
  pageContent.querySelectorAll("[data-doc-edit], [data-doc-view]").forEach((button) => button.addEventListener("click", () => openDocumentEditor(button.dataset.docEdit || button.dataset.docView, Boolean(button.dataset.docView))));
  pageContent.querySelectorAll("[data-doc-delete]").forEach((button) => button.addEventListener("click", () => deleteDocument(button.dataset.docDelete)));
  pageContent.querySelector("[data-doc-new-external]")?.addEventListener("click", () => openDocumentEditor("", false, "external"));
  bindDocumentFilePicker(pageContent);
}

function bindDocumentFilePicker(scope) { scope.querySelectorAll("[data-doc-file]").forEach((input) => input.addEventListener("change", () => { const file = input.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { input.value = ""; toast("O anexo deve ter no máximo 5 MB."); return; } const name = scope.querySelector(`[data-doc-file-name="${input.dataset.docFile}"]`); if (name) name.textContent = file.name; scope.querySelector(`[data-doc-file-remove="${input.dataset.docFile}"]`)?.removeAttribute("hidden"); })); scope.querySelectorAll("[data-doc-file-remove]").forEach((button) => button.addEventListener("click", () => { const key = button.dataset.docFileRemove; const input = scope.querySelector(`[data-doc-file="${key}"]`); if (input) input.value = ""; const name = scope.querySelector(`[data-doc-file-name="${key}"]`); if (name) name.textContent = "Nenhum arquivo selecionado"; button.hidden = true; })); }

async function saveNewDocument(event) {
  event.preventDefault(); if (!canEditModule("documentos")) return;
  const form = event.currentTarget; const value = (name) => String(new FormData(form).get(name) || "").trim();
  if (!value("code") || !value("title")) return void toast("Informe o código e a descrição do documento.");
  const input = form.querySelector('[data-doc-file="registration"]'); const previous = structuredClone(state.documents);
  state.documents.push({ id: documentNewId("internal"), kind: "internal", code: value("code"), title: value("title"), type: value("type"), otherType: value("otherType"), version: value("version"), revisionDate: value("revisionDate"), elaborationDate: value("elaborationDate"), owner: value("owner"), sector: value("sector"), revisionPeriod: value("revisionPeriod"), disposition: value("disposition"), retention: value("retention"), retentionLocation: value("retentionLocation"), controlledCopy: value("controlledCopy"), copySector: value("copySector"), copyOwner: value("copyOwner"), copyDate: value("copyDate"), approver: value("approver"), approverRole: value("approverRole"), attachmentName: input?.files?.[0]?.name || "", status: "Aguardando Aprovação" });
  if (!(await saveDocuments("Documento salvo e enviado para aprovação."))) { state.documents = previous; return; }
  const savedDocument = state.documents.at(-1);
  documentsActiveTab = "lista-mestra";
  renderDocumentsModule();
  openDocumentApproval(savedDocument);
}

function documentEditorFields(row, readOnly) {
  const external = row.kind === "external"; const disabled = readOnly || !canEditModule("documentos") ? "disabled" : ""; const people = documentOptions(documentPeople(), row.owner || ""); const sectorOptions = documentCompanySectorOptions(row.sector || ""); const copySectorOptions = documentCompanySectorOptions(row.copySector || "");
  return `<div class="documents-grid"><label class="documents-field"><span class="documents-field-label">Código</span><input class="input-basic" name="code" value="${escapeHtml(row.code)}" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Descrição</span><input class="input-basic" name="title" value="${escapeHtml(row.title)}" ${disabled}></label></div>
  <div class="documents-grid three"><label class="documents-field"><span class="documents-field-label">${external ? "Origem" : "Tipo"}</span><select class="input-basic" name="${external ? "source" : "type"}" ${disabled}>${documentOptions(external ? documentExternalSources : documentTypes, external ? row.source || "ABNT" : row.type || "Procedimento")}</select></label><label class="documents-field"><span class="documents-field-label">${external ? "Origem detalhada" : "Revisão"}</span><input class="input-basic" name="${external ? "sourceDetail" : "version"}" value="${escapeHtml(external ? row.sourceDetail || "" : row.version || "")}" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Data da revisão</span><input class="input-basic" name="revisionDate" type="date" value="${escapeHtml(row.revisionDate || "")}" ${disabled}></label></div>
  ${external ? `<div class="documents-grid three"><label class="documents-field"><span class="documents-field-label">Última verificação</span><input class="input-basic" name="lastVerification" type="date" value="${escapeHtml(row.lastVerification || "")}" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Próxima verificação</span><input class="input-basic" name="nextVerification" type="date" value="${escapeHtml(row.nextVerification || "")}" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Status</span><select class="input-basic" name="status" ${disabled}>${documentOptions(documentStatuses, row.status || "Vigente")}</select></label></div>` : `<div class="documents-grid three"><label class="documents-field"><span class="documents-field-label">Data da elaboração</span><input class="input-basic" name="elaborationDate" type="date" value="${escapeHtml(row.elaborationDate || "")}" ${disabled}></label><label class="documents-field"><span class="documents-field-label">Período para revisão</span><select class="input-basic" name="revisionPeriod" ${disabled}>${documentOptions(["90 dias", "180 dias", "360 dias"], row.revisionPeriod || "360 dias")}</select></label><label class="documents-field"><span class="documents-field-label">Status</span><select class="input-basic" name="status" ${disabled}>${documentOptions(documentStatuses, row.status || "Aguardando Aprovação")}</select></label></div>`}
  <div class="documents-grid"><label class="documents-field"><span class="documents-field-label">${external ? "Setor responsável" : "Elaborado por"}</span>${external ? `<select class="input-basic" name="sector" ${disabled}>${sectorOptions}</select>` : `<select class="input-basic" name="owner" ${disabled}>${people}</select>`}</label><label class="documents-field"><span class="documents-field-label">${external ? "Local de armazenamento" : "Setor"}</span>${external ? `<input class="input-basic" name="storageLocation" value="${escapeHtml(row.storageLocation || "")}" ${disabled}>` : `<input class="input-basic" name="sector" value="${escapeHtml(row.sector || "")}" ${disabled}>`}</label></div>
  <div class="documents-section-label">Controle e distribuição</div>
  <div class="documents-grid three"><label class="documents-field"><span class="documents-field-label">Disposição</span><select class="input-basic" name="disposition" ${disabled}>${documentOptions(["Físico", "Digital", "Digital/Físico"], row.disposition || "Digital")}</select></label><label class="documents-field"><span class="documents-field-label">${external ? "Data de recebimento" : "Período de retenção"}</span>${external ? `<input class="input-basic" name="receivedAt" type="date" value="${escapeHtml(row.receivedAt || "")}" ${disabled}>` : `<select class="input-basic" name="retention" ${disabled}>${documentOptions(["Mantido", "2 anos", "3 anos", "5 anos"], row.retention || "Mantido")}</select>`}</label><label class="documents-field"><span class="documents-field-label">Cópia controlada</span><select class="input-basic" name="controlledCopy" ${disabled}>${documentOptions(["Não", "Sim"], row.controlledCopy || "Não")}</select></label></div>
  <div class="documents-grid three"><label class="documents-field"><span class="documents-field-label">Setor</span>${external ? `<select class="input-basic" name="copySector" ${disabled}>${copySectorOptions}</select>` : `<input class="input-basic" name="copySector" value="${escapeHtml(row.copySector || "")}" ${disabled}>`}</label><label class="documents-field"><span class="documents-field-label">Responsável da cópia</span><select class="input-basic" name="copyOwner" ${disabled}>${documentOptions(documentPeople(), row.copyOwner || "")}</select></label><label class="documents-field"><span class="documents-field-label">Data da entrega</span><input class="input-basic" name="copyDate" type="date" value="${escapeHtml(row.copyDate || "")}" ${disabled}></label></div>
  ${documentsUploadHtml("editor", disabled)}
  ${!external ? `<div class="documents-grid"><label class="documents-field"><span class="documents-field-label">Aprovador</span><select class="input-basic" name="approver" ${disabled}>${documentOptions(documentPeople(), row.approver || "")}</select></label><label class="documents-field"><span class="documents-field-label">Cargo do aprovador</span><input class="input-basic" name="approverRole" value="${escapeHtml(row.approverRole || "")}" ${disabled}></label></div>` : ""}`;
}

function openDocumentEditor(id, readOnly = false, kind = "") {
  ensureDocumentsData(); const existing = state.documents.find((row) => row.id === id); const row = existing || { id: "", kind: kind || "internal", code: "", title: "", source: "ABNT", disposition: "Digital", status: kind === "external" ? "Vigente" : "Aguardando Aprovação" };
  const mount = document.querySelector("#documentsModalMount"); if (!mount) return;
  const label = row.kind === "external" ? "Documento externo" : "Documento";
  mount.innerHTML = `<div class="documents-modal-overlay" data-doc-modal><form class="documents-modal-card" data-doc-editor><header class="documents-panel-head"><div><h2>${existing ? `${escapeHtml(row.code)} · ${escapeHtml(row.title)}` : `Novo ${label.toLowerCase()}`}</h2><p>${row.kind === "external" ? "Documentos externos de origem controlada" : "Lista Mestra · documento interno"}</p></div><button class="documents-action-button" type="button" data-doc-modal-close title="Fechar">${moduleIcon("close")}</button></header><input type="hidden" name="id" value="${escapeHtml(row.id)}"><input type="hidden" name="kind" value="${escapeHtml(row.kind)}">${documentEditorFields(row, readOnly)}<div class="documents-actions">${readOnly ? "" : `<button class="documents-action-button" type="button" data-doc-modal-close>Cancelar</button>${row.kind === "internal" && row.status === "Aguardando Aprovação" ? `<button class="documents-action-button warning" type="button" data-doc-approve="${escapeHtml(row.id)}">${moduleIcon("check-circle")} Aprovar</button>` : ""}<button class="documents-action-button primary" type="submit">${moduleIcon("save")} Salvar</button>`}</div></form></div>`;
  const name = mount.querySelector('[data-doc-file-name="editor"]'); if (name && row.attachmentName) name.textContent = row.attachmentName;
  if (row.attachmentName) mount.querySelector('[data-doc-file-remove="editor"]')?.removeAttribute("hidden");
  bindDocumentFilePicker(mount); mount.querySelectorAll("[data-doc-modal-close]").forEach((button) => button.addEventListener("click", closeDocumentModal)); mount.querySelector("[data-doc-modal]")?.addEventListener("click", (event) => { if (event.target.matches("[data-doc-modal]")) closeDocumentModal(); }); mount.querySelector("[data-doc-editor]")?.addEventListener("submit", saveDocumentEditor); mount.querySelector("[data-doc-approve]")?.addEventListener("click", () => approveDocument(row.id));
}
function closeDocumentModal() { const mount = document.querySelector("#documentsModalMount"); if (mount) mount.innerHTML = ""; }

async function saveDocumentEditor(event) {
  event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const id = String(values.get("id") || ""); const index = state.documents.findIndex((row) => row.id === id); const oldRows = structuredClone(state.documents); const field = (name) => String(values.get(name) || "").trim();
  if (!field("code") || !field("title")) return void toast("Informe o código e a descrição do documento.");
  const existing = index >= 0 ? state.documents[index] : {}; const input = form.querySelector('[data-doc-file="editor"]'); const kind = field("kind") || "internal";
  const next = { ...existing, id: id || documentNewId(kind), kind, code: field("code"), title: field("title"), revisionDate: field("revisionDate"), sector: field("sector"), status: field("status"), attachmentName: input?.files?.[0]?.name || existing.attachmentName || "" };
  Object.assign(next, { disposition: field("disposition"), controlledCopy: field("controlledCopy"), copySector: field("copySector"), copyOwner: field("copyOwner"), copyDate: field("copyDate") });
  if (kind === "external") Object.assign(next, { source: field("source"), sourceDetail: field("sourceDetail"), version: field("version"), lastVerification: field("lastVerification"), nextVerification: field("nextVerification"), storageLocation: field("storageLocation"), receivedAt: field("receivedAt") });
  else Object.assign(next, { type: field("type"), version: field("version"), elaborationDate: field("elaborationDate"), revisionPeriod: field("revisionPeriod"), retention: field("retention"), owner: field("owner"), approver: field("approver"), approverRole: field("approverRole") });
  if (index >= 0) state.documents[index] = next; else state.documents.push(next);
  if (!(await saveDocuments("Documento atualizado."))) { state.documents = oldRows; return; }
  closeDocumentModal(); renderDocumentsModule();
}

async function approveDocument(id) { const row = state.documents.find((item) => item.id === id); if (!row) return; const previous = row.status; row.status = "Vigente"; if (!(await saveDocuments("Documento aprovado e marcado como vigente."))) { row.status = previous; return; } closeDocumentModal(); renderDocumentsModule(); }
async function deleteDocument(id) { const row = state.documents.find((item) => item.id === id); if (!row || !window.confirm(`Excluir ${row.code || "este documento"}?`)) return; const previous = structuredClone(state.documents); state.documents = state.documents.filter((item) => item.id !== id); if (!(await saveDocuments("Documento excluído."))) { state.documents = previous; return; } renderDocumentsModule(); }
function openDocumentApproval(row) { const mount = document.querySelector("#documentsModalMount"); if (!mount) return; mount.innerHTML = `<div class="documents-modal-overlay" data-doc-modal><section class="documents-modal-card"><header class="documents-panel-head"><div><h2>Documento enviado para aprovação</h2><p>Fluxo de aprovação registrado no módulo.</p></div><button class="documents-action-button" type="button" data-doc-modal-close>${moduleIcon("close")}</button></header><p class="documents-approval-note">${escapeHtml(row.code)} foi registrado como <strong>Aguardando Aprovação</strong> e será acompanhado pelo aprovador ${escapeHtml(row.approver || "definido no cadastro")}.</p><div class="documents-actions"><button class="documents-action-button primary" type="button" data-doc-modal-close>Fechar</button></div></section></div>`; mount.querySelectorAll("[data-doc-modal-close]").forEach((button) => button.addEventListener("click", closeDocumentModal)); }
