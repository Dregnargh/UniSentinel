import { describe, expect, it } from "vitest";
import { parseAssetCsv, parseCsv } from "./csv";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas and CRLF", () => {
    const text = 'a,"b,1","he said ""hi"""\r\nc,d,e\r\n';
    expect(parseCsv(text)).toEqual([
      ["a", "b,1", 'he said "hi"'],
      ["c", "d", "e"],
    ]);
  });
  it("strips BOM and skips empty trailing lines", () => {
    expect(parseCsv("﻿x,y\n\n")).toEqual([["x", "y"]]);
  });
});

describe("parseAssetCsv", () => {
  it("maps attr: columns into attributes and defaults classification", () => {
    const text = [
      "name,type,location,attr:ip,attr:vendor",
      "core-db,software,eu-west,10.0.0.5,PostgreSQL",
      "hq-fw,hardware,HQ,10.0.0.1,",
    ].join("\n");
    const { rows, errors } = parseAssetCsv(text);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      {
        name: "core-db",
        type: "software",
        description: "",
        location: "eu-west",
        classification: "internal",
        attributes: { ip: "10.0.0.5", vendor: "PostgreSQL" },
      },
      {
        name: "hq-fw",
        type: "hardware",
        description: "",
        location: "HQ",
        classification: "internal",
        attributes: { ip: "10.0.0.1" },
      },
    ]);
  });

  it("reports missing headers and bad lines with line numbers", () => {
    expect(parseAssetCsv("foo,bar\n1,2").errors[0]).toContain('"name" and "type"');
    const { rows, errors } = parseAssetCsv("name,type\n,software\nok,software");
    expect(rows).toHaveLength(1);
    expect(errors[0]).toContain("Line 2");
  });
});
