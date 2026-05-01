"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { CoffeeModal } from "./CoffeeModal";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/lib/auth/useAuth";
import landingImage from "@/images/landing_page.png";

interface Hotspot {
  id: string;
  label: string;
  phaseIndex: number;
  x: string;
  y: string;
  tooltip: string;
  icon: React.ReactNode;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: "learn",
    label: "Learn",
    phaseIndex: 0,
    x: "7%",
    y: "54%",
    tooltip: "Study DQL fundamentals, commands, operators, and functions in the Codex.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.987 8.987 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    id: "sandbox",
    label: "Sandbox",
    phaseIndex: 1,
    x: "50%",
    y: "28%",
    tooltip: "Build queries freely with fetch, filter, sort, summarize, and more. No pressure.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  },
  {
    id: "visualize",
    label: "Visualize",
    phaseIndex: 2,
    x: "82%",
    y: "30%",
    tooltip: "See how each DQL command transforms data with real-time visual signatures.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
  {
    id: "cases",
    label: "Cases",
    phaseIndex: 3,
    x: "48%",
    y: "58%",
    tooltip: "Solve real-world incidents. Build pipelines to investigate breaches, slow queries, and outages.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25" />
      </svg>
    ),
  },
  {
    id: "arcade",
    label: "Arcade",
    phaseIndex: 4,
    x: "72%",
    y: "65%",
    tooltip: "Game modes and challenges. Timer rush, pipeline builder, and DQL quiz.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
      </svg>
    ),
  },
];

