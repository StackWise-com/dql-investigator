"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { runPipeline } from "@/lib/dql/engine";
import { calculateCaseStepXP } from "@/lib/progression";
import { ChibiCharacter } from "@/components/characters";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import type { FunScenario } from "@/lib/dql/fun-scenarios";

export function CaseNarrativePanel() {
  const activeScenario = useInvestigatorStore((s) => s.activeScenario) as FunScenario | null;
  const currentStepIndex = useInvestigatorStore((s) => s.currentStepIndex);
  const nextStep = useInvestigatorStore((s) => s.nextStep);
  const prevStep = useInvestigatorStore((s) => s.prevStep);
  const pipeline = useInvestigatorStore((s) => s.pipeline);
  const addXP = useInvestigatorStore((s) => s.addXP);
  const markScenarioComplete = useInvestigatorStore((s) => s.markScenarioComplete);
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const setHasSeenDemo = useInvestigatorStore((s) => s.setHasSeenDemo);

  const [checkResult, setCheckResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showNarrative, setShowNarrative] = useState(true);
  const [characterMood, setCharacterMood] = useState<"neutral" | "thinking" | "excited" | "victory">("neutral");
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // Derive mood from state
  useEffect(() => {
    if (checkResult?.correct) {
      setCharacterMood("excited");
    } else if (pipeline.length > 0) {
      setCharacterMood("thinking");
    } else {
      setCharacterMood("neutral");
    }
  }, [checkResult, pipeline.length]);

  const step = activeScenario?.steps[currentStepIndex];

  const themeColor = activeScenario?.themeColor || "cyan";
  const characterId = useMemo(() => {
    const id = activeScenario?.character || "detective";
    return id as import("@/components/characters").ChibiCharacterId;
  }, [activeScenario?.character]);

  const handleCheck = () => {
    if (!step || !activeScenario) return;
    const sampleData = step.sampleData;
    const expected = step.expectedPipeline;

    if (pipeline.length === 0) {
      setCheckResult({ correct: false, message: "Build a pipeline first, Detective!" });
      return;
    }

    try {
      const result = runPipeline(pipeline, sampleData);
      const expectedResult = runPipeline(expected, sampleData);

      const lastResult = result[result.length - 1];
      const lastExpected = expectedResult[expectedResult.length - 1];

      const resultKeys = Object.keys(lastResult.data[0] || {}).map((k) => k.toLowerCase());
      const expectedKeys = Object.keys(lastExpected.data[0] || {}).map((k) => k.toLowerCase());

      const keysMatch =
        resultKeys.length === expectedKeys.length &&
        resultKeys.every((k) => expectedKeys.includes(k));

      const valuesMatch =
        lastResult.recordCount === lastExpected.recordCount &&
        rowsEquivalent(lastResult.data, lastExpected.data);

      if ((keysMatch || valuesMatch) && lastResult.recordCount === lastExpected.recordCount) {
        const xp = calculateCaseStepXP(currentStepIndex, activeScenario.steps.length);
        setCheckResult({ correct: true, message: `Correct! +${xp} XP` });
        addXP(xp);
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => {
          setCheckResult(null);
          if (currentStepIndex < activeScenario.steps.length - 1) {
            nextStep();
          } else {
            markScenarioComplete(activeScenario.id);
            if (isDemo) setHasSeenDemo(true);
          }
        }, 1500);
      } else {
        setCheckResult({
          correct: false,
          message: `Result doesn't match. Expected ${lastExpected.recordCount} rows with columns: ${expectedKeys.join(", ")}. Got ${lastResult.recordCount} rows with columns: ${resultKeys.join(", ")}.`,
        });
      }
    } catch (e) {
      setCheckResult({ correct: false, message: "Pipeline execution failed. Check your syntax." });
    }
  };

  const isDemo = activeScenario?.id === "demo-001";

  const handleSkip = () => {
    if (isDemo) {
      setHasSeenDemo(true);
      setScenario(null);
      return;
    }
    if (currentStepIndex >= (activeScenario?.steps.length || 1) - 1) {
      if (activeScenario) markScenarioComplete(activeScenario.id);
    } else {
      nextStep();
    }
  };

  if (!activeScenario || !step) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-6">
        <div className="w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-cyan-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-slate-500">No active case.</p>
        <p className="text-xs text-slate-600">Select a scenario to begin your investigation.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ConfettiBurst trigger={!!checkResult?.correct} color={THEME_COLORS[themeColor as keyof typeof THEME_COLORS]} />

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Case File</span>
          <span className="text-[10px] text-slate-600">—</span>
          <span className="text-xs text-slate-300 font-medium">{activeScenario.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <button
              onClick={() => {
                setHasSeenDemo(true);
                setScenario(null);
              }}
              className="text-[10px] text-amber-400 hover:text-amber-300"
            >
              Skip Tutorial →
            </button>
          )}
          <button onClick={() => setScenario(null)} className="text-[10px] text-slate-500 hover:text-slate-300">
            Close Case
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Step progress */}
        <div className="flex items-center gap-2">
          {activeScenario.steps.map((s, i) => (
            <div
              key={s.id}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentStepIndex
                  ? "bg-cyan-400"
                  : i < currentStepIndex
                  ? "bg-emerald-400"
                  : "bg-slate-700"
              }`}
            />
          ))}
          <span className="text-[10px] text-slate-500 ml-1">
            Step {currentStepIndex + 1} / {activeScenario.steps.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Narrative + Character */}
            <div className="glass-panel-strong rounded-xl p-5 space-y-4 relative overflow-hidden" data-tour-target="case-brief">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">Mission Brief</span>
                    <button
                      onClick={() => setShowNarrative(!showNarrative)}
                      className="text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      {showNarrative ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showNarrative && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-sans italic leading-relaxed text-slate-300"
                    >
                      {step.narration}
                    </motion.p>
                  )}
                </div>

                <div className="shrink-0">
                  <ChibiCharacter character={characterId} mood={characterMood} size={120} />
                </div>
              </div>
            </div>

            {/* Objective */}
            <div className="glass-panel rounded-xl p-4 space-y-2" data-tour-target="case-objective">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">Objective</span>
              <p className="text-sm text-slate-200">{step.goal}</p>
            </div>

            {/* Hint */}
            <div className="glass-panel rounded-xl p-4 space-y-2" data-tour-target="case-hint">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">Hint</span>
                <button onClick={() => setShowHint(!showHint)} className="text-[10px] text-slate-500 hover:text-slate-300">
                  {showHint ? "Hide" : "Show"}
                </button>
              </div>
              {showHint && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-400"
                >
                  {step.hint}
                </motion.p>
              )}
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="shrink-0 p-4 border-t border-white/[0.06] space-y-2">
        <AnimatePresence>
          {checkResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={`text-[10px] rounded-md p-2 ${
                checkResult.correct
                  ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                  : "bg-rose-400/10 text-rose-400 border border-rose-400/20"
              }`}
            >
              {checkResult.message}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06]"
          >
            Prev
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheck}
            data-tour-target="case-check"
            className="flex-[2] py-2.5 rounded-lg text-xs font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30"
          >
            Next Clue
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSkip}
            disabled={currentStepIndex >= activeScenario.steps.length - 1}
            className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06]"
          >
            Skip
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function rowsEquivalent(a: Record<string, unknown>[], b: Record<string, unknown>[]): boolean {
  if (a.length !== b.length) return false;
  const serialize = (row: Record<string, unknown>) =>
    Object.values(row)
      .map((v) => String(v))
      .sort()
      .join("|");
  const aSorted = a.map(serialize).sort();
  const bSorted = b.map(serialize).sort();
  return aSorted.every((v, i) => v === bSorted[i]);
}

const THEME_COLORS: Record<string, string> = {
  amber: "#f59e0b",
  red: "#ef4444",
  cyan: "#22d3ee",
  slate: "#94a3b8",
  purple: "#a855f7",
  emerald: "#34d399",
  blue: "#3b82f6",
  yellow: "#eab308",
};
