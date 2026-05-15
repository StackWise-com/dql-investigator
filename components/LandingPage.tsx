"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { CoffeeModal } from "./CoffeeModal";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/lib/auth/useAuth";
import { StreakBanner } from "./landing/StreakBanner";
import { ContinueCard } from "./landing/ContinueCard";
import { TrackGrid } from "./landing/TrackCard";
import { getAllScenarios } from "@/lib/dql/scenario-registry";

// Quick-nav items (the 4 main modes)
const NAV_MODES = [
  { id: "learn",     label: "Learn",     phaseIndex: 0, desc: "Codex & guided lessons",   color: "text-slate-200" },
  { id: "workbench", label: "Workbench", phaseIndex: 1, desc: "Free-form pipeline play",   color: "text-slate-200" },
  { id: "cases",     label: "Cases",     phaseIndex: 2, desc: "Solve real incidents",       color: "text-slate-200" },
  { id: "arcade",    label: "Arcade",    phaseIndex: 3, desc: "Timer rush & quiz modes",    color: "text-slate-200" },
];

export function LandingPage() {
  const [coffeeOpen, setCoffeeOpen] = useState(false);
  const userEmail = useInvestigatorStore((s) => s.userEmail);
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const avatarEmoji = useInvestigatorStore((s) => s.avatarEmoji);
  const setPhase = useInvestigatorStore((s) => s.setPhase);
  const setShowLanding = useInvestigatorStore((s) => s.setShowLanding);
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const { signOut } = useAuth();

  const handleGoToPhase = (phaseIndex: number) => {
    setPhase(phaseIndex);
    setShowLanding(false);
  };

  const handleStartLesson = (trackId: string, lessonId: string) => {
    // Find the scenario and load it
    const allScenarios = getAllScenarios();
    const scenario = allScenarios.find((s) => s.id === lessonId);
    if (scenario) {
      setScenario(scenario);
      setPhase(2); // Cases phase to render the scenario
      setShowLanding(false);
    } else {
      // Fallback to Learn phase
      setPhase(0);
      setShowLanding(false);
    }
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Top nav */}
      <header className="h-12 flex items-center justify-between px-6 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="6" />
            <path d="M16 16l4 4" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-semibold text-slate-100 tracking-tight">DQL Detective</span>
        </div>
        {/* Mode tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => handleGoToPhase(m.phaseIndex)}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              {m.label}
            </button>
          ))}
        </nav>
        {/* User */}
        <div className="flex items-center gap-2">
          <UserAvatar email={userEmail} xp={totalXP} size={28} showTitle emoji={avatarEmoji} />
          <a href="/profile" className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-white/[0.04]">Profile</a>
          <a href="/leaderboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-white/[0.04]">Leaderboard</a>
          <button
            onClick={signOut}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors px-2 py-1 rounded hover:bg-white/[0.04]"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Streak/rank bar */}
      <StreakBanner />

      {/* Main content — scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {/* Continue / first-time card */}
          <section>
            <ContinueCard
              onResume={handleStartLesson}
              onStartFresh={() => handleGoToPhase(0)}
            />
          </section>

          {/* Learning tracks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-100">Learning Tracks</h2>
              <span className="text-xs text-slate-500">5 tracks · 60+ scenarios · always free</span>
            </div>
            <TrackGrid onStart={handleStartLesson} />
          </section>

          {/* Quick modes */}
          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-4">Quick access</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {NAV_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleGoToPhase(m.phaseIndex)}
                  className="group flex flex-col gap-2 p-4 bg-slate-900/60 border border-white/[0.06] rounded-xl hover:bg-slate-900 hover:border-white/[0.10] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="text-sm font-semibold text-slate-200">{m.label}</span>
                  <span className="text-xs text-slate-500">{m.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <a href="/terms" className="hover:text-slate-400 transition-colors">Terms</a>
              <a href="/leaderboard" className="hover:text-slate-400 transition-colors">Leaderboard</a>
            </div>
            <motion.button
              onClick={() => setCoffeeOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-400/20 text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/8 text-xs font-medium transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              ☕ Buy me a coffee
            </motion.button>
          </footer>
        </div>
      </main>

      <CoffeeModal isOpen={coffeeOpen} onClose={() => setCoffeeOpen(false)} />
    </div>
  );
}