function HotspotButton({ hotspot }: { hotspot: Hotspot }) {
  const [hovered, setHovered] = useState(false);
  const setPhase = useInvestigatorStore((s) => s.setPhase);
  const setShowLanding = useInvestigatorStore((s) => s.setShowLanding);

  const handleClick = () => {
    setPhase(hotspot.phaseIndex);
    setShowLanding(false);
  };

  return (
    <motion.button
      className="absolute flex flex-col items-center gap-1 group"
      style={{ left: hotspot.x, top: hotspot.y, transform: "translate(-50%, -50%)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + HOTSPOTS.indexOf(hotspot) * 0.1 }}
    >
      <div
        className={`relative px-7 py-3.5 rounded-full text-base font-semibold tracking-wide backdrop-blur-md border transition-colors shadow-lg shadow-black/30 ${
          hotspot.id === "learn"
            ? "bg-amber-400/15 text-amber-300 border-amber-400/30 hover:bg-amber-400/25"
            : hotspot.id === "sandbox"
            ? "bg-cyan-400/15 text-cyan-300 border-cyan-400/30 hover:bg-cyan-400/25"
            : hotspot.id === "visualize"
            ? "bg-violet-400/15 text-violet-300 border-violet-400/30 hover:bg-violet-400/25"
            : hotspot.id === "arcade"
            ? "bg-rose-400/15 text-rose-300 border-rose-400/30 hover:bg-rose-400/25"
            : "bg-emerald-400/15 text-emerald-300 border-emerald-400/30 hover:bg-emerald-400/25"
        }`}
      >
        <div className="flex items-center gap-2">
          {hotspot.icon}
          <span>{hotspot.label}</span>
        </div>

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 z-50"
            >
              <div className="glass-panel-strong rounded-lg border border-white/[0.08] p-3 shadow-xl text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {hotspot.label}
                </p>
                <p className="text-xs text-slate-200 leading-relaxed">{hotspot.tooltip}</p>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-900/90 border-r border-b border-white/[0.08] rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* subtle pulsing ring */}
      <motion.div
        className={`absolute inset-0 rounded-full ${
          hotspot.id === "learn"
            ? "bg-amber-400/20"
            : hotspot.id === "sandbox"
            ? "bg-cyan-400/20"
            : hotspot.id === "visualize"
            ? "bg-violet-400/20"
            : hotspot.id === "arcade"
            ? "bg-rose-400/20"
            : "bg-emerald-400/20"
        }`}
        animate={{ scale: [1, 1.4, 1.4], opacity: [0.3, 0, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
    </motion.button>
  );
}

export function LandingPage() {
  const [coffeeOpen, setCoffeeOpen] = useState(false);
  const userEmail = useInvestigatorStore((s) => s.userEmail);
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
  };

  const gameScores = useInvestigatorStore((s) => s.gameScores);
  const gameHighScores = useInvestigatorStore((s) => s.gameHighScores);
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);

  const arcadeStats = (() => {
    const timerScores = gameScores.filter((s) => s.mode === "timer");
    const pipelineScores = gameScores.filter((s) => s.mode === "pipeline");
    const mcqScores = gameScores.filter((s) => s.mode === "mcq");
    const all = gameScores;
    return {
      totalGames: all.length,
      avgScore: all.length > 0 ? Math.round(all.reduce((a, s) => a + s.score, 0) / all.length) : 0,
      bestStreak: (() => {
        let best = 0;
        let current = 0;
        for (const s of all) {
          if (s.score > 0) {
            current++;
            best = Math.max(best, current);
          } else {
            current = 0;
          }
        }
        return best;
      })(),
      timer: { played: timerScores.length, best: gameHighScores.timer ?? 0 },
      pipeline: { played: pipelineScores.length, best: gameHighScores.pipeline ?? 0 },
      mcq: { played: mcqScores.length, best: gameHighScores.mcq ?? 0 },
    };
  })();

  return (
    <div className="h-full w-full relative overflow-hidden bg-slate-950">
      {/* Background image */}
      <img
        src={landingImage.src}
        alt="DQL Investigator"
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/40" />

      {/* Title overlay */}
      <motion.div
        className="absolute top-6 left-8 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" />
          <span className="text-sm font-semibold tracking-wide text-cyan-400">DQL INVESTIGATOR</span>
        </div>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Make the invisible visible. Learn Dynatrace Query Language by investigating real incidents.
        </p>
      </motion.div>

      {/* Auth buttons / Avatar */}
      <motion.div
        className="absolute top-6 right-8 z-10 flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <UserAvatar email={userEmail} xp={totalXP} size={32} showTitle />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="px-2 py-1 rounded-md text-[10px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          Log out
        </motion.button>
      </motion.div>

      {/* Arcade Stats Card */}
      {arcadeStats.totalGames > 0 && (
        <motion.div
          className="absolute bottom-6 right-8 z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <div className="glass-panel-strong rounded-xl border border-white/[0.06] p-4 w-56 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Arcade Stats</span>
              <span className="text-[10px] text-slate-500">{completedScenarios.length} cases solved</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Games", value: arcadeStats.totalGames },
                { label: "Avg", value: arcadeStats.avgScore },
                { label: "Streak", value: arcadeStats.bestStreak },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-sm font-bold text-slate-200">{stat.value}</div>
                  <div className="text-[9px] text-slate-500 uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="h-px bg-white/[0.04]" />
            <div className="space-y-1.5">
              {[
                { mode: "Timer", best: arcadeStats.timer.best, played: arcadeStats.timer.played, color: "text-rose-400" },
                { mode: "Pipeline", best: arcadeStats.pipeline.best, played: arcadeStats.pipeline.played, color: "text-cyan-400" },
                { mode: "Quiz", best: arcadeStats.mcq.best, played: arcadeStats.mcq.played, color: "text-amber-400" },
              ].map((m) => (
                <div key={m.mode} className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">{m.mode}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{m.played} played</span>
                    <span className={`font-semibold ${m.color}`}>{m.best}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Hotspot buttons */}
      {HOTSPOTS.map((hotspot) => (
        <HotspotButton key={hotspot.id} hotspot={hotspot} />
      ))}

      {/* Bottom hint */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <p className="text-[10px] text-slate-500 tracking-wider">
          Hover over any glowing button to learn where it leads
        </p>
      </motion.div>

      {/* Coffee button */}
      <motion.button
        className="absolute bottom-6 left-8 z-10 flex items-center gap-2 px-7 py-3.5 rounded-full glass-panel-strong border border-amber-400/20 text-amber-300 hover:bg-amber-400/10 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCoffeeOpen(true)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <span className="text-lg">☕</span>
        <span className="text-sm font-medium">Buy me a coffee</span>
      </motion.button>

      <CoffeeModal isOpen={coffeeOpen} onClose={() => setCoffeeOpen(false)} />
    </div>
  );
}
