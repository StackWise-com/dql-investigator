"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { runPipeline } from "@/lib/dql/engine";
import { parsePipeline } from "@/lib/dql/parser";
import type { PipelineStage } from "@/lib/types/dql";
import {
  generateAuthLogs,
  generateDbLogs,
  generateEvents,
  generateBizEvents,
  generateSpans,
} from "@/lib/dql/log-generator";

const QUESTIONS_PER_GAME = 5;
const PENALTY_PER_WRONG = 20;

interface PipelineChallenge {
  id: string;
  title: string;
  description: string;
  sampleData: Record<string, unknown>[];
  expectedPipeline: PipelineStage[];
  targetHint: string;
}

function buildChallenge(
  id: string,
  title: string,
  description: string,
  generator: (count: number, seed: number) => Record<string, unknown>[],
  seed: number,
  pipeline: PipelineStage[],
  targetHint: string
): PipelineChallenge {
  return {
    id,
    title,
    description,
    sampleData: generator(80, seed),
    expectedPipeline: pipeline,
    targetHint,
  };
}

const CHALLENGES: PipelineChallenge[] = [
  buildChallenge(
    "p1",
    "Error Filter",
    "Build a pipeline that keeps only ERROR-level logs.",
    generateAuthLogs,
    201,
    [
      { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
      { id: "e2", command: "filter", args: { condition: 'loglevel == "ERROR"' }, raw: 'filter loglevel == "ERROR"' },
    ],
    "Should result in fewer rows with columns: timestamp, host, loglevel, content, ..."
  ),
  buildChallenge(
    "p2",
    "Sort & Limit",
    "Build a pipeline that sorts by duration descending and keeps the top 5.",
    generateDbLogs,
    202,
    [
      { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
      { id: "e2", command: "sort", args: { field: "duration", order: "desc" }, raw: "sort duration desc" },
      { id: "e3", command: "limit", args: { count: 5 }, raw: "limit 5" },
    ],
    "Should result in exactly 5 rows."
  ),
  buildChallenge(
    "p3",
    "Summarize Count",
    "Count events grouped by service.",
    generateEvents,
    203,
    [
      { id: "e1", command: "fetch", args: { source: "events" }, raw: "fetch events" },
      { id: "e2", command: "summarize", args: { aggregation: "count", alias: "count", by: "service" }, raw: "summarize count = count(), by:{service}" },
    ],
    "Should result in grouped rows with columns: service, count."
  ),
  buildChallenge(
    "p4",
    "Filter + Sort",
    "Keep only orders with amount >= 300, then sort by amount descending.",
    generateBizEvents,
    204,
    [
      { id: "e1", command: "fetch", args: { source: "bizevents" }, raw: "fetch bizevents" },
      { id: "e2", command: "filter", args: { condition: "amount >= 300" }, raw: "filter amount >= 300" },
      { id: "e3", command: "sort", args: { field: "amount", order: "desc" }, raw: "sort amount desc" },
    ],
    "Rows should be filtered and ordered by amount descending."
  ),
  buildChallenge(
    "p5",
    "Error Spans Summary",
    "Filter ERROR spans and count them by endpoint.",
    generateSpans,
    205,
    [
      { id: "e1", command: "fetch", args: { source: "spans" }, raw: "fetch spans" },
      { id: "e2", command: "filter", args: { condition: 'status.code == "ERROR"' }, raw: 'filter status.code == "ERROR"' },
      { id: "e3", command: "summarize", args: { aggregation: "count", alias: "count", by: "endpoint" }, raw: "summarize count = count(), by:{endpoint}" },
    ],
    "Should result in grouped rows with columns: endpoint, count."
  ),
];

function validatePipeline(pipeline: PipelineStage[], challenge: PipelineChallenge): boolean {
  try {
    const result = runPipeline(pipeline, challenge.sampleData);
    const expected = runPipeline(challenge.expectedPipeline, challenge.sampleData);
    const last = result[result.length - 1];
    const exp = expected[expected.length - 1];
    const rKeys = Object.keys(last.data[0] || {});
    const eKeys = Object.keys(exp.data[0] || {});
    const keysMatch = rKeys.length === eKeys.length && rKeys.every((k) => eKeys.includes(k));
    return keysMatch && last.recordCount === exp.recordCount;
  } catch {
    return false;
  }
}

export function PipelineGame({ onExit }: { onExit: () => void }) {
  const addGameScore = useInvestigatorStore((s) => s.addGameScore);
  const setGameSession = useInvestigatorStore((s) => s.setGameSession);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [editorValue, setEditorValue] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showTarget, setShowTarget] = useState(false);

  const challenge = CHALLENGES[questionIndex];

  const targetResult = (() => {
    try {
      const res = runPipeline(challenge.expectedPipeline, challenge.sampleData);
      return res[res.length - 1];
    } catch {
      return null;
    }
  })();

  const handleCheck = useCallback(() => {
    if (!challenge) return;
    const parsed = parsePipeline(editorValue);
    if (parsed.length === 0) {
      setFeedback({ correct: false, message: "Type a pipeline first." });
      return;
    }
    const correct = validatePipeline(parsed, challenge);
    if (correct) {
      const points = Math.max(100 - attempts * PENALTY_PER_WRONG, 20);
      setScore((s) => s + points);
      setFeedback({ correct: true, message: `Correct! +${points} points` });
    } else {
      setAttempts((a) => a + 1);
      setFeedback({ correct: false, message: `Not quite. -${PENALTY_PER_WRONG} penalty for next try.` });
    }
  }, [challenge, editorValue, attempts]);

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setEditorValue("");
    setAttempts(0);
    setShowTarget(false);
    if (questionIndex + 1 >= QUESTIONS_PER_GAME) {
      setGameOver(true);
      addGameScore({
        mode: "pipeline",
        score,
        maxScore: QUESTIONS_PER_GAME * 100,
        date: new Date().toISOString(),
      });
      setGameSession(null);
    } else {
      setQuestionIndex((i) => i + 1);
    }
  }, [questionIndex, score, addGameScore, setGameSession]);

  if (gameOver) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel-strong rounded-xl border border-white/[0.06] p-8 max-w-md w-full text-center space-y-4"
        >
          <h2 className="text-xl font-semibold text-slate-100">Pipeline Builder Complete</h2>
          <p className="text-sm text-slate-400">You scored</p>
          <div className="text-4xl font-bold text-cyan-400">{score}</div>
          <p className="text-xs text-slate-500">out of {QUESTIONS_PER_GAME * 100} possible</p>
          <div className="flex gap-2 pt-2">
            <motion.button
              onClick={onExit}
              className="flex-1 py-2 rounded-md text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 border border-white/[0.06]"
            >
              Back to Arcade
            </motion.button>
            <motion.button
              onClick={() => {
                setScore(0);
                setQuestionIndex(0);
                setGameOver(false);
                setFeedback(null);
                setEditorValue("");
                setAttempts(0);
              }}
              className="flex-1 py-2 rounded-md text-xs font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30"
            >
              Play Again
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 flex items-center justify-between px-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-accent">Pipeline Builder</span>
          <span className="text-xs text-slate-500">Q{questionIndex + 1} / {QUESTIONS_PER_GAME}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">Attempts: {attempts}</span>
          <div className="text-sm font-semibold text-slate-200">{score} pts</div>
          <button onClick={onExit} className="text-xs text-slate-500 hover:text-slate-300">Exit</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="glass-panel-strong rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-slate-100">{challenge.title}</h3>
            <p className="text-sm text-slate-300">{challenge.description}</p>
            <button
              onClick={() => setShowTarget(!showTarget)}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {showTarget ? "Hide Target" : "Show Target Output"}
            </button>
          </div>

          <AnimatePresence>
            {showTarget && targetResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-panel rounded-xl border border-white/[0.04] overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-white/[0.04] flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Target Output</span>
                  <span className="text-xs text-slate-500">{targetResult.recordCount} rows</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {targetResult.columns.map((col) => (
                          <th key={col.name} className="px-3 py-2 font-medium text-slate-400 whitespace-nowrap">{col.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {targetResult.data.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-white/[0.02]">
                          {targetResult.columns.map((col) => (
                            <td key={col.name} className="px-3 py-2 text-slate-300 whitespace-nowrap">
                              {String(row[col.name] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {targetResult.data.length > 5 && (
                        <tr>
                          <td colSpan={targetResult.columns.length} className="px-3 py-2 text-slate-500 italic">
                            ... {targetResult.data.length - 5} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">Your Pipeline</label>
            <textarea
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              disabled={!!feedback}
              placeholder="fetch logs | filter loglevel == &quot;ERROR&quot; | sort timestamp desc"
              className="w-full h-28 bg-slate-950/80 border border-white/[0.06] rounded-lg p-3 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/40 resize-none"
            />
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className={`rounded-lg p-3 text-sm border ${
                  feedback.correct
                    ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                    : "bg-rose-400/10 text-rose-400 border-rose-400/20"
                }`}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            {!feedback ? (
              <motion.button
                onClick={handleCheck}
                className="flex-1 py-2 rounded-md text-xs font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30"
              >
                Check Pipeline
              </motion.button>
            ) : (
              <motion.button
                onClick={nextQuestion}
                className="flex-1 py-2 rounded-md text-xs font-medium bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25 border border-emerald-400/30"
              >
                {questionIndex + 1 >= QUESTIONS_PER_GAME ? "Finish" : "Next Challenge"}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
