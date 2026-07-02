import { describe, expect, it } from "vitest";
import { renderReportPdf } from "./pdf";

const base = {
  title: "Risk register",
  workspaceName: "Acme Corporation",
  generatedBy: "Alice Admin",
  generatedAt: new Date("2026-07-02T12:00:00Z"),
  paramsLine: "Status: all  ·  Band: all",
};

/** pdfkit emits text as hex strings (<4c6f73…>), splitting words at kerning
 *  pairs — decode and concatenate them for assertions. */
function extractText(pdf: Buffer): string {
  const raw = pdf.toString("latin1");
  return (raw.match(/<([0-9a-fA-F]+)>/g) ?? [])
    .map((h) => Buffer.from(h.slice(1, -1), "hex").toString("latin1"))
    .join("");
}

describe("renderReportPdf", () => {
  it("produces a valid PDF with stats and table content", async () => {
    const pdf = await renderReportPdf(
      {
        ...base,
        sections: [
          { stats: [{ label: "Risks", value: "2" }] },
          {
            table: {
              columns: ["Ref", "Risk"],
              rows: [
                ["RSK-1", "Loss of customer database"],
                ["RSK-2", "Printer outage"],
              ],
            },
          },
        ],
      },
      { compress: false },
    );
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const text = extractText(pdf);
    expect(text).toContain("Loss of customer database");
    expect(text).toContain("Acme Corporation");
    expect(text).toContain("Page 1 of 1");
  });

  it("paginates long tables and repeats the header row", async () => {
    const rows = Array.from({ length: 80 }, (_, i) => [`ROW-${i + 1}`, `Item number ${i + 1}`, "open"]);
    const pdf = await renderReportPdf(
      { ...base, sections: [{ table: { columns: ["Ref", "Name", "Status"], rows } }] },
      { compress: false },
    );
    const text = extractText(pdf);
    const pages = Number(text.match(/Page 1 of (\d+)/)?.[1] ?? 0);
    expect(pages).toBeGreaterThan(1);
    expect(text).toContain(`Page ${pages} of ${pages}`);
    expect(text).toContain("ROW-80");
    // The header row repeats on every page.
    expect(text.match(/RefNameStatus/g)).toHaveLength(pages);
  });

  it("renders an empty-table placeholder instead of failing", async () => {
    const pdf = await renderReportPdf(
      { ...base, sections: [{ table: { columns: ["Ref"], rows: [] } }] },
      { compress: false },
    );
    expect(extractText(pdf)).toContain("No rows match the selected filters.");
  });
});
