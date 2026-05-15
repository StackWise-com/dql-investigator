"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";

export function WelcomeModal() {
  const hasSeenWelcome = useInvestigatorStore((s) => s.hasSeenWelcome);
  const setHasSeenWelcome = useInvestigatorStore((s) => s.setHasSeenWelcome);
  const setShowLanding = useInvestigatorStore((s) => s.setShowLanding);
  const setPhase = useInvestigatorStore((s) => s.setPhase);
  const [step, setStep] = useState(0);

  const handleClose = () => {
    setHasSeenWelcome(true);
  };

  const handleStart = () => {
    setHasSeenWelcome(true);
    setPhase(0);
    setShowLanding(false);
  };

  const STEPS = [
    {
      title: "Welcome, Detective",
      body: "DQL Detective turns Dynatrace Query Language into a game. You solve cases, build pipelines, and earn XP — all in your browser, completely free.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l4 4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "How it works",
      body: "Pick a learning track or jump straight into a case. Each case is a real observability mystery. Write DQL queries to find clues, filter evidence, and crack the story.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
        </svg>
      ),
    },
    {
      title: "Tracks, Cases & Arcade",
      body: "Start with the DQL Fundamentals track for guided lessons. Or browse 40+ story-driven cases starring Sherlock, Spider-Man, Santa and more. Sharpen your skills in Arcade mode when you need a break from the mystery.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.982-3.172M14.25 9.497a7.454 7.454 0 01-3.172.982M9.497 14.25a7.454 7.454 0 00-3.172.982M14.25 9.497a7.454 7.454 0 00-3.172-.982M9.497 9.497a7.454 7.454 0 013.172-.982" />
        </svg>
      ),
    },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {!hasSeenWelcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md mx-6 bg-slate-900 border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-accent" : "w-1.5 bg-white/[0.08]"
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                {current.icon}
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-3 mb-8">
              <h2 className="text-lg font-semibold text-slate-100">{current.title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{current.body}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
                >
                  Back
                </button>
              )}
              {isLast ? (
                <button
                  onClick={handleStart}
                  className="flex-1 py-2.5 rounded-lg bg-accent text-slate-950 text-sm font-semibold hover:bg-accent/90 transition-colors"
                >
                  Start learning →
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="flex-1 py-2.5 rounded-lg bg-accent text-slate-950 text-sm font-semibold hover:bg-accent/90 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-3 text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Skip intro
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
