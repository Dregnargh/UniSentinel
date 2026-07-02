import { z } from "zod";

// The workspace risk methodology: likelihood/impact scales are configurable
// from 3 to 5 levels per axis (3×3 up to 5×5, mixed sizes allowed), with
// per-level labels + descriptions and editable band thresholds.
// Stored in the settings framework (namespace "risk", key "methodology").

export const levelSchema = z.object({
  label: z.string().trim().min(1).max(40),
  description: z.string().trim().max(300).default(""),
});

export const methodologySchema = z.object({
  likelihood: z.array(levelSchema).min(3).max(5),
  impact: z.array(levelSchema).min(3).max(5),
  // Upper score bounds (inclusive) for Low / Medium / High; above high = Critical.
  bands: z.object({
    low: z.number().int().min(1),
    medium: z.number().int().min(2),
    high: z.number().int().min(3),
  }),
});

export type Methodology = z.infer<typeof methodologySchema>;
export type RiskBand = "low" | "medium" | "high" | "critical";

export function defaultBands(maxScore: number): Methodology["bands"] {
  return {
    low: Math.max(1, Math.round(maxScore * 0.2)),
    medium: Math.max(2, Math.round(maxScore * 0.45)),
    high: Math.max(3, Math.round(maxScore * 0.7)),
  };
}

export function defaultMethodology(): Methodology {
  return {
    likelihood: [
      { label: "Rare", description: "May occur only in exceptional circumstances" },
      { label: "Unlikely", description: "Could occur at some time" },
      { label: "Possible", description: "Might occur at some time" },
      { label: "Likely", description: "Will probably occur in most circumstances" },
      { label: "Almost certain", description: "Expected to occur in most circumstances" },
    ],
    impact: [
      { label: "Negligible", description: "No material impact" },
      { label: "Minor", description: "Absorbed through normal activity" },
      { label: "Moderate", description: "Significant effort to manage" },
      { label: "Major", description: "Serious impact on objectives" },
      { label: "Severe", description: "Threatens survival or license to operate" },
    ],
    bands: defaultBands(25),
  };
}

export function maxScore(m: Methodology): number {
  return m.likelihood.length * m.impact.length;
}

export function riskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function bandFor(score: number, m: Methodology): RiskBand {
  if (score <= m.bands.low) return "low";
  if (score <= m.bands.medium) return "medium";
  if (score <= m.bands.high) return "high";
  return "critical";
}

export const bandTone: Record<RiskBand, "neutral" | "info" | "warning" | "danger"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

export const BAND_LABEL: Record<RiskBand, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Validation shared by the editor: thresholds ascending and within range. */
export function validateMethodology(m: Methodology): string | null {
  const max = maxScore(m);
  if (!(m.bands.low < m.bands.medium && m.bands.medium < m.bands.high)) {
    return "Band thresholds must be ascending (low < medium < high).";
  }
  if (m.bands.high >= max) {
    return `The high threshold must be below the maximum score (${max}) so Critical exists.`;
  }
  return null;
}

/**
 * Guard for shrinking the scale while risks still use higher levels.
 * `inUse` holds the highest likelihood/impact levels referenced by any risk.
 */
export function shrinkConflict(
  m: Methodology,
  inUse: { likelihood: number; impact: number },
): string | null {
  if (inUse.likelihood > m.likelihood.length) {
    return `A risk still uses likelihood level ${inUse.likelihood} — re-assess it before shrinking the scale to ${m.likelihood.length}.`;
  }
  if (inUse.impact > m.impact.length) {
    return `A risk still uses impact level ${inUse.impact} — re-assess it before shrinking the scale to ${m.impact.length}.`;
  }
  return null;
}
