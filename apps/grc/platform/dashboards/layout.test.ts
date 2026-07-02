import { describe, expect, it } from "vitest";
import { addInstance, defaultLayout, moveInstance, removeInstance, sanitizeLayout } from "./layout";

describe("defaultLayout", () => {
  it("orders curated widgets first and keeps only available ones", () => {
    const layout = defaultLayout(["risk.top", "tasks.my", "risk.bands"]);
    expect(layout.map((i) => i.widgetKey)).toEqual(["risk.bands", "tasks.my", "risk.top"]);
  });

  it("appends unknown-but-available widgets after the curated set", () => {
    const layout = defaultLayout(["compliance.posture", "risk.bands"]);
    expect(layout.map((i) => i.widgetKey)).toEqual(["risk.bands", "compliance.posture"]);
  });
});

describe("layout operations", () => {
  const base = defaultLayout(["risk.bands", "tasks.my"]);

  it("adds a widget once", () => {
    const added = addInstance(base, "risk.top");
    expect(added.map((i) => i.widgetKey)).toContain("risk.top");
    expect(addInstance(added, "risk.top")).toHaveLength(added.length);
  });

  it("removes by instance id", () => {
    expect(removeInstance(base, "risk.bands").map((i) => i.widgetKey)).toEqual(["tasks.my"]);
  });

  it("moves within bounds and clamps at the edges", () => {
    const moved = moveInstance(base, "tasks.my", -1);
    expect(moved.map((i) => i.widgetKey)).toEqual(["tasks.my", "risk.bands"]);
    expect(moveInstance(base, "risk.bands", -1)).toEqual(base);
    expect(moveInstance(base, "tasks.my", 1)).toEqual(base);
    expect(moveInstance(base, "missing", 1)).toEqual(base);
  });

  it("sanitizes unknown widget keys from stored layouts", () => {
    const stored = [...base, { id: "ghost", widgetKey: "ghost.widget" }];
    expect(sanitizeLayout(stored, new Set(["risk.bands", "tasks.my"]))).toHaveLength(2);
  });
});
