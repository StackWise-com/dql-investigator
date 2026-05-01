"use client";

import { useState, useEffect, useCallback } from "react";
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

const TIMER_SECONDS = 30;
const QUESTIONS_PER_GAME = 5;

interface TimerChallenge {
  id: string;
  title: string;
  goal: string;
  hint: string;
  sampleData: Record<string, unknown>[];
  expectedPipeline: PipelineStage[];
}

const CHALLENGES: TimerChallenge[] = [
  {
    id: "t1",
    title: "Filter Errors",
    goal: "Show only ERROR-level log entries.",
    hint: "Use: filter loglevel == \"ERROR\"",
    sampleData: generateAuthLogs(80, 101),
    expectedPipeline: [
      { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
      { id: "e2", command: "filter", args: { condition: 'loglevel == "ERROR"' }, raw: 'filter loglevel == "ERROR"' },
    ],
  },
  {
    id: "t2",
    title: "Slow Queries",
    goal: "Filter database logs where duration is greater than 500.",
    hint: "Use: filter duration > 500",
    sampleData: generateDbLogs(80, 102),
    expectedPipeline: [
      { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
      { id: "e2", command: "filter", args: { condition: "duration > 500" }, raw: "filter duration > 500" },
    ],
  },
  {
    id: "t3",
    title: "Failed Deployments",
    goal: "Filter events where status equals failure.",
    hint: "Use: filter status == \"failure\"",
    sampleData: generateEvents(80, 103),
    expectedPipeline: [
      { id: "e1", command: "fetch", args: { source: "events" }, raw: "fetch events" },
      { id: "e2", command: "filter", args: { condition: 'status == "failure"' }, raw: 'filter status == "failure"' },
    ],
  },
  {
    id: "t4",
    title: "High-Value Orders",
    goal: "Filter business events where amount is at least 500.",
    hint: "Use: filter amount >= 500",
    sampleData: generateBizEvents(80, 104),
    expectedPipeline: [
      { id: "e1", command: "fetch", args: { source: "bizevents" }, raw: "fetch bizevents" },
      { id: "e2", command: "filter", args: { condition: "amount >= 500" }, raw: "filter amount >= 500" },
    ],
  },
  {
    id: "t5",
    title: "Error Spans",
    goal: "Filter spans where status.code equals ERROR.",
    hint: "Use: filter status.code == \"ERROR\"",
    sampleData: generateSpans(80, 105),
    expectedPipeline: [
      { id: "e1", command: "fetch", args: { source: "spans" }, raw: "fetch spans" },
      { id: "e2", command: "filter", args: { condition: 'status.code == "ERROR"' }, raw: 'filter status.code == "ERROR"' },
    ],
  },
];

function useCountdown(seconds: number, active: boolean) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (!active) return;
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, active]);
  return remaining;
}

function validatePipeline(pipeline: PipelineStage[], challenge: TimerChallenge): boolean {
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

export function TimerGame({ onExit }: { onExit: () => void }) {
  const addGameScore = useInvestigatorStore((s) => s.addGameScore);
  const setGameSession = useInvestigatorStore((s) => s.setGameSession);
  const gameSession = useInvestigatorStore((s) => s.gameSession);

  const [questionIndex, setQuestionIndex] = useState(gameSession?.mode === "timer" ? gameSession.questionIndex : 0);
  const [score, setScore] = useState(gameSession?.mode === "timer" ? gameSession.score : 0);
  const [editorValue, setEditorValue] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [active, setActive] = useState(true);

  const challenge = CHALLENGES[questionIndex];
  const remaining = useCountdown(TIMER_SECONDS, active && !gameOver && !feedback);

  useEffect(() => {
    if (remaining === 0 && active && !feedback && !gameOver) {
      handleTimeUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useEffect(() => {
    setGameSession({
      mode: "timer",
      questionIndex,
      score,
      startTime: Date.now(),
      lives: 0,
    });
  }, [questionIndex, score, setGameSession]);

  const handleCheck = useCallback(() => {
    if (!challenge) return;
    const parsed = parsePipeline(editorValue);
    if (parsed.length === 0) {
      setFeedback({ correct: false, message: "Type a pipeline first." });
      return;
    }
    const correct = validatePipeline(parsed, challenge);
    if (correct) {
      const timeBonus = Math.round((remaining / TIMER_SECONDS) * 50);
      const points = 50 + timeBonus;
      setScore((s) => s + points);
      setFeedback({ correct: true, message: `Correct! +${points} points` });
    } else {
      setFeedback({ correct: false, message: "Not quite. Check your pipeline." });
    }
  }, [challenge, editorValue, remaining]);

  const handleTimeUp = useCallback(() => {
    setActive(false);
    setFeedback({ correct: false, message: "Time's up!" });
  }, []);

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setEditorValue("");
    setActive(true);
    if (questionIndex + 1 >= QUESTIONS_PER_GAME) {
      setGameOver(true);
      addGameScore({
        mode: "timer",
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
          <h2 className="text-xl font-semibold text-slate-100">Timer Rush Complete</h2>
          <p className="text-sm text-slate-400">You scored</p>
          <div className="text-4xl font-bold text-rose-400">{score}</div>
          <p className="text-xs text-slate-500">out of {QUESTIONS_PER_GAME * 100} possible</p>
          <div className="flex gap-2 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExit}
              className="flex-1 py-2 rounded-md text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 border border-white/[0.06]"
            >
              Back to Arcade
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setScore(0);
                setQuestionIndex(0);
                setGameOver(false);
                setFeedback(null);
                setEditorValue("");
                setActive(true);
              }}
              className="flex-1 py-2 rounded-md text-xs font-medium bg-rose-400/15 text-rose-300 hover:bg-rose-400/25 border border-rose-400/30"
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
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Timer Rush</span>
          <span className="text-[10px] text-slate-500">Q{questionIndex + 1} / {QUESTIONS_PER_GAME}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-sm font-mono font-semibold ${remaining <= 10 ? "text-rose-400" : "text-slate-200"}`}>
            {remaining}s
          </div>
          <div className="text-sm font-semibold text-slate-200">{score} pts</div>
          <button onClick={onExit} className="text-[10px] text-slate-500 hover:text-slate-300">Exit</button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-slate-800">
        <motion.div
          className="h-full bg-rose-400"
          initial={{ width: "100%" }}
          animate={{ width: `${(remaining / TIMER_SECONDS) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="glass-panel-strong rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-slate-100">{challenge.title}</h3>
            <p className="text-sm text-slate-300">{challenge.goal}</p>
            <p className="text-[10px] text-slate-500">Hint: {challenge.hint}</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">DQL Pipeline</label>
            <textarea
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              disabled={!!feedback}
              placeholder="fetch logs | filter loglevel == &quot;ERROR&quot;"
              className="w-full h-28 bg-slate-950/80 border border-white/[0.06] rounded-lg p-3 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-400/40 resize-none"
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheck}
                className="flex-1 py-2 rounded-md text-xs font-medium bg-rose-400/15 text-rose-300 hover:bg-rose-400/25 border border-rose-400/30"
              >
                Submit
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextQuestion}
                className="flex-1 py-2 rounded-md text-xs font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30"
              >
                {questionIndex + 1 >= QUESTIONS_PER_GAME ? "Finish" : "Next Question"}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
