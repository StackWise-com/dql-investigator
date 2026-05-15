"use client";

import { useEffect } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";

export function StreakBanner() {
  const streak = useInvestigatorStore((s) => s.streak);
  const updateStreak = useInvestigatorStore((s) => s.updateStreak);
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);

  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  const rank = getRank(totalXP);
  const nextRank = getNextRank(totalXP);
  const progress = nextRank ? Math.round(((totalXP - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100) : 100;

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-slate-900/60 border-b border-white/[0.06]">
      {/* Streak */}
      <div className="flex items-center gap-2">
        <span className="text-base">🔥</span>
        <div>
          <span className="text-sm font-semibold text-slate-100">{streak.current}</span>
          <span className="text-xs text-slate-500 ml-1">day streak</span>
        </div>
      </div>
      <div className="w-px h-4 bg-white/[0.08]" />
      {/* Rank */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Rank</span>
        <span className="text-xs font-semibold text-slate-200">{rank.name}</span>
        {nextRank && (
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-600">{nextRank.name}</span>
          </div>
        )}
      </div>
      <div className="w-px h-4 bg-white/[0.08]" />
      {/* XP */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">XP</span>
        <span className="text-xs font-semibold text-accent">{totalXP.toLocaleString()}</span>
      </div>
      <div className="w-px h-4 bg-white/[0.08]" />
      {/* Scenarios */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">Cases solved</span>
        <span className="text-xs font-semibold text-slate-200">{completedScenarios.length}</span>
      </div>
    </div>
  );
}

export const RANKS = [
  { name: "Trainee",    minXP: 0 },
  { name: "Investigator", minXP: 100 },
  { name: "Detective",  minXP: 500 },
  { name: "Inspector",  minXP: 1500 },
  { name: "Chief",      minXP: 4000 },
  { name: "Legend",     minXP: 10000 },
];

export function getRank(xp: number) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (xp >= r.minXP) rank = r; }
  return rank;
}

export function getNextRank(xp: number) {
  return RANKS.find((r) => r.minXP > xp) || null;
}
