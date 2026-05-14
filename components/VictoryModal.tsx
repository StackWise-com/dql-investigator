"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { calculateCaseStepXP } from "@/lib/progression";
import { ChibiCharacter } from "@/components/characters";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import type { FunScenario } from "@/lib/dql/fun-scenarios";

export function VictoryModal() {
  const activeScenario = useInvestigatorStore((s) => s.activeScenario) as FunScenario | null;
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const setPhase = useInvestigatorStore((s) => s.setPhase);

  const isComplete = activeScenario && completedScenarios.includes(activeScenario.id);

  const scenarioXP = activeScenario
    ? activeScenario.steps.reduce(
        (acc, _, i) => acc + calculateCaseStepXP(i, activeScenario.steps.length),
        0
      )
    : 0;

  const characterId = (activeScenario?.character || "detective") as import("@/components/characters").ChibiCharacterId;

  const handleShare = () => {
    const text = `I just solved "${activeScenario?.title}" on DQL Detective and earned ${scenarioXP} XP! Can you crack the case?`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <AnimatePresence>
      {isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <ConfettiBurst trigger={true} color="#22d3ee" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="glass-panel-strong rounded-2xl border border-emerald-400/30 p-8 max-w-md w-full mx-4 text-center space-y-6 relative overflow-hidden"
          >
            {/* Character */}
            <div className="absolute -top-6 right-4 opacity-20 pointer-events-none">
              <ChibiCharacter character={characterId} mood="victory" size={160} />
            </div>

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
              <h2 className="text-2xl font-semibold text-slate-100">Case Closed!</h2>
              <p className="text-sm text-slate-400">{activeScenario?.title}</p>
              <p className="text-xs text-slate-500">Partner: {activeScenario?.characterName}</p>
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className="flex-1 py-3 rounded-lg text-sm font-medium bg-white/5 text-slate-300 hover:bg-white/10 border border-white/[0.06]"
              >
                Share Rank
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
