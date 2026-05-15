"use client";

import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { getRank, getNextRank, RANKS } from "@/components/landing/StreakBanner";

interface RankBadgeProps {
  xp?: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

export function RankBadge({ xp: xpProp, size = "md", showProgress = true }: RankBadgeProps) {
  const storeXP = useInvestigatorStore((s) => s.totalXP);
  const xp = xpProp ?? storeXP;

  const rank = getRank(xp);
  const nextRank = getNextRank(xp);
  const progress = nextRank
    ? Math.round(((xp - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100)
    : 100;

  const nameSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  const xpSizes = { sm: "text-xs", md: "text-xs", lg: "text-sm" };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className={`font-semibold text-slate-100 ${nameSizes[size]}`}>{rank.name}</span>
        <span className={`text-slate-500 ${xpSizes[size]}`}>{xp.toLocaleString()} XP</span>
      </div>
      {showProgress && nextRank && (
        <div className="space-y-1">
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden w-48 max-w-full">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-600">
            {(nextRank.minXP - xp).toLocaleString()} XP to {nextRank.name}
          </p>
        </div>
      )}
      {!nextRank && (
        <p className="text-xs text-amber-400">Maximum rank achieved</p>
      )}
    </div>
  );
}

export function RankPill({ xp }: { xp: number }) {
  const rank = getRank(xp);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
      {rank.name}
    </span>
  );
}

export { getRank, getNextRank, RANKS };
