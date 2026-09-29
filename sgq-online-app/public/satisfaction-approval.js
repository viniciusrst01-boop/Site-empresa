"use strict";
const feedback = document.querySelector("#feedback");
const approvalPanel = document.querySelector("#approval");
const contestPanel = document.querySelector("#contest-panel");
const confirmation = document.querySelector("#confirmation");
const fragment = location.hash.slice(1);
if (fragment) { sessionStorage.setItem("satisfactionApprovalToken", fragment); history.replaceState(null, "", location.pathname); }
const token = fragment || sessionStorage.getItem("satisfactionApprovalToken") || "";
const theme = document.querySelector("#theme");
theme.value = ["white", "light", "dark"].includes(localStorage.getItem("satisfactionApprovalTheme")) ? localStorage.getItem("satisfactionApprovalTheme") : "white";
function applyTheme() { document.body.dataset.theme = theme.value; localStorage.setItem("satisfactionApprovalTheme", theme.value); }
theme.onchange = applyTheme; applyTheme();
const messages = { invalid_approval_link: "Link inválido. Solicite um novo link de aprovação.", approval_link_unavailable: "Este link expirou ou não está mais disponível.", approval_already_decided: "Esta solicitação já recebeu uma decisão.", invalid_approval_decision: "Informe as considerações para contestar a aprovação." };
let record; let busy = false;
function notify(message, failed = false) { feedback.textContent = message; feedback.classList.toggle("error", failed); }
function formatDate(value) { return value ? new Date(value).toLocaleString("pt-BR", { dateStyle:"medium", timeStyle:"short" }) : "-"; }
async function request(options = {}) { const response = await fetch("/api/satisfaction-approval", { ...options, credentials:"omit", headers:{ Authorization:`Bearer ${token}`, ...(options.body ? { "Content-Type":"application/json" } : {}) } }); if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(messages[data.error] || "Não foi possível concluir. Tente novamente."); } return response.json(); }
function lock(value) { busy = value; document.querySelectorAll("button, textarea, select").forEach((node) => { node.disabled = value; }); }
function showConfirmation(item) {
  approvalPanel.hidden = true; contestPanel.hidden = true; confirmation.hidden = false;
  const approved = item.status === "Aprovado";
  document.querySelector("#confirmation-title").textContent = approved ? "Formulário aprovado" : "Contestação enviada";
  document.querySelector("#confirmation-text").textContent = approved ? "A revisão foi aprovada e já está vigente no formulário de satisfação." : "Suas considerações foram encaminhadas ao responsável pelo formulário.";
  document.querySelector("#confirmed-version").textContent = `Rev. ${item.version}`;
  document.querySelector("#confirmed-at").textContent = formatDate(item.decidedAt);
  notify(item.delivery && item.delivery !== 'sent' ? 'Decisão registrada. O aviso por e-mail está pendente e será tentado novamente.' : approved ? "Aprovação registrada com sucesso." : "Contestação registrada com sucesso.");
}
function render(item) { record = item; document.querySelector("#subtitle").textContent = `Revisão ${item.version} enviada para ${item.approver}.`; document.querySelector("#version").textContent = `Formulário de satisfação — Rev. ${item.version}`; document.querySelector("#requested-by").textContent = item.requestedBy || "Não informado"; document.querySelector("#requested-at").textContent = formatDate(item.requestedAt); if (item.status !== "Pendente") { showConfirmation(item); return; } approvalPanel.hidden = false; notify("Analise a solicitação e registre sua decisão."); }
document.querySelector("#approve").onclick = async () => { if (busy || !confirm("Confirmar aprovação desta revisão?")) return; lock(true); try { showConfirmation(await request({ method:"POST", body:JSON.stringify({ decision:"approved" }) })); } catch (error) { notify(error.message, true); } finally { lock(false); } };
document.querySelector("#contest").onclick = () => { approvalPanel.hidden = true; contestPanel.hidden = false; document.querySelector("#considerations").focus(); };
document.querySelector("#cancel").onclick = () => { contestPanel.hidden = true; approvalPanel.hidden = false; };
document.querySelector("#send-contest").onclick = async () => { const considerations = document.querySelector("#considerations").value.trim(); if (!considerations) { notify(messages.invalid_approval_decision, true); return; } lock(true); try { showConfirmation(await request({ method:"POST", body:JSON.stringify({ decision:"contested", considerations }) })); } catch (error) { notify(error.message, true); } finally { lock(false); } };
(async () => { if (!token) { notify("Link de aprovação ausente.", true); return; } try { render(await request()); } catch (error) { notify(error.message, true); } })();
