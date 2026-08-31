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

module.exports = {
  createExcelReport,
  createPdfReport,
};
