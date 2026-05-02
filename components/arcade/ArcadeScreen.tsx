"use client";

import { motion } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { useState } from "react";
import { TimerGame } from "./TimerGame";
import { PipelineGame } from "./PipelineGame";
import { McqGame } from "./McqGame";
import { DplMatcherGame } from "./DplMatcherGame";
import { DplBuilderGame } from "./DplBuilderGame";

type ArcadeMode = "menu" | "timer" | "pipeline" | "mcq" | "dpl-matcher" | "dpl-builder";

const MODE_CARDS = [
  {
    id: "timer" as const,
    title: "Timer Rush",
    description: "Race against the clock! Build the correct pipeline before time runs out.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-rose-400 border-rose-400/20 bg-rose-400/10 hover:bg-rose-400/20",
    iconBg: "bg-rose-400/15 text-rose-400",
  },
  {
    id: "pipeline" as const,
    title: "Pipeline Builder",
    description: "Match the target output by building the exact pipeline. Precision matters.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    color: "text-cyan-400 border-cyan-400/20 bg-cyan-400/10 hover:bg-cyan-400/20",
    iconBg: "bg-cyan-400/15 text-cyan-400",
  },
  {
    id: "mcq" as const,
    title: "DQL Quiz",
    description: "Test your DQL knowledge with multiple-choice questions.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712a2.98 2.98 0 01-.7.7l-2.7 2.7a1.5 1.5 0 01-2.122 0l-2.7-2.7a2.98 2.98 0 01-.7-.7c-1.172-1.025-1.172-2.687 0-3.712C6.429 6.494 8.329 6.494 9.879 7.519zM12 12.75v.008h.008V12.75H12zm0 3.75v.008h.008v-.008H12z" />
      </svg>
    ),
    color: "text-amber-400 border-amber-400/20 bg-amber-400/10 hover:bg-amber-400/20",
    iconBg: "bg-amber-400/15 text-amber-400",
  },
  {
    id: "dpl-matcher" as const,
    title: "DPL Matcher Rush",
    description: "Identify the right DPL matcher for a log fragment under pressure.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    color: "text-violet-400 border-violet-400/20 bg-violet-400/10 hover:bg-violet-400/20",
    iconBg: "bg-violet-400/15 text-violet-400",
  },
  {
    id: "dpl-builder" as const,
    title: "DPL Pattern Builder",
    description: "Pick the correct DPL pattern to extract fields from raw logs.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10 hover:bg-emerald-400/20",
    iconBg: "bg-emerald-400/15 text-emerald-400",
  },
];

export function ArcadeScreen() {
  const [mode, setMode] = useState<ArcadeMode>("menu");
  const gameScores = useInvestigatorStore((s) => s.gameScores);
  const gameHighScores = useInvestigatorStore((s) => s.gameHighScores);

  const statsFor = (modeKey: string) => {
    const scores = gameScores.filter((s) => s.mode === modeKey);
    const played = scores.length;
    const best = gameHighScores[modeKey] ?? 0;
    return { played, best };
  };

  if (mode === "timer") return <TimerGame onExit={() => setMode("menu")} />;
  if (mode === "pipeline") return <PipelineGame onExit={() => setMode("menu")} />;
  if (mode === "mcq") return <McqGame onExit={() => setMode("menu")} />;
  if (mode === "dpl-matcher") return <DplMatcherGame onExit={() => setMode("menu")} />;
  if (mode === "dpl-builder") return <DplBuilderGame onExit={() => setMode("menu")} />;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Arcade</h1>
          <p className="text-sm text-slate-400">
            Sharpen your DQL skills with fast-paced challenges. Scores are saved to your profile.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5" data-tour-target="arcade-modes">
          {MODE_CARDS.map((card, i) => {
            const stats = statsFor(card.id);
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode(card.id)}
                className={`glass-panel-strong rounded-xl border p-6 text-left transition-colors ${card.color}`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${card.iconBg}`}>
                  {card.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-1">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{card.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="text-slate-300 font-medium">Best: {stats.best}</span>
                  <span>&#183;</span>
                  <span>Played: {stats.played}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Recent scores */}
        {gameScores.length > 0 && (
          <div className="space-y-3" data-tour-target="arcade-scores">
            <h2 className="text-sm font-semibold text-slate-300">Recent Scores</h2>
            <div className="grid gap-2">
              {gameScores.slice(-10).reverse().map((score, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between glass-panel rounded-lg px-4 py-2.5 border border-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                      score.mode === "timer"
                        ? "text-rose-400 border-rose-400/20 bg-rose-400/10"
                        : score.mode === "pipeline"
                        ? "text-cyan-400 border-cyan-400/20 bg-cyan-400/10"
                        : score.mode === "mcq"
                        ? "text-amber-400 border-amber-400/20 bg-amber-400/10"
                        : score.mode === "dpl-matcher"
                        ? "text-violet-400 border-violet-400/20 bg-violet-400/10"
                        : "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
                    }`}>
                      {score.mode}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(score.date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-200">
                    {score.score} / {score.maxScore}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
