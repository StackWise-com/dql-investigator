"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchLeaderboard, type LeaderboardRow } from "@/lib/api/profile";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { getAnimalEmoji } from "@/lib/avatars";
import { getRank } from "@/components/landing/StreakBanner";

type Tab = "learning_xp" | "game_xp" | "this_week";

export function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>("learning_xp");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const myUserId = useInvestigatorStore((s) => s.userId);
  const weeklyXPLedger = useInvestigatorStore((s) => s.weeklyXPLedger);
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const streak = useInvestigatorStore((s) => s.streak);

  // Compute this-week XP (Mon–Sun)
  const weeklyXP = (() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const mondayStr = monday.toISOString().slice(0, 10);
    return weeklyXPLedger.filter((e) => e.date >= mondayStr).reduce((s, e) => s + e.amount, 0);
  })();

  // Last 7 days for the mini bar chart
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    return { date: ds, label: ["S","M","T","W","T","F","S"][d.getDay()], amount: weeklyXPLedger.find((e) => e.date === ds)?.amount ?? 0 };
  });
  const maxDay = Math.max(...last7.map((d) => d.amount), 1);

  useEffect(() => {
    if (tab === "this_week") { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetchLeaderboard(tab, 100).then((r) => {
      if (cancelled) return;
      setRows(r);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <div className="flex items-center gap-2 text-xs">
            <a href="/profile" className="text-cyan-400 hover:underline">My profile</a>
            <span className="text-slate-600">·</span>
            <a href="/" className="text-slate-400 hover:text-slate-200">← Back to app</a>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Players appear here once they accept the Terms &amp; Conditions. Click any name to
          view their public profile.
        </p>

        <div className="inline-flex rounded-lg bg-slate-900/60 p-0.5">
          <TabButton active={tab === "learning_xp"} onClick={() => setTab("learning_xp")}>
            Learning XP
          </TabButton>
          <TabButton active={tab === "game_xp"} onClick={() => setTab("game_xp")}>
            Game XP
          </TabButton>
          <TabButton active={tab === "this_week"} onClick={() => setTab("this_week")}>
            This Week
          </TabButton>
        </div>

        {tab === "this_week" ? (
          <motion.div
            key="this_week"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Personal weekly stats */}
            <div className="glass-panel-strong rounded-xl border border-white/[0.06] p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Your XP this week</p>
                  <p className="text-3xl font-bold text-accent">{weeklyXP.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500 mb-1">Current rank</p>
                  <p className="text-sm font-semibold text-slate-100">{getRank(totalXP).name}</p>
                </div>
              </div>

              {/* 7-day bar chart */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Daily XP — last 7 days</p>
                <div className="flex items-end gap-1.5 h-16">
                  {last7.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end" style={{ height: "48px" }}>
                        <div
                          className="w-full rounded-sm bg-accent/40 hover:bg-accent/70 transition-colors"
                          style={{ height: d.amount > 0 ? `${Math.max(4, (d.amount / maxDay) * 48)}px` : "2px" }}
                          title={`${d.date}: ${d.amount} XP`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-600">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1 border-t border-white/[0.04]">
                <div>
                  <p className="text-xs text-slate-500">Total XP</p>
                  <p className="text-sm font-semibold text-amber-400">{totalXP.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Current streak</p>
                  <p className="text-sm font-semibold text-slate-100">🔥 {streak.current} day{streak.current !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 text-center">
              Multi-user weekly rankings are coming soon. Your XP always counts on the all-time board.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-strong rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden"
          >
            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No entries yet. Be the first to earn XP and appear here.
              </div>
            ) : (
              rows.map((row, idx) => {
                const value = tab === "learning_xp" ? row.learning_xp : row.game_xp;
                const isMe = row.user_id === myUserId;
                const rank = idx + 1;
                return (
                  <a
                    key={row.user_id}
                    href={row.display_slug ? `/u/${row.display_slug}` : "#"}
                    className={`flex items-center gap-4 p-3 hover:bg-white/[0.03] transition-colors ${
                      isMe ? "bg-cyan-400/5" : ""
                    }`}
                  >
                    <span className={`w-8 text-center text-sm font-bold ${rankColor(rank)}`}>
                      {rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">
                        <span className="mr-1.5">{getAnimalEmoji(row.display_slug || row.user_id)}</span>
                        {row.display_name || "anonymous"}
                        {isMe && <span className="ml-2 text-xs text-cyan-400">(you)</span>}
                      </p>
                      {row.country_code && (
                        <p className="text-xs text-slate-500">{row.country_code}</p>
                      )}
                    </div>
                    <span className="text-sm font-mono font-semibold text-slate-100">
                      {value.toLocaleString()}
                    </span>
                  </a>
                );
              })
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
        active ? "bg-cyan-400/15 text-cyan-300" : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function rankColor(rank: number): string {
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-orange-300";
  return "text-slate-500";
}
