"use client";

import { motion } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { funScenarios, type FunScenario } from "@/lib/dql/fun-scenarios";

const DIFFICULTY_COLORS = {
  Beginner: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  Intermediate: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  Advanced: "bg-rose-400/10 text-rose-400 border-rose-400/20",
};

const CHARACTER_EMOJI: Record<string, string> = {
  detective: "🕵️",
  santa: "🎅",
  "tony-stark": "🤖",
  batman: "🦇",
  cyborg: "🦾",
  sherlock: "🧠",
  "spider-man": "🕷️",
  "doctor-strange": "🔮",
  "black-panther": "🐆",
  "wall-e": "🤖",
  doraemon: "🔔",
};

const THEME_BORDER: Record<string, string> = {
  detective: "hover:border-amber-400/30",
  santa: "hover:border-red-400/30",
  "tony-stark": "hover:border-amber-400/30",
  batman: "hover:border-slate-400/30",
  cyborg: "hover:border-cyan-400/30",
  sherlock: "hover:border-violet-400/30",
  "spider-man": "hover:border-red-400/30",
  "doctor-strange": "hover:border-purple-400/30",
  "black-panther": "hover:border-slate-400/30",
  "wall-e": "hover:border-yellow-400/30",
  doraemon: "hover:border-blue-400/30",
};

function getCaseTag(scenario: FunScenario): string {
  const firstCommand = scenario.steps[0]?.lesson?.split(" ")[0] || "fetch";
  const allCommands = scenario.steps
    .map((s) => s.lesson?.split(" ")[0])
    .filter(Boolean)
    .join(", ");
  return allCommands || firstCommand;
}

export function ScenarioSelector() {
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);

  // Filter out the demo from the selector — it's auto-shown on first visit
  const cases = funScenarios.filter((s) => s.id !== "demo-001");

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Detective Cases</h1>
          <p className="text-sm text-slate-400">
            Pick a case, partner up with a legendary detective, and solve the mystery using DQL.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-tour-target="cases-cards">
          {cases.map((scenario, i) => {
            const isCompleted = completedScenarios.includes(scenario.id);
            const emoji = CHARACTER_EMOJI[scenario.character] || "🕵️";
            const borderTheme = THEME_BORDER[scenario.character] || "hover:border-cyan-400/30";

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <motion.button
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setScenario(scenario)}
                  className={`w-full glass-panel-strong rounded-xl p-5 text-left border border-white/[0.06] ${borderTheme} transition-colors relative overflow-hidden`}
                >
                  {/* Theme accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 opacity-60"
                    style={{ backgroundColor: scenario.themeColor === "amber" ? "#f59e0b" : scenario.themeColor === "red" ? "#ef4444" : scenario.themeColor === "cyan" ? "#22d3ee" : scenario.themeColor === "purple" ? "#a855f7" : scenario.themeColor === "slate" ? "#94a3b8" : "#22d3ee" }}
                  />

                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl">{emoji}</span>
                        <h3 className="text-base font-semibold text-slate-100">{scenario.title}</h3>
                        {isCompleted && (
                          <span className="text-emerald-400 text-xs">&#10003; Solved</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Partner: {scenario.characterName}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        DIFFICULTY_COLORS[scenario.difficulty as keyof typeof DIFFICULTY_COLORS]
                      }`}
                    >
                      {scenario.difficulty}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">{scenario.briefing}</p>

                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <span className="text-[10px] text-slate-500">{scenario.steps.length} steps</span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">+{scenario.steps.length * 25} XP</span>
                    <span className="text-[10px] font-mono font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                      {getCaseTag(scenario)}
                    </span>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
