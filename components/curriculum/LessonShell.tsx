"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { TRACKS, TRACK_COLORS, getNextLesson } from "@/lib/curriculum/tracks";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import type { Lesson, Track } from "@/lib/curriculum/tracks";

type Phase = "intro" | "scenario" | "check" | "complete";

interface CheckQuestion {
  q: string;
  options: string[];
  answer: number;
}

const SKILL_QUESTIONS: Record<string, CheckQuestion[]> = {
  fetch: [
    { q: "What is the first command in every DQL query?", options: ["filter", "fetch", "sort", "limit"], answer: 1 },
  ],
  filter: [
    { q: "Which DQL command keeps only rows matching a condition?", options: ["sort", "limit", "filter", "dedup"], answer: 2 },
    { q: "What operator checks equality in a DQL filter condition?", options: ["=", "==", "===", "eq"], answer: 1 },
  ],
  sort: [
    { q: "Which command reorders rows in DQL?", options: ["order", "sort", "limit", "arrange"], answer: 1 },
  ],
  limit: [
    { q: "What does `| limit 10` do in a DQL pipeline?", options: ["Filters to 10 columns", "Skips 10 rows", "Returns only the first 10 rows", "Sorts 10 rows"], answer: 2 },
  ],
  fields: [
    { q: "Which command selects specific columns to display?", options: ["filter", "fields", "select", "pick"], answer: 1 },
  ],
  filterOut: [
    { q: "Which command removes rows that match a condition?", options: ["filter", "filterOut", "remove", "exclude"], answer: 1 },
  ],
  parse: [
    { q: "What does the DQL `parse` command do?", options: ["Removes duplicate rows", "Extracts structured fields from a string", "Groups rows by a key", "Sorts alphabetically"], answer: 1 },
  ],
  summarize: [
    { q: "Which command aggregates rows into groups in DQL?", options: ["filter", "group", "summarize", "collapse"], answer: 2 },
  ],
  makeTimeseries: [
    { q: "What does `makeTimeseries` produce?", options: ["A list of unique values", "Rows bucketed into time intervals", "A filtered subset", "A sorted list"], answer: 1 },
  ],
  dedup: [
    { q: "What does `dedup` do in a DQL pipeline?", options: ["Sorts rows", "Removes duplicate rows", "Expands arrays", "Filters by field"], answer: 1 },
  ],
  expand: [
    { q: "Which command turns array elements into individual rows?", options: ["parse", "expand", "flatten", "split"], answer: 1 },
  ],
  search: [
    { q: "Which command does a full-text search across all fields?", options: ["filter", "find", "search", "grep"], answer: 2 },
  ],
};

function buildCheckQuestions(skills: string[]): CheckQuestion[] {
  const qs: CheckQuestion[] = [];
  for (const skill of skills) {
    const bank = SKILL_QUESTIONS[skill];
    if (bank) {
      qs.push(bank[0]);
      if (qs.length >= 2) break;
    }
  }
  return qs;
}

// ── Intro screen ──────────────────────────────────────────────────────────────

