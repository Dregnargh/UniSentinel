import { describe, expect, it } from "vitest";
import { formatLine } from "./log";

describe("formatLine", () => {
  it("emits one parseable JSON line with ts/level/component/msg", () => {
    const now = new Date("2026-01-02T03:04:05.000Z");
    const line = formatLine("worker", "info", "started", { queues: 1 }, now);
    expect(JSON.parse(line)).toEqual({
      ts: "2026-01-02T03:04:05.000Z",
      level: "info",
      component: "worker",
      msg: "started",
      queues: 1,
    });
  });

  it("keeps context from overriding the core fields' order stability", () => {
    const line = formatLine("web", "error", "boom", { detail: "x" });
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("error");
    expect(parsed.component).toBe("web");
    expect(parsed.detail).toBe("x");
    expect(typeof parsed.ts).toBe("string");
  });
});
