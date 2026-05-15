"use client";

import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { BADGE_DEFINITIONS } from "@/lib/curriculum/badges";

export function BadgeShelf() {
  const earnedBadges = useInvestigatorStore((s) => s.earnedBadges);

  if (earnedBadges.length === 0) {
    return (
      <div className="text-xs text-slate-500 py-2">
        No badges yet. Complete lessons and streaks to earn them.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {BADGE_DEFINITIONS.map((def) => {
        const earned = earnedBadges.includes(def.id);
        return (
          <div
            key={def.id}
            title={def.description}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-opacity ${
              earned
                ? "bg-accent/10 border-accent/20 text-accent"
                : "bg-white/[0.02] border-white/[0.04] text-slate-600 opacity-40"
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={def.icon} />
            </svg>
            <span className="font-medium">{def.title}</span>
          </div>
        );
      })}
    </div>
  );
}
