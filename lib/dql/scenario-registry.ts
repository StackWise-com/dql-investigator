// Re-export all scenario collections.
// The seed override is applied by importing @/lib/dql/seed-override
// before any of these modules are loaded.

export { scenarios } from "./scenarios";
export { onboardingScenarios } from "./scenarios-onboarding";
export { dplScenarios } from "./scenarios-dpl";
export { combinedScenarios } from "./scenarios-combined";
export { funScenarios, type FunScenario } from "./fun-scenarios";

import type { Scenario } from "@/lib/types/dql";

/** Convenience merge of all active tracks. */
export function getAllScenarios(): Scenario[] {
  const { scenarios } = require("./scenarios");
  const { onboardingScenarios } = require("./scenarios-onboarding");
  const { dplScenarios } = require("./scenarios-dpl");
  const { combinedScenarios } = require("./scenarios-combined");

  return [
    ...onboardingScenarios,
    ...scenarios,
    ...dplScenarios,
    ...combinedScenarios,
  ];
}

/** Get only the fun story-driven scenarios. */
export function getFunScenarios() {
  const { funScenarios } = require("./fun-scenarios");
  return funScenarios;
}
