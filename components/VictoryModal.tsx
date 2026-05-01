"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { calculateCaseStepXP } from "@/lib/progression";

const PREMIUM_IDS = new Set(["case-002", "case-003", "case-004", "case-005"]);

function isPremiumScenario(id: string): boolean {
  return (
    PREMIUM_IDS.has(id) ||
    id.startsWith("case-02") ||
    id.startsWith("case-03") ||
    id.startsWith("case-04")
  );
}

export function VictoryModal() {
  const activeScenario = useInvestigatorStore((s) => s.activeScenario);
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const setPhase = useInvestigatorStore((s) => s.setPhase);

  const isComplete = activeScenario && completedScenarios.includes(activeScenario.id);

  const scenarioXP = activeScenario
    ? activeScenario.steps.reduce(
        (acc, _, i) =>
          acc + calculateCaseStepXP(i, activeScenario.steps.length, isPremiumScenario(activeScenario.id)),
        0
      )
    : 0;

  return (
    <AnimatePresence>
      {isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="glass-panel-strong rounded-2xl border border-emerald-400/30 p-8 max-w-md w-full mx-4 text-center space-y-6"
          >
            <div className="space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 rounded-full bg-emerald-400/15 flex items-center justify-center mx-auto border border-emerald-400/30"
              >
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h2 className="text-2xl font-semibold text-slate-100">Case Closed</h2>
              <p className="text-sm text-slate-400">{activeScenario?.title}</p>
            </div>

            <div className="glass-panel rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Steps completed</span>
                <span className="text-sm font-semibold text-cyan-400">{activeScenario?.steps.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Case earned</span>
                <span className="text-sm font-semibold text-emerald-400">+{scenarioXP} XP</span>
              </div>
              {activeScenario && isPremiumScenario(activeScenario.id) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-400/80">Premium 2× bonus</span>
                  <span className="text-xs font-medium text-amber-400">applied</span>
                </div>
              )}
              <div className="h-px bg-white/[0.06]" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Total XP</span>
                <span className="text-xl font-bold text-amber-400">{totalXP}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setScenario(null);
                  setPhase(3);
                }}
                className="flex-1 py-3 rounded-lg text-sm font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30"
              >
                New Case
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
