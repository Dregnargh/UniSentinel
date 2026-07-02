// Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, CRLF) — no
// dependency, Windows-line-ending safe. Used by the asset importer.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, ""); // strip BOM

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully-empty trailing rows.
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export interface AssetCsvRow {
  name: string;
  type: string;
  description: string;
  location: string;
  classification: string;
  attributes: Record<string, string>;
}

export interface AssetCsvResult {
  rows: AssetCsvRow[];
  errors: string[]; // per-line problems, line numbers are 1-based incl. header
}

/**
 * Expected headers: name, type (+ optional description, location,
 * classification, and any number of "attr:<key>" columns).
 */
export function parseAssetCsv(text: string): AssetCsvResult {
  const parsed = parseCsv(text);
  if (parsed.length === 0) return { rows: [], errors: ["The file is empty."] };
  const header = parsed[0]!.map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  if (idx("name") === -1 || idx("type") === -1) {
    return { rows: [], errors: ['The header row must include "name" and "type" columns.'] };
  }
  const attrColumns = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h.startsWith("attr:") && h.length > 5);

  const rows: AssetCsvRow[] = [];
  const errors: string[] = [];
  for (let line = 1; line < parsed.length; line++) {
    const cells = parsed[line]!;
    const get = (name: string) => (idx(name) === -1 ? "" : (cells[idx(name)] ?? "").trim());
    const name = get("name");
    const type = get("type").toLowerCase();
    if (!name) {
      errors.push(`Line ${line + 1}: missing name.`);
      continue;
    }
    const attributes: Record<string, string> = {};
    for (const { h, i } of attrColumns) {
      const value = (cells[i] ?? "").trim();
      if (value) attributes[h.slice(5)] = value;
    }
    rows.push({
      name,
      type,
      description: get("description"),
      location: get("location"),
      classification: get("classification").toLowerCase() || "internal",
      attributes,
    });
  }
  return { rows, errors };
}
