"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchPublicProfileBySlug, type LeaderboardRow } from "@/lib/api/profile";
import { UserAvatar } from "./UserAvatar";
import { getAnimalEmoji } from "@/lib/avatars";

export function PublicProfileScreen({ slug }: { slug: string }) {
  const [row, setRow] = useState<LeaderboardRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicProfileBySlug(slug).then((r) => {
      if (cancelled) return;
      setRow(r);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <a href="/leaderboard" className="text-xs text-cyan-400 hover:underline">
            ← Back to leaderboard
          </a>
          <a href="/" className="text-xs text-slate-400 hover:text-slate-200">Home</a>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : !row ? (
          <div className="glass-panel-strong rounded-xl border border-white/[0.06] p-6">
            <p className="text-sm text-slate-300">No public profile found at this URL.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-strong rounded-xl border border-cyan-400/20 p-6 space-y-5"
          >
            <div className="flex items-center gap-4">
              {/* Use the slug as a stable seed for the avatar so different
                  visitors see the same image. */}
              <UserAvatar email={row.display_slug ?? row.user_id} xp={row.learning_xp} size={56} showTitle={false} />
              <div>
                <p className="text-base font-semibold text-slate-100">
                  <span className="mr-1.5 text-xl">{getAnimalEmoji(row.display_slug || row.user_id)}</span>
                  {row.display_name || "anonymous"}
                </p>
                {row.country_code && (
                  <p className="text-xs text-slate-500">{row.country_code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Learning XP" value={row.learning_xp} accent="cyan" />
              <Stat label="Game XP" value={row.game_xp} accent="violet" />
            </div>

            <p className="text-xs text-slate-500">
              This is a public-facing snapshot. No private information is shown here.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "cyan" | "violet";
}) {
  const cls = accent === "cyan" ? "text-cyan-300" : "text-violet-300";
  return (
    <div className="rounded-lg border border-white/[0.06] bg-slate-900/40 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${cls}`}>{value.toLocaleString()}</p>
    </div>
  );
}
