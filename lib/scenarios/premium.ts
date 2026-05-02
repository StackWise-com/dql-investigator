// Determines whether a scenario is part of the premium tier. Used by the
// scenario-selector UI and (server-side) by the refund-eligibility check.
// Tier on the scenario object itself wins; otherwise we fall back to the
// id-prefix heuristic used historically.

const PREMIUM_CASE_IDS = new Set(["case-002", "case-003", "case-004", "case-005"]);

export function getIsPremiumCase(id: string, tier?: string): boolean {
  if (tier) return tier === "premium";
  return (
    PREMIUM_CASE_IDS.has(id) ||
    id.startsWith("case-02") ||
    id.startsWith("case-03") ||
    id.startsWith("case-04") ||
    id.startsWith("dpl-") ||
    id.startsWith("combo-")
  );
}
