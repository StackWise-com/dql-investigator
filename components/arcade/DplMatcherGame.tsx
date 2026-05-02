"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { DPL_MATCHERS } from "@/lib/dpl/matchers";

const TIMER_SECONDS = 15;
const QUESTIONS_PER_GAME = 5;

interface MatcherChallenge {
  id: string;
  fragment: string;
  correctMatcher: string;
  context: string;
}

const ALL_CHALLENGES: MatcherChallenge[] = [
  {
    id: "m1",
    fragment: "192.168.1.45",
    correctMatcher: "IPADDR",
    context: "IPv4 address in a server log",
  },
  {
    id: "m2",
    fragment: "2024-01-15T08:30:00Z",
    correctMatcher: "TIMESTAMP",
    context: "ISO-8601 timestamp",
  },
  {
    id: "m3",
    fragment: "404",
    correctMatcher: "INTEGER",
    context: "HTTP status code",
  },
  {
    id: "m4",
    fragment: "true",
    correctMatcher: "BOOL",
    context: "Boolean flag",
  },
  {
    id: "m5",
    fragment: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    correctMatcher: "UUID",
    context: "Trace or request ID",
  },
  {
    id: "m6",
    fragment: "3.14159",
    correctMatcher: "DOUBLE",
    context: "Floating-point latency",
  },
  {
    id: "m7",
    fragment: "0xDEADBEEF",
    correctMatcher: "HEXNUM",
    context: "Hexadecimal error code",
  },
  {
    id: "m8",
    fragment: '{"user":"alice"}',
    correctMatcher: "JSON",
    context: "Structured JSON payload",
  },
  {
    id: "m9",
    fragment: "ERROR",
    correctMatcher: "ALPHA",
    context: "Log level label",
  },
  {
    id: "m10",
    fragment: "abc123",
    correctMatcher: "ALNUM",
    context: "Alphanumeric token",
  },
];

function getShuffledQuestions(): MatcherChallenge[] {
  const shuffled = [...ALL_CHALLENGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTIONS_PER_GAME);
}

function getOptions(correct: string): string[] {
  const pool = DPL_MATCHERS.map((m) => m.name).filter((n) => n !== correct);
  const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...distractors, correct].sort(() => Math.random() - 0.5);
}

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

export function DplMatcherGame({ onExit }: { onExit: () => void }) {
  const addGameScore = useInvestigatorStore((s) => s.addGameScore);
  const setGameSession = useInvestigatorStore((s) => s.setGameSession);

  const [questions] = useState(getShuffledQuestions);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [active, setActive] = useState(true);

  const challenge = questions[questionIndex];
  const options = useMemo(() => getOptions(challenge.correctMatcher), [challenge]);
  const remaining = useCountdown(TIMER_SECONDS, active && !gameOver && !feedback);

  useEffect(() => {
    if (remaining === 0 && active && !feedback && !gameOver) {
      handleTimeUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useEffect(() => {
    setGameSession({
      mode: "dpl-matcher",
      questionIndex,
      score,
      startTime: Date.now(),
      lives: 0,
    });
  }, [questionIndex, score, setGameSession]);

  const handleTimeUp = useCallback(() => {
    setActive(false);
    setFeedback({ correct: false, message: "Time's up!" });
  }, []);

  const handleAnswer = useCallback(
    (choice: string) => {
      if (!challenge || feedback) return;
      const correct = choice === challenge.correctMatcher;
      if (correct) {
        const timeBonus = Math.round((remaining / TIMER_SECONDS) * 50);
        const points = 50 + timeBonus;
        setScore((s) => s + points);
        setFeedback({ correct: true, message: `Correct! +${points} points` });
      } else {
        setFeedback({ correct: false, message: `Nope — the answer was ${challenge.correctMatcher}` });
      }
      setActive(false);
    },
    [challenge, feedback, remaining]
  );

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setActive(true);
    if (questionIndex + 1 >= QUESTIONS_PER_GAME) {
      setGameOver(true);
      addGameScore({
        mode: "dpl-matcher",
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
          <h2 className="text-xl font-semibold text-slate-100">Matcher Rush Complete</h2>
          <p className="text-sm text-slate-400">You scored</p>
          <div className="text-4xl font-bold text-violet-400">{score}</div>
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
                window.location.reload();
              }}
              className="flex-1 py-2 rounded-md text-xs font-medium bg-violet-400/15 text-violet-300 hover:bg-violet-400/25 border border-violet-400/30"
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
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">DPL Matcher Rush</span>
          <span className="text-[10px] text-slate-500">Q{questionIndex + 1} / {QUESTIONS_PER_GAME}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-sm font-mono font-semibold ${remaining <= 5 ? "text-rose-400" : "text-slate-200"}`}>
            {remaining}s
          </div>
          <div className="text-sm font-semibold text-slate-200">{score} pts</div>
          <button onClick={onExit} className="text-[10px] text-slate-500 hover:text-slate-300">Exit</button>
        </div>
      </div>

      <div className="h-1 bg-slate-800">
        <motion.div
          className="h-full bg-violet-400"
          initial={{ width: "100%" }}
          animate={{ width: `${(remaining / TIMER_SECONDS) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="glass-panel-strong rounded-xl p-5 space-y-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{challenge.context}</p>
            <div className="inline-block bg-slate-950/80 border border-white/[0.06] rounded-lg px-6 py-4">
              <code className="text-lg font-mono text-cyan-300">{challenge.fragment}</code>
            </div>
            <p className="text-xs text-slate-400">Which DPL matcher captures this fragment?</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <motion.button
                key={opt}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!!feedback}
                onClick={() => handleAnswer(opt)}
                className={`py-3 rounded-lg text-sm font-mono font-semibold border transition-colors ${
                  feedback
                    ? opt === challenge.correctMatcher
                      ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/30"
                      : "bg-white/[0.02] text-slate-500 border-white/[0.04]"
                    : "bg-slate-900/60 text-slate-200 border-white/[0.06] hover:bg-violet-400/10 hover:border-violet-400/20"
                }`}
              >
                {opt}
              </motion.button>
            ))}
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

          {feedback && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={nextQuestion}
              className="w-full py-2 rounded-md text-xs font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30"
            >
              {questionIndex + 1 >= QUESTIONS_PER_GAME ? "Finish" : "Next Question"}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
