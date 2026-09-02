"use strict";
const feedback = document.querySelector("#feedback");
const form = document.querySelector("#response");
const thankYou = document.querySelector("#thank-you");
const fragment = location.hash.slice(1);
if (fragment) { sessionStorage.setItem("supplierRncToken", fragment); history.replaceState(null, "", location.pathname); }
const token = fragment || sessionStorage.getItem("supplierRncToken") || "";
const themeControl = document.querySelector("#theme");
const savedTheme = localStorage.getItem("supplierRncTheme") || "white";
themeControl.value = ["white", "light", "dark"].includes(savedTheme) ? savedTheme : "white";
function applyTheme() { document.body.dataset.theme = themeControl.value; localStorage.setItem("supplierRncTheme", themeControl.value); }
themeControl.onchange = applyTheme;
applyTheme();
const causes = [["metodo", "Método"], ["maquina", "Máquina"], ["maoObra", "Mão de obra"], ["material", "Material"], ["medicao", "Medição"], ["meioAmbiente", "Meio ambiente"]];
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const messages = {
  invalid_supplier_link: "Link inválido. Solicite um novo link à empresa.",
  supplier_link_unavailable: "Este link expirou ou a RNC não está mais disponível. Entre em contato com a empresa.",
  supplier_response_conflict: "A RNC foi atualizada enquanto você preenchia. Recarregue a página para consultar a versão mais recente antes de reenviar.",
  supplier_response_already_submitted: "Esta resposta já foi confirmada e não pode mais ser alterada por este link.",
  empty_supplier_response: "Preencha a análise de causa ou adicione uma ação corretiva.",
  incomplete_action: "Preencha descrição, prazo, responsável e status de cada ação.",
  evidence_limit: "Esta RNC atingiu o limite de 10 evidências.",
  invalid_evidence: "Arquivo inválido. Selecione um arquivo permitido de até 2 MB.",
};
let record;
let busy = false;
let ncEvidenceCleanup = () => {};
function notify(message, failed = false) { feedback.textContent = message; feedback.classList.toggle("error", failed); }
async function request(path = "", options = {}) {
  const response = await fetch(`/api/supplier-rnc${path}`, { ...options, credentials: "omit", headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}) } });
  if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(messages[result.error] || "Não foi possível concluir. Tente novamente."); }
  return response;
}
function lock(value) { busy = value; form.querySelectorAll("button, input, textarea, select").forEach((node) => { node.disabled = value; }); }
function addAction(action = {}) {
  const element = document.createElement("article");
  element.className = "action";
  element.dataset.id = action.id || "";
  element.evidenceIds = [...(action.evidenceIds || [])];
  const statuses = ["Em andamento", "Concluída"];
  if (action.status && !statuses.includes(action.status)) statuses.push(action.status);
  element.innerHTML = `<div class="action-heading"><strong>Ação corretiva</strong><button type="button" data-remove>Remover ação</button></div><label>Descrição da ação<textarea data-field="desc" maxlength="4000" required>${escape(action.desc)}</textarea></label><div class="action-fields"><label>Prazo<input data-field="prazo" maxlength="120" value="${escape(action.prazo)}" required></label><label>Responsável pela ação<input data-field="responsavel" maxlength="200" value="${escape(action.responsavel)}" required></label><label>Status<select data-field="status" aria-label="Status" required><option value="">Selecione...</option>${statuses.map((status) => `<option value="${escape(status)}" ${status === action.status ? "selected" : ""}>${escape(status)}</option>`).join("")}</select></label></div><label>Evidências da ação<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.xls,.xlsx,.doc,.docx"><small>Até 2 MB por arquivo. Máximo de 10 arquivos por RNC.</small></label><ul class="files"></ul>`;
  const deadline = element.querySelector('[data-field="prazo"]');
  const deadlineControl = document.createElement("span");
  deadlineControl.className = "deadline-control";
  deadline.before(deadlineControl);
  const calendar = document.createElement("input");
  calendar.type = "date";
  calendar.className = "deadline-calendar";
  calendar.setAttribute("aria-label", "Escolher data do prazo");
  calendar.title = "Escolher data do prazo";
  deadlineControl.append(deadline, calendar);
  const syncCalendar = () => {
    const value = deadline.value.trim();
    const brazilianDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    calendar.value = brazilianDate ? `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}` : /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
  };
  syncCalendar();
  deadline.addEventListener("input", syncCalendar);
  calendar.addEventListener("change", () => {
    if (!calendar.value) return;
    const [year, month, day] = calendar.value.split("-");
    deadline.value = `${day}/${month}/${year}`;
    deadline.dispatchEvent(new Event("input", { bubbles: true }));
  });
  element.querySelector("[data-remove]").onclick = () => { if (confirm("Remover esta ação da resposta?")) element.remove(); };
  element.querySelector('input[type="file"]').onchange = async (event) => {
    const file = event.target.files[0];
    if (!file || busy) return;
    if (file.size > 2 * 1024 * 1024) { notify(messages.invalid_evidence, true); event.target.value = ""; return; }
    lock(true);
    try {
      const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); });
      const uploaded = await (await request("/evidence", { method: "POST", body: JSON.stringify({ name: file.name, base64 }) })).json();
      record.evidences.push(uploaded);
      element.evidenceIds.push(uploaded.id);
      renderFiles(element);
      notify("Evidência anexada. Salve a resposta para vinculá-la à ação.");
    } catch (error) { notify(error.message, true); }
    finally { lock(false); event.target.value = ""; }
  };
  document.querySelector("#actions").append(element);
  renderFiles(element);
}
function renderFiles(element) {
  const list = element.querySelector(".files");
  list.replaceChildren();
  for (const id of element.evidenceIds) {
    const file = record.evidences.find((item) => item.id === id);
    if (!file) continue;
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = file.name;
    button.onclick = async () => {
      try { const blob = await (await request(`/evidence/${encodeURIComponent(id)}`)).blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      catch (error) { notify(error.message, true); }
    };
    li.append(button); list.append(li);
  }
}
function renderNcEvidences() {
  ncEvidenceCleanup();
  const section = document.querySelector("#nc-evidences");
  const gallery = document.querySelector("#nc-evidence-gallery");
  gallery.replaceChildren();
  const files = record.ncEvidences || [];
  if (!files.length) { section.hidden = true; return; }
  section.hidden = false;
  const controller = new AbortController();
  const urls = [];
  const viewers = new Set();
  const closeViewer = (dialog, focusTarget) => {
    if (!dialog.isConnected) return;
    dialog.close(); dialog.remove(); viewers.delete(dialog);
    focusTarget?.focus();
  };
  ncEvidenceCleanup = () => {
    controller.abort();
    urls.forEach((url) => URL.revokeObjectURL(url));
    viewers.forEach((dialog) => { if (dialog.isConnected) { dialog.close(); dialog.remove(); } });
    viewers.clear();
  };
  for (const file of files) {
    const card = document.createElement("article");
    card.className = "nc-evidence-card";
    const button = document.createElement("button");
    button.type = "button"; button.className = "nc-evidence-thumb";
    button.setAttribute("aria-label", `Ampliar evidência ${file.name}`);
    button.title = `Ampliar ${file.name}`;
    const image = document.createElement("img");
    image.alt = file.name;
    button.append(image);
    const name = document.createElement("span"); name.className = "nc-evidence-name"; name.textContent = file.name;
    card.append(button, name); gallery.append(card);
    (async () => {
      try {
        const blob = await (await request(`/nc-evidence/${encodeURIComponent(file.id)}`, { signal: controller.signal })).blob();
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob); urls.push(url); image.src = url;
        button.onclick = () => {
          const dialog = document.createElement("dialog"); dialog.className = "supplier-nc-evidence-viewer";
          const close = document.createElement("button"); close.type = "button"; close.className = "viewer-close"; close.textContent = "Fechar";
          const enlarged = document.createElement("img"); enlarged.src = url; enlarged.alt = file.name;
          dialog.append(close, enlarged); document.body.append(dialog); viewers.add(dialog);
          close.onclick = () => closeViewer(dialog, button);
          dialog.addEventListener("click", (event) => { if (event.target === dialog) closeViewer(dialog, button); });
          dialog.showModal(); close.focus();
        };
      } catch (error) {
        if (!controller.signal.aborted) { card.remove(); if (!gallery.childElementCount) section.hidden = true; }
      }
    })();
  }
}
function render() {
  document.querySelector("#title").textContent = record.id;
  document.querySelector("#supplier").textContent = record.fornecedor;
  if (record.respondedAt) { showConfirmation(); return; }
  document.querySelector("#description").textContent = record.descricao;
  renderNcEvidences();
  document.querySelector("#causes").innerHTML = causes.map(([key, label]) => `<label>${label}<textarea name="${key}" maxlength="4000" rows="3">${escape(record.ishikawa[key])}</textarea></label>`).join("");
  form.elements.causaRaiz.value = record.ishikawa.causaRaiz;
  document.querySelector("#actions").replaceChildren();
  record.acoes.forEach(addAction);
  document.querySelector("#saved-at").textContent = record.respondedAt ? `Resposta salva em ${new Date(record.respondedAt).toLocaleString("pt-BR")}` : "";
  form.hidden = false;
  thankYou.hidden = true;
}
function showConfirmation() {
  const confirmedAt = record.respondedAt ? new Date(record.respondedAt) : new Date();
  document.querySelector("#confirmed-rnc").textContent = record.id;
  document.querySelector("#confirmed-at").textContent = confirmedAt.toLocaleString("pt-BR");
  form.hidden = true;
  ncEvidenceCleanup();
  thankYou.hidden = false;
  notify("Resposta salva e disponibilizada à empresa.");
  thankYou.scrollIntoView({ block: "start", behavior: "smooth" });
}
document.querySelector("#add-action").onclick = () => { if (document.querySelectorAll(".action").length < 30) addAction(); };
form.onsubmit = async (event) => {
  event.preventDefault();
  if (busy) return;
  const ishikawa = Object.fromEntries([...causes.map(([key]) => key), "causaRaiz"].map((key) => [key, form.elements[key].value.trim()]));
  const acoes = [...document.querySelectorAll(".action")].map((element) => ({ id: element.dataset.id || undefined, ...Object.fromEntries([...element.querySelectorAll("[data-field]")].map((input) => [input.dataset.field, input.value.trim()])), evidenceIds: element.evidenceIds }));
  lock(true);
  try { record = await (await request("", { method: "POST", body: JSON.stringify({ version: record.version, ishikawa, acoes }) })).json(); showConfirmation(); }
  catch (error) { notify(error.message, true); }
  finally { lock(false); }
};
(async () => { try { record = await (await request()).json(); render(); notify("RNC disponível para resposta."); } catch (error) { notify(error.message, true); } })();
window.addEventListener("pagehide", () => ncEvidenceCleanup());
