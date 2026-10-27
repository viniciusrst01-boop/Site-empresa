const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const moduleLabels = {
  state: "Dados gerais",
  context: "Contexto da organização",
  risk: "Riscos e oportunidades",
  leadership: "Liderança e comprometimento",
  company: "Empresa",
  users: "Usuários",
  documents: "Documentos",
  audits: "Auditorias",
  ncs: "Não conformidades",
  notifications: "Notificações",
  settings: "Configurações",
  swot: "SWOT",
  partes: "Partes interessadas",
  escopo: "Escopo do SGQ",
  processos: "Processos",
  riscos: "Riscos e oportunidades",
  objetivos: "Objetivos da qualidade",
  mudancas: "Gestão de mudanças",
  acoes: "Ações da direção",
  politica: "Política da qualidade",
  comunicacao: "Comunicações",
  cargos: "Papéis e responsabilidades",
  posicionamento: "Posicionamento estratégico",
  plano: "Plano estratégico",
  indicadores: "Indicadores",
  delegacoes: "Delegações",
  aprovacoes: "Aprovações",
};

function labelFor(key) {
  return moduleLabels[key] || String(key || "Dados").replace(/[_-]+/g, " ");
}

function normalizeCellValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function flattenRecord(record, prefix = "", target = {}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return target;
  Object.entries(record).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenRecord(value, nextKey, target);
      return;
    }
    target[nextKey] = normalizeCellValue(value);
  });
  return target;
}

function collectTables(value, path = [], tables = []) {
  if (Array.isArray(value)) {
    if (!value.length) {
      tables.push({ path, rows: [] });
      return tables;
    }

    const rows = value.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? flattenRecord(item)
        : { valor: normalizeCellValue(item) },
    );
    tables.push({ path, rows });
    return tables;
  }

  if (!value || typeof value !== "object") {
    tables.push({ path, rows: [{ valor: normalizeCellValue(value) }] });
    return tables;
  }

  const scalarValues = {};
  Object.entries(value).forEach(([key, child]) => {
    if (Array.isArray(child)) {
      collectTables(child, [...path, key], tables);
    } else if (child && typeof child === "object") {
      const nestedHasArrays = Object.values(child).some(Array.isArray);
      if (nestedHasArrays) collectTables(child, [...path, key], tables);
      else Object.assign(scalarValues, flattenRecord({ [key]: child }));
    } else {
      scalarValues[key] = normalizeCellValue(child);
    }
  });

  if (Object.keys(scalarValues).length) {
    tables.unshift({ path, rows: [scalarValues] });
  }
  return tables;
}

function uniqueSheetName(workbook, path) {
  const base = (path.map(labelFor).join(" - ") || "Dados").slice(0, 31);
  let name = base;
  let suffix = 2;
  while (workbook.getWorksheet(name)) {
    const tail = ` ${suffix++}`;
    name = `${base.slice(0, 31 - tail.length)}${tail}`;
  }
  return name;
}

function styleWorksheet(sheet) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = sheet.rowCount > 1 ? `A1:${sheet.getColumn(sheet.columnCount).letter}1` : undefined;
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B5FA5" } };
  sheet.getRow(1).alignment = { vertical: "middle" };
  sheet.columns.forEach((column) => {
    let width = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      width = Math.max(width, Math.min(45, String(cell.value ?? "").length + 2));
      cell.alignment = { vertical: "top", wrapText: true };
    });
    column.width = width;
  });
}

function addTableWorksheet(workbook, path, rows) {
  const sheet = workbook.addWorksheet(uniqueSheetName(workbook, path));
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row || {}))));
  const safeColumns = columns.length ? columns : ["informação"];
  sheet.columns = safeColumns.map((key) => ({ header: labelFor(key), key }));
  rows.forEach((row) => sheet.addRow(row));
  styleWorksheet(sheet);
}

