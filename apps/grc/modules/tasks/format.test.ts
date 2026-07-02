import { describe, expect, it } from "vitest";
import { activityProgress, adjacentStatus, isOverdue } from "./format";

describe("isOverdue", () => {
  const now = new Date("2026-07-02T12:00:00Z");
  it("is overdue only when past due and not done", () => {
    expect(isOverdue(new Date("2026-07-01"), "todo", now)).toBe(true);
    expect(isOverdue(new Date("2026-07-01"), "done", now)).toBe(false);
    expect(isOverdue(new Date("2026-07-03"), "todo", now)).toBe(false);
    expect(isOverdue(null, "todo", now)).toBe(false);
  });
});

describe("activityProgress", () => {
  it("computes done percentage, 0 for empty", () => {
    expect(activityProgress([])).toBe(0);
    expect(
      activityProgress([{ status: "done" }, { status: "todo" }, { status: "done" }]),
    ).toBe(67);
    expect(activityProgress([{ status: "done" }])).toBe(100);
  });
});

describe("adjacentStatus", () => {
  it("walks the board columns and stops at the edges", () => {
    expect(adjacentStatus("todo", 1)).toBe("in_progress");
    expect(adjacentStatus("in_progress", -1)).toBe("todo");
    expect(adjacentStatus("done", 1)).toBeNull();
    expect(adjacentStatus("todo", -1)).toBeNull();
  });
});
