function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

async function sendEmail({ to, subject, html, tag, idempotencyKey }) {
  const apiKey = process.env.RESEND_API_KEY || "";
  const from = process.env.EMAIL_FROM || process.env.PASSWORD_RESET_FROM || "";
  const recipients = (Array.isArray(to) ? to : [to]).filter(isEmail);
  if (!apiKey || !from || !recipients.length) return { status: "not_configured" };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = String(idempotencyKey).slice(0, 256);

  const response = await fetch("https://api.resend.com/emails", {
    signal: AbortSignal.timeout(15000),
    method: "POST",
    headers,
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      html,
      ...(tag ? { tags: [{ name: "type", value: tag }] } : {}),
    }),
  });
  if (response.ok) return { status: "sent", id: (await response.json().catch(() => ({}))).id || "" };
  return { status: "failed", code: response.status };
}

function button(label, href) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 18px;background:#2188f5;color:#fff;text-decoration:none;border-radius:6px;font-weight:700">${escapeHtml(label)}</a>`;
}

function emailShell(title, content) {
  return `
    <div style="background:#07101f;padding:32px 16px;font-family:Arial,sans-serif;color:#e8eef8">
      <div style="max-width:620px;margin:0 auto;background:#0d192b;border:1px solid #203451;border-radius:8px;padding:28px">
        <div style="color:#43d8f5;font-size:12px;font-weight:700;letter-spacing:1px">QUALITYPRO CLOUD</div>
        <h1 style="font-size:24px;margin:10px 0 18px;color:#fff">${escapeHtml(title)}</h1>
        ${content}
        <p style="margin-top:26px;color:#91a2bc;font-size:12px">Mensagem automática do SGQ Online.</p>
      </div>
    </div>`;
}

function passwordResetEmail(link) {
  return emailShell(
    "Redefinição de senha",
    `<p>Recebemos uma solicitação para redefinir sua senha.</p>
     <p style="margin:22px 0">${button("Criar nova senha", link)}</p>
     <p style="color:#aebbd0">O link expira em 30 minutos e só pode ser usado uma vez.</p>`,
  );
}

function invitationEmail({ name, companyName, inviterName, link }) {
  return emailShell(
    "Você foi convidado para o SGQ Online",
    `<p>Olá, <strong>${escapeHtml(name)}</strong>.</p>
     <p>${escapeHtml(inviterName || "O administrador")} liberou seu acesso aos dados de <strong>${escapeHtml(companyName)}</strong>.</p>
     <p style="margin:22px 0">${button("Aceitar convite e criar senha", link)}</p>
     <p style="color:#aebbd0">O convite expira em 48 horas e só pode ser usado uma vez.</p>`,
  );
}

function meetingInvitationEmail({ recipientName, companyName, organizerName, meetingDate, startTime, endTime, location, description }) {
  return emailShell(
    `Convite para reunião - ${companyName}`,
    `<p>Olá, <strong>${escapeHtml(recipientName)}</strong>.</p>
     <p>Você foi selecionado(a) para participar de uma reunião estratégica da <strong>${escapeHtml(companyName)}</strong>.</p>
     <p><strong>Data:</strong> ${escapeHtml(meetingDate)}</p>
     <p><strong>Horário:</strong> ${escapeHtml(startTime || "Não informado")}${endTime ? ` às ${escapeHtml(endTime)}` : ""}</p>
     <p><strong>Local:</strong> ${escapeHtml(location || "Não informado")}</p>
     <p><strong>Responsável:</strong> ${escapeHtml(organizerName || "Direção")}</p>
     <p><strong>Pauta:</strong> ${escapeHtml(description || "A pauta será apresentada pela direção.")}</p>
     <p style="margin-top:22px">Sua participação é importante para o alinhamento das decisões e objetivos do Sistema de Gestão da Qualidade.</p>
     <p style="color:#aebbd0">Este é um convite informativo. Em caso de indisponibilidade, entre em contato com o responsável pela reunião.</p>`,
  );
}

function deadlineAlertEmail({ companyName, items }) {
  const rows = items
    .slice(0, 20)
    .map((item) => `<li style="margin:8px 0"><strong>${escapeHtml(item.label)}</strong> - ${escapeHtml(item.detail)}</li>`)
    .join("");
  return emailShell(
    `Pendências e prazos - ${companyName}`,
    `<p>O SGQ possui ${items.length} ${items.length === 1 ? "item que requer" : "itens que requerem"} atenção.</p>
     <ul style="padding-left:20px;color:#c8d3e4">${rows}</ul>
     ${items.length > 20 ? `<p>E mais ${items.length - 20} item(ns) no painel.</p>` : ""}`,
  );
}

function operationalAlertEmail({ title, component, message, occurredAt }) {
  return emailShell(
    title || "Alerta operacional",
    `<p>O monitoramento do SGQ Online detectou uma falha.</p>
     <p><strong>Componente:</strong> ${escapeHtml(component || "aplicação")}</p>
     <p><strong>Detalhe:</strong> ${escapeHtml(message || "Falha sem descrição")}</p>
     <p style="color:#aebbd0">Horário: ${escapeHtml(occurredAt || new Date().toISOString())}</p>`,
  );
}

module.exports = {
  deadlineAlertEmail,
  invitationEmail,
  isEmail,
  meetingInvitationEmail,
  operationalAlertEmail,
  passwordResetEmail,
  sendEmail,
};
