"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { runPipeline } from "@/lib/dql/engine";
import { calculateCaseStepXP } from "@/lib/progression";

const CASE_TAGS: Record<string, string> = {
  "case-001": "fetch logs", "case-002": "fetch events", "case-003": "fetch bizevents",
  "case-004": "fetch spans", "case-005": "makeTimeseries", "case-006": "filter WARN",
  "case-007": "filter critical", "case-008": "dedup", "case-009": "limit",
  "case-010": "search", "case-011": "filterOut", "case-012": "summarize",
  "case-013": "sum", "case-014": "makeTimeseries", "case-015": "sort",
  "case-016": "compound filter", "case-017": "revenue", "case-018": "returns",
  "case-019": "scale-up", "case-020": "fieldsAdd", "case-021": "fieldsRename",
  "case-022": "expand", "case-023": "parse", "case-024": "dedup", "case-025": "limit",
  "case-026": "avg", "case-027": "parse", "case-028": "makeTimeseries",
  "case-029": "fieldsRemove", "case-030": "parse", "case-031": "limit",
  "case-032": "in array", "case-033": "fieldsRemove", "case-034": "makeTimeseries",
  "case-035": "if()", "case-036": "timeseries+by", "case-037": "fieldsAdd+if",
  "case-038": "tier+sum", "case-039": "parse+sort", "case-040": "avg+limit",
  "dpl-001": "INTEGER parse", "dpl-002": "IPADDR parse", "dpl-003": "TIMESTAMP parse",
  "dpl-004": "ALPHA parse", "dpl-005": "multi-field", "dpl-006": "JSON parse",
  "dpl-007": "KVP parse", "dpl-008": "syslog parse", "dpl-009": "Apache parse",
  "dpl-010": "double matcher", "dpl-011": "UUID parse", "dpl-012": "full nginx",
  "combo-001": "parse+avg", "combo-002": "JSON+count", "combo-003": "firewall+filter",
  "combo-004": "syslog+failed", "combo-005": "Apache+404", "combo-006": "nginx+5xx",
  "combo-007": "latency+filter", "combo-008": "firewall+allow",
  "onboard-001": "fetch logs", "onboard-002": "filter ERROR", "onboard-003": "summarize count",
  "onboard-004": "group by host", "onboard-005": "sort desc", "onboard-006": "parse intro",
};

export function CaseFilePane() {
  const activeScenario = useInvestigatorStore((s) => s.activeScenario);
  const currentStepIndex = useInvestigatorStore((s) => s.currentStepIndex);
  const nextStep = useInvestigatorStore((s) => s.nextStep);
  const prevStep = useInvestigatorStore((s) => s.prevStep);
  const showNarrative = useInvestigatorStore((s) => s.showNarrative);
  const setShowNarrative = useInvestigatorStore((s) => s.setShowNarrative);
  const showHint = useInvestigatorStore((s) => s.showHint);
  const setShowHint = useInvestigatorStore((s) => s.setShowHint);
  const pipeline = useInvestigatorStore((s) => s.pipeline);
  const addXP = useInvestigatorStore((s) => s.addXP);
  const markScenarioComplete = useInvestigatorStore((s) => s.markScenarioComplete);
  const setScenario = useInvestigatorStore((s) => s.setScenario);

  const [checkResult, setCheckResult] = useState<{ correct: boolean; message: string } | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const step = activeScenario?.steps[currentStepIndex];

  const handleCheck = () => {
    if (!step || !activeScenario) return;
    const sampleData = step.sampleData;
    const expected = step.expectedPipeline;

    if (pipeline.length === 0) {
      setCheckResult({ correct: false, message: "Build a pipeline first." });
      return;
    }

    try {
      const result = runPipeline(pipeline, sampleData);
      const expectedResult = runPipeline(expected, sampleData);

      const lastResult = result[result.length - 1];
      const lastExpected = expectedResult[expectedResult.length - 1];

      const resultKeys = Object.keys(lastResult.data[0] || {});
      const expectedKeys = Object.keys(lastExpected.data[0] || {});

      const keysMatch =
        resultKeys.length === expectedKeys.length &&
        resultKeys.every((k) => expectedKeys.includes(k));

      if (keysMatch && lastResult.recordCount === lastExpected.recordCount) {
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
          }
        }, 1200);
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

  return (
    <div className="w-[28%] min-w-[280px] glass-panel border-r border-cyan-400/20 flex flex-col">
      <div className="h-10 flex items-center px-4 border-b border-white/[0.06] justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">Case File</span>
        {activeScenario && (
          <button
            onClick={() => setScenario(null)}
            className="text-[10px] text-slate-500 hover:text-slate-300"
          >
            Close Case
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeScenario ? (
          <>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-100">{activeScenario.title}</h2>
              <p className="text-xs text-slate-400">{activeScenario.company}</p>
              {CASE_TAGS[activeScenario.id] && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-teal-400 bg-teal-400/10 border border-teal-400/20 px-1.5 py-0.5 rounded">
                  <span className="text-teal-500/60">Learning:</span> {CASE_TAGS[activeScenario.id]}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeScenario.steps.map((s, i) => (
                <div
                  key={s.id}
                  className={`w-2 h-2 rounded-full ${
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
              {step && (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="glass-panel-strong rounded-lg p-4 space-y-3" data-tour-target="case-brief">
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

                  <div className="glass-panel rounded-lg p-4 space-y-2" data-tour-target="case-objective">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">Objective</span>
                    <p className="text-sm text-slate-200">{step.goal}</p>
                  </div>

                  <div className="glass-panel rounded-lg p-4 space-y-2" data-tour-target="case-hint">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">Hint</span>
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="text-[10px] text-slate-500 hover:text-slate-300"
                      >
                        {showHint ? "Hide" : "Show"}
                      </button>
                    </div>
                    {showHint && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-slate-400"
                      >
                        {step.hint}
                      </motion.p>
                    )}
                  </div>

                  {step.lesson && (
                    <div className="glass-panel rounded-lg p-4 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/80">Lesson</span>
                      <pre className="text-xs font-mono text-slate-300 bg-slate-950/80 rounded-md p-3 overflow-x-auto blur-sm hover:blur-0 transition-all cursor-help select-none" title="Hover to reveal the solution">
                        {step.lesson}
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">No active case.</p>
            <p className="text-xs text-slate-600">Select a scenario from the Cases tab to begin.</p>
          </div>
        )}
      </div>

      {activeScenario && step && (
        <div className="p-3 border-t border-white/[0.06] space-y-2">
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
              className="flex-1 py-2 rounded-md text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06]"
            >
              Prev
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheck}
              data-tour-target="case-check"
              className="flex-[2] py-2 rounded-md text-xs font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30"
            >
              Check Solution
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={nextStep}
              disabled={currentStepIndex >= activeScenario.steps.length - 1}
              className="flex-1 py-2 rounded-md text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06]"
            >
              Skip
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
