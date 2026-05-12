"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { scenarios } from "@/lib/dql/scenarios";
import { onboardingScenarios } from "@/lib/dql/scenarios-onboarding";
import { dplScenarios } from "@/lib/dql/scenarios-dpl";
import { combinedScenarios } from "@/lib/dql/scenarios-combined";
import type { Scenario, ScenarioTrack } from "@/lib/types/dql";

const DIFFICULTY_COLORS = {
  Beginner: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  Intermediate: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  Advanced: "bg-rose-400/10 text-rose-400 border-rose-400/20",
};

const TRACK_LABELS: Record<ScenarioTrack, string> = {
  onboarding: "Onboarding",
  dql: "DQL",
  dpl: "DPL",
  combined: "Combined",
};

const TRACK_COLORS: Record<ScenarioTrack, string> = {
  onboarding: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  dql: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  dpl: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  combined: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

function getScenarioTag(id: string): string | null {
  const tags: Record<string, string> = {
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
  return tags[id] || null;
}

export function ScenarioSelector() {
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);

  const allScenarios = [
    ...onboardingScenarios,
    ...scenarios,
    ...dplScenarios,
    ...combinedScenarios,
  ];

  const [activeTrack, setActiveTrack] = useState<ScenarioTrack | "all">("all");

  const filteredScenarios =
    activeTrack === "all"
      ? allScenarios
      : allScenarios.filter((s) => s.track === activeTrack);

  const tabs: Array<{ key: ScenarioTrack | "all"; label: string }> = [
    { key: "all", label: "All Cases" },
    { key: "onboarding", label: "Onboarding" },
    { key: "dql", label: "DQL" },
    { key: "dpl", label: "DPL" },
    { key: "combined", label: "Combined" },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Cases</h1>
          <p className="text-sm text-slate-400">
            Select a case to investigate. Every case is free to play — no paywalls, no limits.
          </p>
        </div>

        {/* Track tabs */}
        <div className="flex flex-wrap gap-2" data-tour-target="cases-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTrack(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                activeTrack === tab.key
                  ? "bg-cyan-400/15 text-cyan-300 border-cyan-400/30"
                  : "text-slate-400 border-white/[0.06] hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4" data-tour-target="cases-cards">
          {filteredScenarios.map((scenario, i) => {
            const isCompleted = completedScenarios.includes(scenario.id);
            const tag = getScenarioTag(scenario.id);
            const track = scenario.track || "dql";

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <motion.button
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setScenario(scenario)}
                  className="w-full glass-panel-strong rounded-xl p-5 text-left border border-white/[0.06] hover:border-cyan-400/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-100">{scenario.title}</h3>
                        {isCompleted && (
                          <span className="text-emerald-400 text-xs">&#10003; Completed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500">{scenario.company}</p>
                        <span
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${TRACK_COLORS[track as ScenarioTrack]}`}
                        >
                          {TRACK_LABELS[track as ScenarioTrack]}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        DIFFICULTY_COLORS[scenario.difficulty]
                      }`}
                    >
                      {scenario.difficulty}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">{scenario.briefing}</p>

                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <span className="text-[10px] text-slate-500">{scenario.steps.length} steps</span>
                    <span className="text-[10px] text-slate-600">.</span>
                    <span className="text-[10px] text-slate-500">+{scenario.steps.length * 25} XP</span>
                    {tag && (
                      <span className="text-[10px] font-mono font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    )}
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
