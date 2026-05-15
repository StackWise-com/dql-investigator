"use client";

// MUST be the first import so that the log-generator seed override
// is applied before any scenario modules are loaded.
import "@/lib/dql/seed-override";

import { useState } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { useHashRouter } from "@/lib/hooks/useHashRouter";
import { DataViewPane } from "./panes/DataViewPane";
import { CommandDeckPane } from "./panes/CommandDeckPane";
import { ScenarioSelector } from "./ScenarioSelector";
import { VictoryModal } from "./VictoryModal";
import { CodexScreen } from "./CodexScreen";
import { LandingPage } from "./LandingPage";
import { LoginPage } from "./LoginPage";
import { ArcadeScreen } from "./arcade/ArcadeScreen";
import { FeedbackButton } from "./FeedbackButton";
import { CaseWorkspace } from "./CaseWorkspace";
import { LessonShell } from "./curriculum/LessonShell";
import { useAuth } from "@/lib/auth/useAuth";
import { useProgressSync } from "@/lib/auth/useProgressSync";
import { TermsAcceptModal } from "./TermsAcceptModal";
import { WelcomeModal } from "./WelcomeModal";
import { TourProvider } from "./tour/TourProvider";
import { TourAutoTrigger } from "./tour/TourAutoTrigger";

const COMMAND_VISUALS: { cmd: string; title: string; description: string; color: string }[] = [
  { cmd: "filter", title: "Filter", description: "Matching rows glow green. Non-matching rows flash red and fade away.", color: "text-rose-400 border-rose-400/20" },
  { cmd: "filterOut", title: "Filter Out", description: "Matching rows flash orange and fade away.", color: "text-orange-400 border-orange-400/20" },
  { cmd: "sort", title: "Sort", description: "Rows physically swap positions with spring physics.", color: "text-amber-400 border-amber-400/20" },
  { cmd: "limit", title: "Limit", description: "A vertical wall slides in. Rows beyond it fade away.", color: "text-violet-400 border-violet-400/20" },
  { cmd: "summarize", title: "Summarize", description: "Rows merge into groups and morph into a bar chart.", color: "text-emerald-400 border-emerald-400/20" },
  { cmd: "fieldsAdd", title: "Fields Add", description: "New columns slide in from the right with a green glow.", color: "text-cyan-400 border-cyan-400/20" },
  { cmd: "parse", title: "Parse", description: "A scanner sweep highlights extracted fields in teal.", color: "text-teal-400 border-teal-400/20" },
  { cmd: "dedup", title: "Dedup", description: "Duplicate rows flash amber and collapse into one.", color: "text-yellow-400 border-yellow-400/20" },
];

const SANDBOX_STARTERS = [
  {
    label: "Find all ERROR logs",
    description: "Filter a log stream down to only error-level entries.",
    query: 'fetch logs\n| filter loglevel == "ERROR"',
  },
  {
    label: "Count events by service",
    description: "Aggregate business events and group by service name.",
    query: "fetch bizevents\n| summarize count = count(), by: {service}",
  },
  {
    label: "Top 10 slowest spans",
    description: "Sort distributed traces by duration and take the worst ten.",
    query: "fetch spans\n| sort duration desc\n| limit 10",
  },
  {
    label: "Parse a field from content",
    description: "Extract a structured field from an unstructured log message.",
    query: 'fetch logs\n| parse content, "LD:msg"',
  },
];