async function createExcelReport(payload) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "QualityPro Cloud";
  workbook.created = new Date();
  workbook.modified = new Date();

  const summary = workbook.addWorksheet("Resumo");
  summary.addRows([
    ["Relatório", "QualityPro Cloud - SGQ Online"],
    ["Empresa", payload.company?.name || ""],
    ["CNPJ", payload.company?.cnpj || ""],
    ["Certificação", payload.company?.certification || ""],
    ["Plano", payload.company?.plan || ""],
    ["Situação do plano", payload.company?.billingStatus || ""],
    ["Usuários", payload.users?.length || 0],
    ["Gerado em", new Date(payload.generatedAt).toLocaleString("pt-BR")],
  ]);
  summary.getColumn(1).font = { bold: true };
  summary.getColumn(1).width = 24;
  summary.getColumn(2).width = 55;

  addTableWorksheet(workbook, ["company"], [flattenRecord(payload.company || {})]);
  addTableWorksheet(
    workbook,
    ["users"],
    (payload.users || []).map((user) => flattenRecord(user)),
  );

  Object.entries(payload.modules || {}).forEach(([moduleKey, moduleValue]) => {
    const tables = collectTables(moduleValue, [moduleKey]);
    tables.forEach((table) => addTableWorksheet(workbook, table.path, table.rows));
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function ensurePdfSpace(doc, height = 80) {
  if (doc.y + height <= doc.page.height - doc.page.margins.bottom) return;
  doc.addPage();
}

function addPdfHeading(doc, text, level = 2) {
  ensurePdfSpace(doc, level === 1 ? 80 : 52);
  doc
    .fillColor(level === 1 ? "#0B5FA5" : "#111827")
    .font("Helvetica-Bold")
    .fontSize(level === 1 ? 18 : 12)
    .text(text, { continued: false });
  doc.moveDown(0.35);
}

function addPdfRecord(doc, row, index) {
  const flat = flattenRecord(row || {});
  ensurePdfSpace(doc, 54);
  doc.fillColor("#0B5FA5").font("Helvetica-Bold").fontSize(9).text(`Registro ${index + 1}`);
  Object.entries(flat).forEach(([key, value]) => {
    ensurePdfSpace(doc, 28);
    doc
      .fillColor("#374151")
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(`${labelFor(key)}: `, { continued: true })
      .font("Helvetica")
      .fillColor("#4B5563")
      .text(normalizeCellValue(value));
  });
  doc.moveDown(0.5);
}

function createPdfReport(payload) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 46, bufferPages: true, info: {
      Title: `Relatório SGQ - ${payload.company?.name || "Empresa"}`,
      Author: "QualityPro Cloud",
    } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#0B5FA5").font("Helvetica-Bold").fontSize(22).text("QualityPro Cloud");
    doc.fillColor("#111827").fontSize(17).text("Relatório do Sistema de Gestão da Qualidade");
    doc.moveDown(0.5);
    doc.fillColor("#4B5563").font("Helvetica").fontSize(10);
    doc.text(`Empresa: ${payload.company?.name || "-"}`);
    doc.text(`CNPJ: ${payload.company?.cnpj || "-"}`);
    doc.text(`Certificação: ${payload.company?.certification || "-"}`);
    doc.text(`Plano: ${payload.company?.plan || "-"} (${payload.company?.billingStatus || "-"})`);
    doc.text(`Gerado em: ${new Date(payload.generatedAt).toLocaleString("pt-BR")}`);

    addPdfHeading(doc, "Usuários e acessos", 1);
    (payload.users || []).forEach((user, index) => addPdfRecord(doc, user, index));

    Object.entries(payload.modules || {}).forEach(([moduleKey, moduleValue]) => {
      addPdfHeading(doc, labelFor(moduleKey), 1);
      const tables = collectTables(moduleValue, [moduleKey]);
      tables.forEach((table) => {
        addPdfHeading(doc, table.path.slice(1).map(labelFor).join(" - ") || "Resumo");
        if (!table.rows.length) {
          doc.fillColor("#6B7280").font("Helvetica").fontSize(9).text("Nenhum registro cadastrado.");
          doc.moveDown(0.5);
          return;
        }
        table.rows.forEach((row, index) => addPdfRecord(doc, row, index));
      });
    });

    const pages = doc.bufferedPageRange();
    for (let index = 0; index < pages.count; index += 1) {
      doc.switchToPage(index);
      doc
        .fillColor("#6B7280")
        .font("Helvetica")
        .fontSize(8)
        .text(
          `QualityPro Cloud | Página ${index + 1} de ${pages.count}`,
          46,
          doc.page.height - 32,
          { align: "center", width: doc.page.width - 92 },
        );
    }

    doc.end();
  });
}

function createStoreReportPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 40,
      bufferPages: true,
      info: { Title: `Relatório mensal da loja - ${report.month}`, Author: "QualityPro Solutions" },
    });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const contentWidth = doc.page.width - left - doc.page.margins.right;
    const bottom = () => doc.page.height - doc.page.margins.bottom - 24;
    const number = value => new Intl.NumberFormat("pt-BR").format(Number(value) || 0);
    const money = cents => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((Number(cents) || 0) / 100);
    const monthDate = new Date(`${report.month}-01T12:00:00.000Z`);
    const period = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthDate);
    const commerce = report.commerce || {};
    const traffic = report.traffic || {};
    const reviews = commerce.reviews || {};
    const distribution = Array.isArray(reviews.distribution) ? reviews.distribution : [];
    const products = Array.isArray(commerce.products) ? commerce.products : [];
    const pages = Array.isArray(traffic.topPages) ? traffic.topPages : [];
    const days = Array.isArray(traffic.days) ? traffic.days : [];

    function addHeader(title, subtitle) {
      doc.fillColor("#0B3556").roundedRect(left, 34, contentWidth, 72, 8).fill();
      doc.fillColor("#32D6EF").font("Helvetica-Bold").fontSize(9).text("QUALITYPRO SOLUTIONS", left + 16, 47);
      doc.fillColor("#FFFFFF").fontSize(20).text(title, left + 16, 63);
      doc.fillColor("#D8E6F4").font("Helvetica").fontSize(10).text(subtitle, left + 16, 88);
      doc.y = 121;
    }

    function addSection(title) {
      if (doc.y + 42 > bottom()) doc.addPage();
      doc.moveDown(0.45);
      doc.fillColor("#0B3556").font("Helvetica-Bold").fontSize(14).text(title, left, doc.y);
      const y = doc.y + 4;
      doc.moveTo(left, y).lineTo(left + contentWidth, y).strokeColor("#24A9D8").lineWidth(1).stroke();
      doc.y = y + 11;
    }

    function addTable(columns, rows) {
      const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
      const headerHeight = 24;
      const drawTableHeader = () => {
        const y = doc.y;
        doc.save().rect(left, y, tableWidth, headerHeight).fill("#0B5FA5").restore();
        let x = left;
        columns.forEach(column => {
          doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5)
            .text(column.label, x + 7, y + 7, { width: column.width - 14, height: headerHeight - 10 });
          x += column.width;
        });
        doc.y = y + headerHeight;
      };

      drawTableHeader();
      rows.forEach((row, rowIndex) => {
        const padding = 6;
        const heights = row.map((value, index) => {
          const column = columns[index];
          doc.font("Helvetica").fontSize(8.5);
          return doc.heightOfString(String(value ?? "-"), { width: column.width - 14, lineGap: 1 });
        });
        const rowHeight = Math.max(22, ...heights.map(height => height + padding * 2));
        if (doc.y + rowHeight > bottom()) {
          doc.addPage();
          drawTableHeader();
        }

        const y = doc.y;
        doc.save().rect(left, y, tableWidth, rowHeight).fill(rowIndex % 2 ? "#F1F6FA" : "#FFFFFF").restore();
        doc.rect(left, y, tableWidth, rowHeight).strokeColor("#D7E2EC").lineWidth(0.45).stroke();
        let x = left;
        row.forEach((value, index) => {
          const column = columns[index];
          doc.fillColor("#24364A").font("Helvetica").fontSize(8.5)
            .text(String(value ?? "-"), x + 7, y + padding, {
              width: column.width - 14,
              height: rowHeight - padding * 2,
              lineGap: 1,
            });
          x += column.width;
          if (index < row.length - 1) {
            doc.moveTo(x, y).lineTo(x, y + rowHeight).strokeColor("#D7E2EC").lineWidth(0.45).stroke();
          }
        });
        doc.y = y + rowHeight;
      });
    }

    function addMetricCards() {
      const visitorDays = traffic.available ? number(traffic.visitorDays) : "Indisponível";
      const purchases = commerce.available ? Number(commerce.purchases) || 0 : null;
      const conversion = purchases !== null && Number(traffic.visitorDays)
        ? `${(purchases / Number(traffic.visitorDays) * 100).toFixed(2).replace(".", ",")}%`
        : "-";
      const cards = [
        ["Visualizações", traffic.available ? number(traffic.pageviews) : "Indisponível"],
        ["Visitantes-dia", visitorDays],
        ["Compras aprovadas", purchases === null ? "Indisponível" : number(purchases)],
        ["Receita registrada", commerce.available ? money(commerce.revenueCents) : "Indisponível"],
        ["Conversão estimada", conversion],
      ];
      const gap = 9;
      const width = (contentWidth - gap * (cards.length - 1)) / cards.length;
      const y = doc.y;
      cards.forEach(([label, value], index) => {
        const x = left + index * (width + gap);
        doc.save().roundedRect(x, y, width, 58, 6).fillAndStroke("#F1F7FB", "#D3E3EE").restore();
        doc.fillColor("#52677B").font("Helvetica-Bold").fontSize(8).text(label, x + 10, y + 9, { width: width - 20 });
        const valueSize = value.length > 16 ? 10 : value.length > 11 ? 12 : 16;
        doc.fillColor("#0B2742").font("Helvetica-Bold").fontSize(valueSize).text(value, x + 10, y + 26, { width: width - 20, height: 22 });
      });
      doc.y = y + 72;
    }

    addHeader("Relatório mensal da loja", `${period} | Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
    addMetricCards();
    addSection("Vendas por material");
    const salesColumns = [
      { label: "Material", width: contentWidth * 0.35 },
      { label: "Compras", width: contentWidth * 0.09 },
      { label: "Receita registrada", width: contentWidth * 0.16 },
      { label: "E-mail aceito", width: contentWidth * 0.13 },
      { label: "Download iniciado", width: contentWidth * 0.15 },
      { label: "Convites", width: contentWidth * 0.12 },
    ];
    const salesRows = products.map(product => [
      product.name,
      number(product.purchases),
      `${money(product.revenueCents)}${Number(product.purchasesWithoutAmount) ? `\n${number(product.purchasesWithoutAmount)} sem valor registrado` : ""}`,
      number(product.emailAccepted),
      number(product.downloadStarted),
      number(product.invitePurchases),
    ]);
    addTable(salesColumns, salesRows.length ? salesRows : [["Nenhuma compra aprovada neste mês", "-", "-", "-", "-", "-"]]);

    const missingAmounts = Number(commerce.purchasesWithoutAmount) || 0;
    if (missingAmounts) {
      const note = `${number(missingAmounts)} pedido(s) sem valor recuperado do pagamento. A receita mostrada é parcial.`;
      doc.moveDown(0.6).fillColor("#8A5B00").font("Helvetica-Bold").fontSize(8.5);
      const noteHeight = doc.heightOfString(note, { width: contentWidth });
      if (doc.y + noteHeight > bottom()) doc.addPage();
      doc.text(note, left, doc.y, { width: contentWidth });
    }

    doc.addPage();
    addHeader("Tráfego e avaliações", period);
    addSection("Páginas mais acessadas");
    const pageColumns = [
      { label: "Página", width: contentWidth * 0.60 },
      { label: "Visualizações", width: contentWidth * 0.20 },
      { label: "Visitantes-dia", width: contentWidth * 0.20 },
    ];
    addTable(pageColumns, pages.length
      ? pages.map(page => [page.path, number(page.pageviews), number(page.visitors)])
      : [[traffic.available ? "Sem páginas registradas" : "Dados de tráfego indisponíveis", "-", "-"]]);

    addSection("Avaliações");
    const average = reviews.averageRating == null ? "-" : `${Number(reviews.averageRating).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} / 5`;
    doc.fillColor("#24364A").font("Helvetica-Bold").fontSize(10)
      .text(`Média: ${average}    |    Avaliações no período: ${number(reviews.count)}`, { width: contentWidth });
    doc.moveDown(0.35);
    addTable([
      { label: "Classificação", width: contentWidth * 0.72 },
      { label: "Quantidade", width: contentWidth * 0.28 },
    ], [5, 4, 3, 2, 1].map(rating => [`${rating} estrelas`, number(distribution[rating - 1]) ]));

    doc.addPage();
    addHeader("Tráfego diário", period);
    addSection("Acessos por dia");
    const dailyColumns = [
      { label: "Data", width: contentWidth * 0.22 },
      { label: "Visualizações", width: contentWidth * 0.39 },
      { label: "Visitantes-dia", width: contentWidth * 0.39 },
    ];
    addTable(dailyColumns, days.length
      ? days.map(day => [
        new Date(`${day.date}T12:00:00.000Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" }),
        number(day.pageviews),
        number(day.visitors),
      ])
      : [[traffic.available ? "Sem tráfego registrado" : "Dados de tráfego indisponíveis", "-", "-"]]);

    const footnote = "E-mail aceito significa que a Resend aceitou a solicitação, não que chegou à caixa de entrada. Download iniciado conta o primeiro acesso ao link válido, não confirma que o arquivo foi aberto. Visitantes-dia não são pessoas únicas no mês. Receita soma somente pedidos com valor confirmado.";
    doc.moveDown(0.7).fillColor("#52677B").font("Helvetica").fontSize(7.5);
    const footnoteHeight = doc.heightOfString(footnote, { width: contentWidth, lineGap: 2 });
    if (doc.y + footnoteHeight > bottom()) doc.addPage();
    doc.text(footnote, left, doc.y, { width: contentWidth, lineGap: 2 });

    const pageRange = doc.bufferedPageRange();
    for (let index = 0; index < pageRange.count; index += 1) {
      doc.switchToPage(index);
      doc.fillColor("#63788D").font("Helvetica").fontSize(7.5)
        .text(`QualityPro Solutions | Relatório da loja | Página ${index + 1} de ${pageRange.count}`,
          left, doc.page.height - doc.page.margins.bottom - 12, { width: contentWidth, align: "center" });
    }
    doc.end();
  });
}

module.exports = {
  createExcelReport,
  createPdfReport,
  createStoreReportPdf,
};
