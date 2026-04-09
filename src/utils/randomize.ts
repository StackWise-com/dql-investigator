import type { ScenarioV2, ScenarioVariant } from "../types/scenario";

export function pickVariant(scenario: ScenarioV2): ScenarioVariant {
  return scenario.variants[Math.floor(Math.random() * scenario.variants.length)];
}

/**
 * Replace {{key}} placeholders in a template string with variant values.
 * Handles string, number, and array values (arrays are joined with ", ").
 */
export function applyVariant(template: string, variant: ScenarioVariant): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = variant[key];
    if (val === undefined || val === null) return `{{${key}}}`;
    if (Array.isArray(val)) return (val as unknown[]).join(", ");
    return String(val);
  });
}

/**
 * Vary a number by ±20% using the variant's errorCounts array as a seed.
 * Keeps mock data counts looking different between playthrough variants.
 */
export function variantCount(base: number, variant: ScenarioVariant, seed = 0): number {
  const counts = variant.errorCounts;
  if (counts.length === 0) return base;
  const factor = 0.8 + (counts[seed % counts.length] % 40) / 100;
  return Math.round(base * factor);
}
