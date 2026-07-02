import { describe, expect, it } from "vitest";
import { catalogKindFor, parseScopeDecision } from "./promotion";

describe("parseScopeDecision", () => {
  it("parses skip and create", () => {
    expect(parseScopeDecision("skip")).toEqual({ kind: "skip" });
    expect(parseScopeDecision("create")).toEqual({ kind: "create" });
  });

  it("parses link decisions for both catalog entity types", () => {
    expect(parseScopeDecision("link|catalog:service|abc-123")).toEqual({
      kind: "link",
      type: "catalog:service",
      id: "abc-123",
    });
    expect(parseScopeDecision("link|catalog:asset|def-456")).toEqual({
      kind: "link",
      type: "catalog:asset",
      id: "def-456",
    });
  });

  it("rejects malformed or forged values", () => {
    expect(parseScopeDecision("")).toBeNull();
    expect(parseScopeDecision("link|")).toBeNull();
    expect(parseScopeDecision("link|catalog:service|")).toBeNull();
    expect(parseScopeDecision("link|tasks:task|abc")).toBeNull();
    expect(parseScopeDecision("delete-everything")).toBeNull();
  });
});

describe("catalogKindFor", () => {
  it("maps services and processes to catalog services", () => {
    expect(catalogKindFor("service")).toBe("service");
    expect(catalogKindFor("process")).toBe("service");
  });

  it("maps assets and everything else to catalog assets", () => {
    expect(catalogKindFor("asset")).toBe("asset");
    expect(catalogKindFor("other")).toBe("asset");
    expect(catalogKindFor("unknown")).toBe("asset");
  });
});