function SandboxPane() {
  const setEditorValue = useInvestigatorStore((s) => s.setEditorValue);
  const setViewMode = useInvestigatorStore((s) => s.setViewMode);
  const [refOpen, setRefOpen] = useState(false);

  const loadStarter = (query: string) => {
    setEditorValue(query);
    setViewMode("editor");
  };

  return (
    <div className="w-[28%] min-w-[280px] glass-panel border-r border-cyan-400/20 flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-white/[0.06]">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Sandbox</h2>
        <p className="text-xs text-slate-500">Write any DQL pipeline and see results instantly. No objectives — just explore.</p>
      </div>

      <div className="p-4 space-y-2" data-tour-target="sandbox-starters">
        <p className="text-xs font-medium text-slate-500 mb-3">Starter Queries</p>
        {SANDBOX_STARTERS.map((s) => (
          <div key={s.label} className="glass-panel-strong rounded-lg border border-white/[0.05] p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-slate-200">{s.label}</p>
              <button
                onClick={() => loadStarter(s.query)}
                className="shrink-0 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 px-2 py-0.5 rounded transition-colors"
              >
                Load →
              </button>
            </div>
            <p className="text-xs text-slate-500">{s.description}</p>
            <pre className="text-xs text-slate-400 font-mono bg-black/20 rounded px-2 py-1 overflow-x-auto">{s.query}</pre>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => setRefOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-300 py-2 border-t border-white/[0.04] transition-colors"
        >
          <span>DQL Command Reference</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${refOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {refOpen && (
          <div className="mt-2 space-y-1.5">
            {COMMAND_VISUALS.map((v) => (
              <div key={v.cmd} className={`rounded border p-2.5 ${v.color} bg-white/[0.02]`}>
                <p className="text-xs font-semibold">{v.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{v.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VisualGuide() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 font-semibold">Visual Signatures</p>
      {COMMAND_VISUALS.map((v) => (
        <div key={v.cmd} className={`rounded-lg border p-3 ${v.color} bg-white/[0.02]`}>
          <p className="text-sm font-semibold">{v.title}</p>
          <p className="text-xs text-slate-400 mt-1">{v.description}</p>
        </div>
      ))}
    </div>
  );
}

function getPageName(opts: {
  showLanding: boolean;
  currentPhase: number;
  activeScenario: { title: string } | null;
}): string {
  const { showLanding, currentPhase, activeScenario } = opts;
  if (showLanding) return "Landing Page";
  if (currentPhase === 0) return "Learn – Codex";
  if (currentPhase === 1) return "Workbench";
  if (currentPhase === 2) return activeScenario ? `Cases – ${activeScenario.title}` : "Cases – Scenario Selector";
  if (currentPhase === 3) return "Arcade";
  return "DQL Detective";
}

export function InvestigatorShell() {
  useHashRouter();
  useAuth();
  useProgressSync();

  const currentPhase = useInvestigatorStore((s) => s.currentPhase);
  const activeScenario = useInvestigatorStore((s) => s.activeScenario);
  const activeLessonContext = useInvestigatorStore((s) => s.activeLessonContext);
  const showLanding = useInvestigatorStore((s) => s.showLanding);
  const userEmail = useInvestigatorStore((s) => s.userEmail);
  const hasSeenDemo = useInvestigatorStore((s) => s.hasSeenDemo);
  const setHasSeenDemo = useInvestigatorStore((s) => s.setHasSeenDemo);

  if (!userEmail) {
    return <LoginPage />;
  }

  const pageName = getPageName({ showLanding, currentPhase, activeScenario });

  const renderCasesPhase = () => {
    if (!activeScenario) {
      // First-time demo gate: if user hasn't seen the demo and lands on Cases,
      // auto-start the demo scenario.
      if (!hasSeenDemo && currentPhase === 2) {
        const { funScenarios } = require("@/lib/dql/fun-scenarios");
        const demo = funScenarios.find((s: { id: string }) => s.id === "demo-001");
        if (demo) {
          const setScenario = useInvestigatorStore.getState().setScenario;
          setScenario(demo);
          return null; // will re-render with activeScenario set
        }
      }
      return <ScenarioSelector />;
    }
    // Lesson mode: wrap in LessonShell for intro → scenario → check → complete flow
    if (activeLessonContext) {
      return <LessonShell />;
    }
    return <CaseWorkspace />;
  };

  return (
    <TourProvider>
      <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
        <TourAutoTrigger />
        <div className="flex-1 flex overflow-hidden">
          {showLanding ? (
            <LandingPage />
          ) : currentPhase === 0 ? (
            <CodexScreen />
          ) : currentPhase === 1 ? (
            /* Workbench: free-form pipeline play (merged Sandbox + Visualize) */
            <div className="flex-1 flex">
              <SandboxPane />
              <DataViewPane />
              <CommandDeckPane />
            </div>
          ) : currentPhase === 3 ? (
            <ArcadeScreen />
          ) : (
            renderCasesPhase()
          )}
        </div>
        <VictoryModal />
        <TermsAcceptModal />
        <WelcomeModal />
        <FeedbackButton page={pageName} />
      </div>
    </TourProvider>
  );
}
