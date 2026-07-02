import { describe, expect, it } from "vitest";
import {
  bandFor,
  defaultBands,
  defaultMethodology,
  maxScore,
  riskScore,
  shrinkConflict,
  validateMethodology,
  type Methodology,
} from "./methodology";

function matrix(l: number, i: number): Methodology {
  const levels = (n: number) => Array.from({ length: n }, (_, k) => ({ label: `L${k + 1}`, description: "" }));
  return { likelihood: levels(l), impact: levels(i), bands: defaultBands(l * i) };
}

describe("risk scoring", () => {
  it("scores and bands a 5x5 with default thresholds", () => {
    const m = defaultMethodology();
    expect(maxScore(m)).toBe(25);
    expect(bandFor(riskScore(1, 2), m)).toBe("low"); // 2 <= 5
    expect(bandFor(riskScore(3, 3), m)).toBe("medium"); // 9 <= 11
    expect(bandFor(riskScore(4, 4), m)).toBe("high"); // 16 <= 18
    expect(bandFor(riskScore(5, 5), m)).toBe("critical");
  });

  it("scales bands for a 3x3", () => {
    const m = matrix(3, 3);
    expect(maxScore(m)).toBe(9);
    expect(bandFor(9, m)).toBe("critical");
    expect(bandFor(1, m)).toBe("low");
  });

  it("supports mixed sizes (3x5)", () => {
    const m = matrix(3, 5);
    expect(maxScore(m)).toBe(15);
    expect(bandFor(15, m)).toBe("critical");
  });
});

describe("methodology validation", () => {
  it("requires ascending thresholds and room for Critical", () => {
    const m = matrix(5, 5);
    expect(validateMethodology(m)).toBeNull();
    expect(validateMethodology({ ...m, bands: { low: 10, medium: 5, high: 18 } })).toContain("ascending");
    expect(validateMethodology({ ...m, bands: { low: 5, medium: 11, high: 25 } })).toContain("maximum score");
  });

  it("blocks shrinking below in-use levels", () => {
    const m = matrix(3, 3);
    expect(shrinkConflict(m, { likelihood: 5, impact: 2 })).toContain("likelihood level 5");
    expect(shrinkConflict(m, { likelihood: 3, impact: 4 })).toContain("impact level 4");
    expect(shrinkConflict(m, { likelihood: 3, impact: 3 })).toBeNull();
    expect(shrinkConflict(m, { likelihood: 0, impact: 0 })).toBeNull(); // no risks yet
  });
});
