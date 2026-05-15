"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { QUERY_LIBRARY } from "@/lib/dql/query-library";

const QUESTIONS_PER_GAME = 10;
const POINTS_PER_CORRECT = 100;

interface McqQuestion {
  id: string;
  question: string;
  code?: string;
  options: string[];
  correctIndex: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(): McqQuestion[] {
  const questions: McqQuestion[] = [];

  // Type 1: What does this query do? (from QUERY_LIBRARY)
  const libQuestions = shuffleArray(QUERY_LIBRARY).slice(0, 4).map((entry, i) => {
    const correct = entry.explanation;
    const distractors = shuffleArray(QUERY_LIBRARY.filter((q) => q.id !== entry.id))
      .slice(0, 3)
      .map((q) => q.explanation);
    const options = shuffleArray([correct, ...distractors]);
    return {
      id: `lib-${i}`,
      question: `What does the following query do?`,
      code: entry.query,
      options,
      correctIndex: options.indexOf(correct),
    };
  });
  questions.push(...libQuestions);

  // Type 2: Command identification
  questions.push({
    id: "cmd-1",
    question: "Which DQL command is used to keep only rows that match a condition?",
    options: ["sort", "filter", "summarize", "limit"],
    correctIndex: 1,
  });
  questions.push({
    id: "cmd-2",
    question: "Which command transforms rows into aggregated groups?",
    options: ["fieldsAdd", "parse", "summarize", "expand"],
    correctIndex: 2,
  });
  questions.push({
    id: "cmd-3",
    question: "Which command is used to extract structured data from a string field?",
    options: ["parse", "filter", "sort", "dedup"],
    correctIndex: 0,
  });

  // Type 3: Fix the query
  questions.push({
    id: "fix-1",
    question: "Fix the broken query:",
    code: `fetch logs\n| filter loglevel = "ERROR"\n| sort timestamp`,
    options: [
      `Change = to == in the filter condition`,
      `Change fetch logs to fetch events`,
      `Remove the sort command`,
      `Add a limit command`,
    ],
    correctIndex: 0,
  });
  questions.push({
    id: "fix-2",
    question: "Fix the broken query:",
    code: `fetch spans\n| filter duration > 1s\n| summarize count = count by:{service.name}`,
    options: [
      `Change count by to count(), by:{service.name}`,
      `Change spans to logs`,
      `Remove the filter`,
      `Change > to ==`,
    ],
    correctIndex: 0,
  });

  // Type 4: Conceptual
  questions.push({
    id: "concept-1",
    question: "What is the purpose of makeTimeseries?",
    options: [
      "To delete old data",
      "To bucket data into time intervals for charting",
      "To rename columns",
      "To join two datasets",
    ],
    correctIndex: 1,
  });
  questions.push({
    id: "concept-2",
    question: "In DQL, what does the append command do?",
    options: [
      "Adds a new column to every row",
      "Unions two datasets together",
      "Filters rows by appending conditions",
      "Sorts data in ascending order",
    ],
    correctIndex: 1,
  });

  return shuffleArray(questions).slice(0, QUESTIONS_PER_GAME);
}

export function McqGame({ onExit }: { onExit: () => void }) {
  const addGameScore = useInvestigatorStore((s) => s.addGameScore);
  const setGameSession = useInvestigatorStore((s) => s.setGameSession);

  const [questions] = useState(() => generateQuestions());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const current = questions[questionIndex];

  const handleSelect = useCallback(
    (idx: number) => {
      if (revealed) return;
      setSelected(idx);
      setRevealed(true);
      if (idx === current.correctIndex) {
        setScore((s) => s + POINTS_PER_CORRECT);
      }
    },
    [revealed, current]
  );

  const nextQuestion = useCallback(() => {
    setSelected(null);
    setRevealed(false);
    if (questionIndex + 1 >= QUESTIONS_PER_GAME) {
      setGameOver(true);
      addGameScore({
        mode: "mcq",
        score,
        maxScore: QUESTIONS_PER_GAME * POINTS_PER_CORRECT,
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
          <h2 className="text-xl font-semibold text-slate-100">DQL Quiz Complete</h2>
          <p className="text-sm text-slate-400">You scored</p>
          <div className="text-4xl font-bold text-amber-400">{score}</div>
          <p className="text-xs text-slate-500">out of {QUESTIONS_PER_GAME * POINTS_PER_CORRECT} possible</p>
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
                setSelected(null);
                setRevealed(false);
              }}
              className="flex-1 py-2 rounded-md text-xs font-medium bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/30"
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
          <span className="text-xs font-medium text-amber-400">DQL Quiz</span>
          <span className="text-xs text-slate-500">Q{questionIndex + 1} / {QUESTIONS_PER_GAME}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-slate-200">{score} pts</div>
          <button onClick={onExit} className="text-xs text-slate-500 hover:text-slate-300">Exit</button>
        </div>
      </div>

      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${((questionIndex + 1) / QUESTIONS_PER_GAME) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="glass-panel-strong rounded-xl p-5 space-y-3">
                <p className="text-sm font-medium text-slate-100">{current.question}</p>
                {current.code && (
                  <pre className="text-xs font-mono text-slate-300 bg-slate-950/80 rounded-md p-3 overflow-x-auto">
                    {current.code}
                  </pre>
                )}
              </div>

              <div className="grid gap-2">
                {current.options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const isCorrect = idx === current.correctIndex;
                  let btnClass =
                    "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ";
                  if (!revealed) {
                    btnClass += isSelected
                      ? "bg-amber-400/10 border-amber-400/30 text-amber-300"
                      : "bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/5 hover:border-white/10";
                  } else {
                    if (isCorrect) {
                      btnClass += "bg-emerald-400/10 border-emerald-400/30 text-emerald-300";
                    } else if (isSelected) {
                      btnClass += "bg-rose-400/10 border-rose-400/30 text-rose-300";
                    } else {
                      btnClass += "bg-white/[0.02] border-white/[0.06] text-slate-500 opacity-60";
                    }
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      className={btnClass}
                    >
                      <span className="text-xs font-semibold mr-2 text-slate-500">{String.fromCharCode(65 + idx)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <motion.button
                onClick={nextQuestion}
                className="flex-1 py-2 rounded-md text-xs font-medium bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/30"
              >
                {questionIndex + 1 >= QUESTIONS_PER_GAME ? "Finish" : "Next Question"}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
