// Tabular PDF rendering over pdfkit (pure JS — no Chromium, runs identically
// in the Docker image and on native Windows Server). This is the v1 report
// pipeline decided in the plan §13: parameterized tabular reports first; a
// high-fidelity print-CSS/Chromium pipeline can join later for board packs
// without touching the report-data contract.
import PDFDocument from "pdfkit";

export interface ReportStat {
  label: string;
  value: string;
}

export interface ReportTable {
  columns: string[];
  rows: string[][];
}

export interface ReportSection {
  heading?: string;
  stats?: ReportStat[];
  table?: ReportTable;
}

export interface ReportDocument {
  title: string;
  workspaceName: string;
  generatedBy: string;
  generatedAt: Date;
  /** Human-readable parameter summary, e.g. "Status: open · Band: high". */
  paramsLine: string;
  /** Workspace logo (PNG/JPEG embedded; other formats skipped). */
  logo?: { data: Buffer; contentType: string } | null;
  sections: ReportSection[];
}

const PAGE = { margin: 48, width: 595.28, height: 841.89 }; // A4 portrait
const USABLE = PAGE.width - PAGE.margin * 2;
const BOTTOM = PAGE.height - PAGE.margin - 24; // keep room for the footer
const COLORS = {
  heading: "#1c2b36",
  body: "#333f48",
  muted: "#5c6b77",
  line: "#d7dee4",
  headerFill: "#eef2f5",
  zebra: "#f7f9fa",
};

export async function renderReportPdf(
  report: ReportDocument,
  options?: { compress?: boolean },
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.margin,
    bufferPages: true,
    compress: options?.compress ?? true,
    info: { Title: report.title, Author: "UniSentinel" },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawHeader(doc, report);
  for (const section of report.sections) {
    if (section.heading) {
      ensureRoom(doc, 40);
      doc.moveDown(0.8);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.heading).text(section.heading);
      doc.moveDown(0.3);
    }
    if (section.stats?.length) drawStats(doc, section.stats);
    if (section.table) drawTable(doc, section.table);
  }

  // Footer on every page (bufferPages lets us stamp page X of Y at the end).
  const range = doc.bufferedPageRange();
  const stamp = `${report.workspaceName} · generated ${report.generatedAt.toISOString().slice(0, 16).replace("T", " ")} UTC by ${report.generatedBy}`;
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(stamp, PAGE.margin, PAGE.height - PAGE.margin + 6, { width: USABLE - 90, lineBreak: false })
      .text(`Page ${i + 1} of ${range.count}`, PAGE.width - PAGE.margin - 90, PAGE.height - PAGE.margin + 6, {
        width: 90,
        align: "right",
        lineBreak: false,
      });
  }
  doc.end();
  return done;
}

function drawHeader(doc: PDFKit.PDFDocument, report: ReportDocument): void {
  const logo = report.logo;
  const embeddable = logo && (logo.contentType === "image/png" || logo.contentType === "image/jpeg");
  if (embeddable) {
    try {
      doc.image(logo.data, PAGE.margin, PAGE.margin, { fit: [110, 32] });
    } catch {
      // A corrupt logo never blocks a report.
    }
  }
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(report.workspaceName, PAGE.margin, PAGE.margin + 4, { width: USABLE, align: "right", lineBreak: false });

  doc.y = PAGE.margin + (embeddable ? 44 : 24);
  doc.x = PAGE.margin;
  doc.font("Helvetica-Bold").fontSize(20).fillColor(COLORS.heading).text(report.title);
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text(report.paramsLine);
  doc.moveDown(0.4);
  doc
    .moveTo(PAGE.margin, doc.y)
    .lineTo(PAGE.width - PAGE.margin, doc.y)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke();
  doc.moveDown(0.8);
}

function ensureRoom(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > BOTTOM) {
    doc.addPage();
    doc.y = PAGE.margin;
  }
}

function drawStats(doc: PDFKit.PDFDocument, stats: ReportStat[]): void {
  ensureRoom(doc, 48);
  const cellWidth = USABLE / stats.length;
  const top = doc.y;
  stats.forEach((stat, i) => {
    const x = PAGE.margin + i * cellWidth;
    doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.heading).text(stat.value, x, top, {
      width: cellWidth - 8,
      lineBreak: false,
    });
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted).text(stat.label.toUpperCase(), x, top + 20, {
      width: cellWidth - 8,
      lineBreak: false,
    });
  });
  doc.x = PAGE.margin;
  doc.y = top + 40;
}

function drawTable(doc: PDFKit.PDFDocument, table: ReportTable): void {
  const colWidth = USABLE / table.columns.length;
  const pad = 6;

  const rowHeight = (cells: string[], font: string, size: number): number => {
    doc.font(font).fontSize(size);
    let max = 0;
    for (let i = 0; i < cells.length; i++) {
      const h = doc.heightOfString(cells[i] ?? "", { width: colWidth - pad * 2 });
      if (h > max) max = h;
    }
    return Math.max(max, 10) + pad * 2;
  };

  const drawRow = (cells: string[], opts: { header?: boolean; zebra?: boolean }): void => {
    const font = opts.header ? "Helvetica-Bold" : "Helvetica";
    const size = opts.header ? 8.5 : 9;
    const height = rowHeight(cells, font, size);
    if (doc.y + height > BOTTOM) {
      doc.addPage();
      doc.y = PAGE.margin;
      if (!opts.header) drawRow(table.columns, { header: true });
    }
    const top = doc.y;
    if (opts.header) {
      doc.rect(PAGE.margin, top, USABLE, height).fill(COLORS.headerFill);
    } else if (opts.zebra) {
      doc.rect(PAGE.margin, top, USABLE, height).fill(COLORS.zebra);
    }
    doc.fillColor(opts.header ? COLORS.heading : COLORS.body).font(font).fontSize(size);
    cells.forEach((cell, i) => {
      doc.text(cell ?? "", PAGE.margin + i * colWidth + pad, top + pad, { width: colWidth - pad * 2 });
    });
    doc
      .moveTo(PAGE.margin, top + height)
      .lineTo(PAGE.width - PAGE.margin, top + height)
      .lineWidth(0.5)
      .strokeColor(COLORS.line)
      .stroke();
    doc.x = PAGE.margin;
    doc.y = top + height;
  };

  drawRow(table.columns, { header: true });
  if (table.rows.length === 0) {
    ensureRoom(doc, 24);
    const top = doc.y;
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text("No rows match the selected filters.", PAGE.margin + pad, top + pad);
    doc.x = PAGE.margin;
    doc.y = top + 24;
    return;
  }
  table.rows.forEach((row, i) => drawRow(row, { zebra: i % 2 === 1 }));
}
