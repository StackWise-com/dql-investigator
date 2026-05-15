"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { runPipeline } from "@/lib/dql/engine";
import { calculateCaseStepXP } from "@/lib/progression";
import { ChibiCharacter } from "@/components/characters";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import type { FunScenario } from "@/lib/dql/fun-scenarios";

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

function rowsEquivalent(a: Record<string, unknown>[], b: Record<string, unknown>[]): boolean {
  if (a.length !== b.length) return false;
  const serialize = (row: Record<string, unknown>) =>
    Object.values(row).map((v) => String(v)).sort().join("|");
  const aSorted = a.map(serialize).sort();
  const bSorted = b.map(serialize).sort();
  return aSorted.every((v, i) => v === bSorted[i]);
}

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
  const [characterMood, setCharacterMood] = useState<"neutral" | "thinking" | "excited" | "victory">("neutral");
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (checkResult?.correct) setCharacterMood("excited");
    else if (pipeline.length > 0) setCharacterMood("thinking");
    else setCharacterMood("neutral");
  }, [checkResult, pipeline.length]);

  const step = activeScenario?.steps[currentStepIndex];
  const themeColor = activeScenario?.themeColor || "cyan";
  const characterId = useMemo(
    () => (activeScenario?.character || "detective") as import("@/components/characters").ChibiCharacterId,
    [activeScenario?.character]
  );

  const totalSteps = activeScenario?.steps.length ?? 1;
  const estimatedMinutes = Math.round(totalSteps * 2.5);

  const handleCheck = () => {
    if (!step || !activeScenario) return;
    if (pipeline.length === 0) {
      setCheckResult({ correct: false, message: "Build a pipeline first." });
      return;
    }
    try {
      const result = runPipeline(pipeline, step.sampleData);
      const expectedResult = runPipeline(step.expectedPipeline, step.sampleData);
      const lastResult = result[result.length - 1];
      const lastExpected = expectedResult[expectedResult.length - 1];
      const resultKeys = Object.keys(lastResult.data[0] || {}).map((k) => k.toLowerCase());
      const expectedKeys = Object.keys(lastExpected.data[0] || {}).map((k) => k.toLowerCase());
      const keysMatch =
        resultKeys.length === expectedKeys.length && resultKeys.every((k) => expectedKeys.includes(k));
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
          message: `Expected ${lastExpected.recordCount} rows with [${expectedKeys.join(", ")}]. Got ${lastResult.recordCount} rows with [${resultKeys.join(", ")}].`,
        });
      }
    } catch {
      setCheckResult({ correct: false, message: "Pipeline error — check your syntax." });
    }
  };

  const isDemo = activeScenario?.id === "demo-001";

  const handleSkip = () => {
    if (isDemo) { setHasSeenDemo(true); setScenario(null); return; }
    if (currentStepIndex >= (activeScenario?.steps.length || 1) - 1) {
      if (activeScenario) markScenarioComplete(activeScenario.id);
    } else {
      nextStep();
    }
  };

  if (!activeScenario || !step) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-6">
        <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-slate-500">No active case.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ConfettiBurst trigger={!!checkResult?.correct} color={THEME_COLORS[themeColor]} />

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-200 truncate">{activeScenario.title}</span>
          <span className="text-xs text-slate-600 shrink-0">· ≈ {estimatedMinutes} min</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDemo && (
            <button
              onClick={() => { setHasSeenDemo(true); setScenario(null); }}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Skip Tutorial →
            </button>
          )}
          <button
            onClick={() => setScenario(null)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Character + Step progress */}
        <div className="flex items-start gap-4 px-5 pt-4 pb-3">
          <div className="flex-1">
            {/* Step dots */}
            <div className="flex items-center gap-1.5 mb-3">
              {activeScenario.steps.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStepIndex ? "w-4 bg-accent" : i < currentStepIndex ? "w-2 bg-emerald-400" : "w-2 bg-slate-700"
                  }`}
                />
              ))}
              <span className="text-xs text-slate-600 ml-1">
                {currentStepIndex + 1} / {activeScenario.steps.length}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1">Partner: {activeScenario.characterName}</p>
          </div>
          <div className="shrink-0">
            <ChibiCharacter character={characterId} mood={characterMood} size={90} />
          </div>
        </div>

        {/* Scrollable content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="px-5 pb-5 space-y-5"
            data-tour-target="case-brief"
          >
            {/* Narration */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">The scene</p>
              <p className="text-sm leading-relaxed text-slate-300 italic">{step.narration}</p>
            </div>

            {/* Objective */}
            <div data-tour-target="case-objective">
              <p className="text-xs font-medium text-slate-500 mb-2">Your task</p>
              <p className="text-sm text-slate-200 leading-relaxed">{step.goal}</p>
            </div>

            {/* Hint */}
            <div data-tour-target="case-hint">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg className={`w-3 h-3 transition-transform ${showHint ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                {showHint ? "Hide hint" : "Show hint"}
              </button>
              <AnimatePresence>
                {showHint && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm text-slate-400 leading-relaxed mt-2 pl-4 border-l border-white/[0.08]"
                  >
                    {step.hint}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="shrink-0 p-4 border-t border-white/[0.06] space-y-2">
        <AnimatePresence>
          {checkResult && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-xs rounded-md p-2.5 ${
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
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleCheck}
            data-tour-target="case-check"
            className="flex-[2] py-2 rounded-lg text-xs font-semibold bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Check answer
          </button>
          <button
            onClick={handleSkip}
            disabled={currentStepIndex >= activeScenario.steps.length - 1 && !isDemo}
            className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