function IntroScreen({
  track,
  lesson,
  onBegin,
  onExit,
}: {
  track: Track;
  lesson: Lesson;
  onBegin: () => void;
  onExit: () => void;
}) {
  const colors = TRACK_COLORS[track.color];
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Track label */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colors.bg} ${colors.border} ${colors.text}`}>
            {track.title}
          </span>
          <span className="text-xs text-slate-500">≈ {lesson.durationMin} min</span>
        </div>

        {/* Lesson title */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 mb-2">{lesson.title}</h1>
          <p className="text-sm text-slate-400">
            Work through the scenario below to practise the highlighted DQL commands. Complete each step to earn XP and advance your track progress.
          </p>
        </div>

        {/* Skills */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">You'll practise</p>
          <div className="flex flex-wrap gap-2">
            {lesson.skills.map((s) => (
              <span key={s} className="text-xs font-mono px-2 py-1 rounded bg-accent/10 border border-accent/20 text-accent">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* What to expect */}
        <div className="bg-slate-900/60 border border-white/[0.06] rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-slate-300">What to expect</p>
          <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
            <li>Read the scenario brief on the left panel</li>
            <li>Write DQL queries in the editor to complete each step</li>
            <li>Answer a short check question when you finish</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onBegin}
            className="flex-1 py-2.5 rounded-lg bg-accent text-slate-950 text-sm font-semibold hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Begin Lesson →
          </button>
          <button
            onClick={onExit}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
          >
            Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Check screen ──────────────────────────────────────────────────────────────

function CheckScreen({
  questions,
  onComplete,
  onSkip,
}: {
  questions: CheckQuestion[];
  onComplete: (correct: number) => void;
  onSkip: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);

  const current = questions[idx];
  const isLast = idx === questions.length - 1;

  const handleSelect = (optIdx: number) => {
    if (revealed) return;
    setSelected(optIdx);
    setRevealed(true);
    if (optIdx === current.answer) setCorrect((c) => c + 1);
  };

  const handleNext = () => {
    const nextCorrect = selected === current.answer ? correct : correct;
    if (isLast) {
      onComplete(nextCorrect);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  if (questions.length === 0) {
    onComplete(0);
    return null;
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-lg w-full space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-0.5">Quick check</p>
            <p className="text-xs text-slate-600">{idx + 1} / {questions.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-slate-800 rounded-full">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${((idx + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <p className="text-sm font-medium text-slate-100">{current.q}</p>

            <div className="grid gap-2">
              {current.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === current.answer;
                let cls = "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ";
                if (!revealed) {
                  cls += isSelected
                    ? "bg-accent/10 border-accent/30 text-accent"
                    : "bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.05] hover:border-white/[0.10]";
                } else {
                  if (isCorrect) cls += "bg-emerald-400/10 border-emerald-400/30 text-emerald-300";
                  else if (isSelected) cls += "bg-rose-400/10 border-rose-400/30 text-rose-300";
                  else cls += "bg-white/[0.02] border-white/[0.04] text-slate-500 opacity-60";
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} className={cls}>
                    <span className="text-xs font-semibold mr-2 text-slate-500">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {revealed && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={handleNext}
              className="w-full py-2.5 rounded-lg bg-accent text-slate-950 text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              {isLast ? "See results →" : "Next question →"}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ── Complete screen ───────────────────────────────────────────────────────────

function CompleteScreen({
  track,
  lesson,
  nextLesson,
  xpEarned,
  correctAnswers,
  totalQuestions,
  onNext,
  onExit,
}: {
  track: Track;
  lesson: Lesson;
  nextLesson: Lesson | null;
  xpEarned: number;
  correctAnswers: number;
  totalQuestions: number;
  onNext: () => void;
  onExit: () => void;
}) {
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const streak = useInvestigatorStore((s) => s.streak);
  const isTrackComplete = !nextLesson;

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-md w-full space-y-6"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-emerald-400/15 flex items-center justify-center border border-emerald-400/30 mx-auto">
          <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-100 mb-1">
            {isTrackComplete ? "Track complete!" : "Lesson complete"}
          </h2>
          <p className="text-sm text-slate-400">{lesson.title}</p>
        </div>

        {/* Stats */}
        <div className="bg-slate-900/60 border border-white/[0.08] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">XP earned</span>
            <span className="text-sm font-semibold text-emerald-400">+{xpEarned}</span>
          </div>
          {totalQuestions > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Check score</span>
              <span className="text-sm font-semibold text-slate-200">{correctAnswers}/{totalQuestions}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Streak</span>
            <span className="text-sm font-semibold text-amber-400">🔥 {streak.current} day{streak.current !== 1 ? "s" : ""}</span>
          </div>
          <div className="h-px bg-white/[0.06]" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Total XP</span>
            <span className="text-lg font-bold text-amber-400">{totalXP}</span>
          </div>
        </div>

        {/* Track-complete coffee CTA */}
        {isTrackComplete && (
          <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl p-4 text-center space-y-2">
            <p className="text-sm font-medium text-amber-300">You completed {track.title}!</p>
            <p className="text-xs text-slate-400">That's hours of free content. If it helped, consider buying the maintainers a coffee.</p>
            <a
              href="https://www.buymeacoffee.com/dqldetective"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 px-4 py-2 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-medium hover:bg-amber-400/25 transition-colors"
            >
              ☕ Buy me a coffee
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {nextLesson ? (
            <button
              onClick={onNext}
              className="flex-1 py-2.5 rounded-lg bg-accent text-slate-950 text-sm font-semibold hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Next: {nextLesson.title} →
            </button>
          ) : (
            <button
              onClick={onExit}
              className="flex-1 py-2.5 rounded-lg bg-accent text-slate-950 text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              Back to tracks →
            </button>
          )}
          <button
            onClick={onExit}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
          >
            Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Lesson header bar ─────────────────────────────────────────────────────────

function LessonHeader({
  track,
  lesson,
  lessonIndex,
  totalLessons,
  phase,
  onExit,
}: {
  track: Track;
  lesson: Lesson;
  lessonIndex: number;
  totalLessons: number;
  phase: Phase;
  onExit: () => void;
}) {
  const colors = TRACK_COLORS[track.color];
  const progressPct = ((lessonIndex + 1) / totalLessons) * 100;

  return (
    <div className="shrink-0">
      <div className="h-10 flex items-center justify-between px-4 border-b border-white/[0.06] bg-slate-950">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Tracks
          </button>
          <span className="text-slate-700">·</span>
          <span className={`text-xs font-medium ${colors.text}`}>{track.title}</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-400 truncate max-w-[200px]">{lesson.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">{lessonIndex + 1} / {totalLessons}</span>
          {phase === "scenario" && (
            <span className="text-xs font-medium text-accent">In Progress</span>
          )}
          {phase === "check" && (
            <span className="text-xs font-medium text-amber-400">Quick Check</span>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-slate-900">
        <div
          className={`h-full ${colors.bar} transition-all`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main LessonShell ──────────────────────────────────────────────────────────

export function LessonShell() {
  const activeLessonContext = useInvestigatorStore((s) => s.activeLessonContext);
  const setActiveLessonContext = useInvestigatorStore((s) => s.setActiveLessonContext);
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);
  const markLessonComplete = useInvestigatorStore((s) => s.markLessonComplete);
  const addXP = useInvestigatorStore((s) => s.addXP);
  const awardBadge = useInvestigatorStore((s) => s.awardBadge);
  const earnedBadges = useInvestigatorStore((s) => s.earnedBadges);
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const setShowLanding = useInvestigatorStore((s) => s.setShowLanding);
  const trackProgress = useInvestigatorStore((s) => s.trackProgress);

  const [phase, setPhase] = useState<Phase>("intro");
  const [checkCorrect, setCheckCorrect] = useState(0);
  const [checkTotal, setCheckTotal] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const trackId = activeLessonContext?.trackId ?? "";
  const lessonId = activeLessonContext?.lessonId ?? "";
  const track = TRACKS.find((t) => t.id === trackId);
  const lesson = track?.lessons.find((l) => l.id === lessonId);

  const lessonIndex = track ? track.lessons.findIndex((l) => l.id === lessonId) : -1;
  const nextLesson = track ? getNextLesson(trackId, { ...trackProgress, [trackId]: { completedLessons: [...(trackProgress[trackId]?.completedLessons ?? []), lessonId], currentLessonId: lessonId } }) : null;

  const checkQuestions = lesson ? buildCheckQuestions(lesson.skills) : [];

  // Detect scenario completion and advance to check phase
  useEffect(() => {
    if (phase === "scenario" && lessonId && completedScenarios.includes(lessonId)) {
      setPhase("check");
    }
  }, [completedScenarios, lessonId, phase]);

  const handleExit = useCallback(() => {
    setActiveLessonContext(null);
    setScenario(null);
    setShowLanding(true);
  }, [setActiveLessonContext, setScenario, setShowLanding]);

  const handleBegin = useCallback(() => {
    setPhase("scenario");
  }, []);

  const handleCheckComplete = useCallback(
    (correct: number) => {
      if (!track || !lesson) return;
      const earned = lesson.durationMin * 5 + correct * 10;
      setCheckCorrect(correct);
      setCheckTotal(checkQuestions.length);
      setXpEarned(earned);
      const next = nextLesson?.id ?? "";
      markLessonComplete(trackId, lessonId, next);
      addXP(earned);
      // Skill-based badges
      if (lesson.skills.includes("filter") && !earnedBadges.includes("first-filter")) {
        awardBadge("first-filter");
      }
      if (lesson.skills.includes("parse") && !earnedBadges.includes("first-parse")) {
        awardBadge("first-parse");
      }
      setPhase("complete");
    },
    [track, lesson, checkQuestions.length, nextLesson, markLessonComplete, trackId, lessonId, addXP, awardBadge, earnedBadges]
  );

  const handleNextLesson = useCallback(() => {
    if (!nextLesson || !track) return;
    const { getAllScenarios } = require("@/lib/dql/scenario-registry");
    const scenario = getAllScenarios().find((s: { id: string }) => s.id === nextLesson.id);
    if (scenario) {
      setActiveLessonContext({ trackId, lessonId: nextLesson.id });
      setScenario(scenario);
      setPhase("intro");
    }
  }, [nextLesson, track, trackId, setActiveLessonContext, setScenario]);

  if (!track || !lesson) {
    handleExit();
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {phase !== "intro" && (
        <LessonHeader
          track={track}
          lesson={lesson}
          lessonIndex={lessonIndex}
          totalLessons={track.lessons.length}
          phase={phase}
          onExit={handleExit}
        />
      )}

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" className="flex-1 flex overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <IntroScreen track={track} lesson={lesson} onBegin={handleBegin} onExit={handleExit} />
          </motion.div>
        )}

        {phase === "scenario" && (
          <motion.div key="scenario" className="flex-1 flex overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <CaseWorkspace />
          </motion.div>
        )}

        {phase === "check" && (
          <motion.div key="check" className="flex-1 flex overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {checkQuestions.length > 0 ? (
              <CheckScreen
                questions={checkQuestions}
                onComplete={handleCheckComplete}
                onSkip={() => handleCheckComplete(0)}
              />
            ) : (
              // No check questions for these skills — go straight to complete
              <CompleteScreen
                track={track}
                lesson={lesson}
                nextLesson={nextLesson}
                xpEarned={lesson.durationMin * 5}
                correctAnswers={0}
                totalQuestions={0}
                onNext={handleNextLesson}
                onExit={handleExit}
              />
            )}
          </motion.div>
        )}

        {phase === "complete" && (
          <motion.div key="complete" className="flex-1 flex overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <CompleteScreen
              track={track}
              lesson={lesson}
              nextLesson={nextLesson}
              xpEarned={xpEarned}
              correctAnswers={checkCorrect}
              totalQuestions={checkTotal}
              onNext={handleNextLesson}
              onExit={handleExit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
