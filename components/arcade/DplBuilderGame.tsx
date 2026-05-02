"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";

const TIMER_SECONDS = 30;
const QUESTIONS_PER_GAME = 5;

interface BuilderChallenge {
  id: string;
  logLine: string;
  goal: string;
  correctPattern: string;
  distractors: string[];
}

const ALL_CHALLENGES: BuilderChallenge[] = [
  {
    id: "b1",
    logLine: "Failed login from 10.0.0.5 for user alice",
    goal: "Extract the IP address and username",
    correctPattern: 'Failed login from IPADDR:ip for user WORD:user_name',
    distractors: [
      'Failed login from INTEGER:ip for user WORD:user_name',
      'Failed login from IPADDR:ip for user ALPHA:user_name',
      'Failed login from WORD:ip for user WORD:user_name',
    ],
  },
  {
    id: "b2",
    logLine: "2024-01-15T08:30:00Z [web-01] 200 45ms /api/v1/users",
    goal: "Extract timestamp, host, status code, and endpoint",
    correctPattern: 'TIMESTAMP:ts [WORD:host] INTEGER:status WORD:duration WORD:endpoint',
    distractors: [
      'DATE:ts [WORD:host] INTEGER:status WORD:duration WORD:endpoint',
      'TIMESTAMP:ts [ALPHA:host] INTEGER:status WORD:duration WORD:endpoint',
      'TIMESTAMP:ts [WORD:host] WORD:status WORD:duration WORD:endpoint',
    ],
  },
  {
    id: "b3",
    logLine: 'Order confirmed: id=ORD-12345 amount=99.99 currency=USD',
    goal: "Extract order ID, amount, and currency",
    correctPattern: 'Order confirmed: id=WORD:order_id amount=DOUBLE:amount currency=ALPHA:currency',
    distractors: [
      'Order confirmed: id=ALNUM:order_id amount=INTEGER:amount currency=WORD:currency',
      'Order confirmed: id=WORD:order_id amount=DOUBLE:amount currency=WORD:currency',
      'Order confirmed: id=UUID:order_id amount=DOUBLE:amount currency=ALPHA:currency',
    ],
  },
  {
    id: "b4",
    logLine: '{"event":"login","user":"bob","success":true}',
    goal: "Capture the entire JSON payload",
    correctPattern: 'JSON:payload',
    distractors: [
      'WORD:payload',
      'LD:payload',
      'ALPHA:payload',
    ],
  },
  {
    id: "b5",
    logLine: "User 42 signed in from ::1 at 2024-06-01T12:00:00Z",
    goal: "Extract user ID, IPv6 address, and timestamp",
    correctPattern: 'User INTEGER:user_id signed in from IPV6:ip at TIMESTAMP:ts',
    distractors: [
      'User INTEGER:user_id signed in from IPADDR:ip at TIMESTAMP:ts',
      'User WORD:user_id signed in from IPV6:ip at DATE:ts',
      'User INTEGER:user_id signed in from IPADDR:ip at DATE:ts',
    ],
  },
  {
    id: "b6",
    logLine: "DEBUG 2024-03-10T14:22:01Z cache-hit key=user:9876 ttl=300s",
    goal: "Extract log level, timestamp, cache key, and TTL",
    correctPattern: 'ALPHA:level TIMESTAMP:ts cache-hit key=WORD:cache_key ttl=INTEGER:ttl',
    distractors: [
      'WORD:level TIMESTAMP:ts cache-hit key=WORD:cache_key ttl=INTEGER:ttl',
      'ALPHA:level DATE:ts cache-hit key=WORD:cache_key ttl=INTEGER:ttl',
      'ALPHA:level TIMESTAMP:ts cache-hit key=ALNUM:cache_key ttl=DOUBLE:ttl',
    ],
  },
  {
    id: "b7",
    logLine: "request_id=550e8400-e29b-41d4-a716-446655440000 duration=124.5ms status=ERROR",
    goal: "Extract UUID, duration, and status",
    correctPattern: 'request_id=UUID:req_id duration=DOUBLE:duration_ms status=ALPHA:status',
    distractors: [
      'request_id=HEXNUM:req_id duration=INTEGER:duration_ms status=WORD:status',
      'request_id=UUID:req_id duration=DOUBLE:duration_ms status=WORD:status',
      'request_id=ALNUM:req_id duration=DOUBLE:duration_ms status=ALPHA:status',
    ],
  },
  {
    id: "b8",
    logLine: "192.168.0.1 - - [10/Oct/2023:13:55:36 -0700] \"GET /index.html HTTP/1.1\" 200 2326",
    goal: "Extract IP, timestamp, method, path, and status",
    correctPattern: 'IPADDR:client_ip LD TIMESTAMP:ts WORD:method WORD:path INTEGER:status',
    distractors: [
      'IPADDR:client_ip LD DATE:ts WORD:method WORD:path INTEGER:status',
      'WORD:client_ip LD TIMESTAMP:ts WORD:method WORD:path WORD:status',
      'IPADDR:client_ip LD TIMESTAMP:ts ALPHA:method WORD:path INTEGER:status',
    ],
  },
];

