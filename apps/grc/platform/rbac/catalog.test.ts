import { describe, expect, it } from "vitest";
import { allPermissions, isValidPermission, permitted } from "./catalog";

describe("permission catalog", () => {
  it("contains only well-formed module.resource.action strings, no duplicates", () => {
    const perms = allPermissions();
    expect(perms.length).toBeGreaterThan(0);
    expect(new Set(perms).size).toBe(perms.length);
    for (const p of perms) {
      expect(p).toMatch(/^[a-z_]+\.[a-z_]+\.[a-z_]+$/);
    }
  });

  it("validates catalog membership", () => {
    expect(isValidPermission("platform.users.view")).toBe(true);
    expect(isValidPermission("platform.users.frobnicate")).toBe(false);
    expect(isValidPermission("*")).toBe(false); // wildcard is not a catalog entry
  });

  it("honors the Administrator wildcard", () => {
    expect(permitted(new Set(["*"]), "platform.users.delete")).toBe(true);
    expect(permitted(new Set(["platform.audit_log.view"]), "platform.audit_log.view")).toBe(true);
    expect(permitted(new Set(["platform.audit_log.view"]), "platform.users.view")).toBe(false);
    expect(permitted(new Set(), "platform.users.view")).toBe(false);
  });
});
