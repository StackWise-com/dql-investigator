export interface Rank {
  threshold: number;
  title: string;
  emoji: string;
}

export const RANKS: Rank[] = [
  { threshold: 0, title: "Log Novice", emoji: "🌱" },
  { threshold: 50, title: "Log Apprentice", emoji: "🔍" },
  { threshold: 150, title: "Query Detective", emoji: "🕵️" },
  { threshold: 300, title: "Pipeline Engineer", emoji: "⚙️" },
  { threshold: 500, title: "DQL Specialist", emoji: "📊" },
  { threshold: 800, title: "Log Master", emoji: "🏆" },
  { threshold: 1200, title: "Data Whisperer", emoji: "🧙" },
  { threshold: 2000, title: "Grail Architect", emoji: "🏛️" },
];

export function getRank(xp: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.threshold) {
      current = rank;
    } else {
      break;
    }
  }
  return current;
}

export function getNextRank(xp: number): Rank | null {
  for (const rank of RANKS) {
    if (xp < rank.threshold) {
      return rank;
    }
  }
  return null;
}

export function getXPToNextRank(xp: number): number {
  const next = getNextRank(xp);
  if (!next) return 0;
  return next.threshold - xp;
}

export interface XPBreakdown {
  base: number;
  complexityBonus: number;
  premiumMultiplier: number;
  total: number;
}

export function calculatePipelineXP(pipelineLength: number, isPremiumCase: boolean): XPBreakdown {
  let base = 5;
  if (pipelineLength >= 3) base = 15;
  else if (pipelineLength >= 2) base = 10;

  const complexityBonus = pipelineLength > 3 ? (pipelineLength - 3) * 5 : 0;
  const premiumMultiplier = isPremiumCase ? 2 : 1;
  const total = (base + complexityBonus) * premiumMultiplier;

  return { base, complexityBonus, premiumMultiplier, total };
}

export function calculateCaseStepXP(stepIndex: number, totalSteps: number, isPremiumCase: boolean): number {
  const base = 25;
  const finishBonus = stepIndex === totalSteps - 1 ? 100 : 0;
  const premiumMultiplier = isPremiumCase ? 2 : 1;
  return (base + finishBonus) * premiumMultiplier;
}