function getShuffledQuestions(): BuilderChallenge[] {
  const shuffled = [...ALL_CHALLENGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTIONS_PER_GAME);
}

function getOptions(challenge: BuilderChallenge): string[] {
  return [...challenge.distractors, challenge.correctPattern].sort(() => Math.random() - 0.5);
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

export function DplBuilderGame({ onExit }: { onExit: () => void }) {
  const addGameScore = useInvestigatorStore((s) => s.addGameScore);
  const setGameSession = useInvestigatorStore((s) => s.setGameSession);

  const [questions] = useState(getShuffledQuestions);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [active, setActive] = useState(true);

  const challenge = questions[questionIndex];
  const [options] = useState(() => getOptions(challenge));
  const remaining = useCountdown(TIMER_SECONDS, active && !gameOver && !feedback);

  useEffect(() => {
    if (remaining === 0 && active && !feedback && !gameOver) {
      handleTimeUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useEffect(() => {
    setGameSession({
      mode: "dpl-builder",
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
      const correct = choice === challenge.correctPattern;
      if (correct) {
        const timeBonus = Math.round((remaining / TIMER_SECONDS) * 50);
        const points = 50 + timeBonus;
        setScore((s) => s + points);
        setFeedback({ correct: true, message: `Correct! +${points} points` });
      } else {
        setFeedback({ correct: false, message: "Not quite — check the matcher types and field bindings." });
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
        mode: "dpl-builder",
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
          <h2 className="text-xl font-semibold text-slate-100">Pattern Builder Complete</h2>
          <p className="text-sm text-slate-400">You scored</p>
          <div className="text-4xl font-bold text-emerald-400">{score}</div>
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
              className="flex-1 py-2 rounded-md text-xs font-medium bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25 border border-emerald-400/30"
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
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">DPL Pattern Builder</span>
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
          className="h-full bg-emerald-400"
          initial={{ width: "100%" }}
          animate={{ width: `${(remaining / TIMER_SECONDS) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="glass-panel-strong rounded-xl p-5 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Goal: {challenge.goal}</p>
            <div className="bg-slate-950/80 border border-white/[0.06] rounded-lg px-4 py-3">
              <code className="text-xs font-mono text-slate-300 break-all">{challenge.logLine}</code>
            </div>
            <p className="text-xs text-slate-400">Pick the DPL pattern that extracts the right fields.</p>
          </div>

          <div className="space-y-2">
            {options.map((opt) => (
              <motion.button
                key={opt}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={!!feedback}
                onClick={() => handleAnswer(opt)}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-mono border transition-colors ${
                  feedback
                    ? opt === challenge.correctPattern
                      ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/30"
                      : "bg-white/[0.02] text-slate-600 border-white/[0.04]"
                    : "bg-slate-900/60 text-slate-200 border-white/[0.06] hover:bg-emerald-400/5 hover:border-emerald-400/20"
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
