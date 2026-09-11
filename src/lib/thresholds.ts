import data from "../../prisma/data/thresholds.json";

/** 入场门槛：改 prisma/data/thresholds.json 即可，种子地图会覆盖 entryMin。 */
export const THRESHOLD_SOURCE = data.source;
export const THRESHOLD_UPDATED = data.updated;

export const BUDGET_TIERS = data.tiers;

export const MAP_THRESHOLDS = data.maps as Record<string, number>;

export type BudgetTier = (typeof BUDGET_TIERS)[number];

export function nearestTier(budget: number): BudgetTier {
  return BUDGET_TIERS.reduce((best, t) =>
    Math.abs(t.budget - budget) < Math.abs(best.budget - budget) ? t : best,
  );
}

export function thresholdFor(slug: string, fallback = 0) {
  return MAP_THRESHOLDS[slug] ?? fallback;
}
