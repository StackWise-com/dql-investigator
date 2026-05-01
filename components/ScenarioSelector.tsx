"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { scenarios } from "@/lib/dql/scenarios";
import { getPriceForCountry } from "@/lib/pricing";
// Payments coming soon

const DIFFICULTY_COLORS = {
  Beginner: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  Intermediate: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  Advanced: "bg-rose-400/10 text-rose-400 border-rose-400/20",
};

const GUEST_FREE = new Set(["case-001", "case-006", "case-007", "case-008", "case-009"]);
const LOGGED_IN_FREE = new Set([
  "case-001", "case-006", "case-007", "case-008", "case-009",
  "case-010", "case-011", "case-012", "case-013", "case-014",
  "case-015", "case-016", "case-017", "case-018", "case-019",
]);

function getScenarioTag(id: string): string | null {
  const tags: Record<string, string> = {
    "case-001": "fetch logs",
    "case-002": "fetch events",
    "case-003": "fetch bizevents",
    "case-004": "fetch spans",
    "case-005": "makeTimeseries",
    "case-006": "filter WARN",
    "case-007": "filter critical",
    "case-008": "dedup",
    "case-009": "limit",
    "case-010": "search",
    "case-011": "filterOut",
    "case-012": "summarize",
    "case-013": "sum",
    "case-014": "makeTimeseries",
    "case-015": "sort",
    "case-016": "compound filter",
    "case-017": "revenue",
    "case-018": "returns",
    "case-019": "scale-up",
    "case-020": "fieldsAdd",
    "case-021": "fieldsRename",
    "case-022": "expand",
    "case-023": "parse",
    "case-024": "dedup",
    "case-025": "limit",
    "case-026": "avg",
    "case-027": "parse",
    "case-028": "makeTimeseries",
    "case-029": "fieldsRemove",
    "case-030": "parse",
    "case-031": "limit",
    "case-032": "in array",
    "case-033": "fieldsRemove",
    "case-034": "makeTimeseries",
    "case-035": "if()",
    "case-036": "timeseries+by",
    "case-037": "fieldsAdd+if",
    "case-038": "tier+sum",
    "case-039": "parse+sort",
    "case-040": "avg+limit",
  };
  return tags[id] || null;
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-2.25 0h13.5a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-6a1.5 1.5 0 011.5-1.5z" />
    </svg>
  );
}

export function ScenarioSelector() {
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);
  const unlockedScenarios = useInvestigatorStore((s) => s.unlockedScenarios);
  const isPremium = useInvestigatorStore((s) => s.isPremium);
  const setIsPremium = useInvestigatorStore((s) => s.setIsPremium);
  const userCountry = useInvestigatorStore((s) => s.userCountry);
  const userEmail = useInvestigatorStore((s) => s.userEmail);
  const isGuest = useInvestigatorStore((s) => s.isGuest);

  const price = getPriceForCountry(userCountry);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [showPremiumInfo, setShowPremiumInfo] = useState(false);

  const unlockedSet = new Set(unlockedScenarios);

  const handlePremiumPay = () => {
    setComingSoonOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Cases</h1>
          <p className="text-sm text-slate-400">
            Select a case to investigate. Complete free cases to unlock more. Upgrade to Premium for full access.
          </p>
        </div>

        <div className="grid gap-4">
          {scenarios.map((scenario, i) => {
            const isCompleted = completedScenarios.includes(scenario.id);
            const effectiveFree = isGuest && !userEmail ? GUEST_FREE : LOGGED_IN_FREE;
            const isUnlocked = unlockedSet.has(scenario.id) || effectiveFree.has(scenario.id);
            const requiresPremium = !isUnlocked && !isPremium;
            const tag = getScenarioTag(scenario.id);

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <motion.button
                  whileHover={isUnlocked || isPremium ? { scale: 1.01, y: -2 } : {}}
                  whileTap={isUnlocked || isPremium ? { scale: 0.99 } : {}}
                  onClick={() => {
                    if (isUnlocked || isPremium) {
                      setScenario(scenario);
                    }
                  }}
                  disabled={!isUnlocked && !isPremium}
                  className={`w-full glass-panel-strong rounded-xl p-5 text-left border transition-colors ${
                    isUnlocked || isPremium
                      ? "border-white/[0.06] hover:border-cyan-400/20"
                      : "border-white/[0.03] opacity-70 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-100">{scenario.title}</h3>
                        {isCompleted && (
                          <span className="text-emerald-400 text-xs">&#10003; Completed</span>
                        )}
                        {!isUnlocked && !isPremium && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                            <LockIcon /> Premium
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{scenario.company}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        DIFFICULTY_COLORS[scenario.difficulty]
                      }`}
                    >
                      {scenario.difficulty}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">{scenario.briefing}</p>

                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <span className="text-[10px] text-slate-500">{scenario.steps.length} steps</span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">+{scenario.steps.length * 25} XP</span>
                    {tag && (
                      <span className="text-[10px] font-mono font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    )}
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {showPremiumInfo && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="glass-panel-strong rounded-xl border border-amber-400/20 p-5 space-y-3"
            >
              <h3 className="text-base font-semibold text-amber-300">Premium Access</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Unlock all advanced cases and receive 2x XP rewards.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowPremiumInfo(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                >
                  Maybe later
                </button>
                <button
                  onClick={() => {
                    setIsPremium(true);
                    setShowPremiumInfo(false);
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                >
                  Unlock Premium (Demo)
                </button>
                <button
                  onClick={handlePremiumPay}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-colors"
                >
                  Unlock Premium
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {comingSoonOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setComingSoonOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm glass-panel-strong rounded-xl border border-amber-400/20 p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-amber-300">Coming Soon</h2>
                  <button
                    onClick={() => setComingSoonOpen(false)}
                    className="text-slate-500 hover:text-slate-300 text-sm"
                  >
                    &#10005;
                  </button>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Payments are coming soon with more exciting cases to solve and an exciting gaming mode where you can be the DQL Detective.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setComingSoonOpen(false)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    Got it
                  </button>
                  <button
                    onClick={() => {
                      setIsPremium(true);
                      setComingSoonOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-colors"
                  >
                    Unlock Premium (Demo)
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
