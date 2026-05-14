"use client";

import { CaseNarrativePanel } from "./CaseNarrativePanel";
import { DataViewPane } from "./panes/DataViewPane";
import { QueryDeck } from "./QueryDeck";

export function CaseWorkspace() {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left 50% — Narrative + Character */}
      <div className="w-1/2 min-w-[360px] glass-panel border-r border-cyan-400/20 flex flex-col overflow-hidden">
        <CaseNarrativePanel />
      </div>

      {/* Right 50% — Query Deck (top ~30%) + Evidence Board (bottom ~70%) */}
      <div className="w-1/2 min-w-[360px] flex flex-col overflow-hidden">
        <div className="h-[30%] min-h-[200px] glass-panel border-b border-cyan-400/20 flex flex-col overflow-hidden">
          <QueryDeck />
        </div>
        <div className="flex-1 glass-panel flex flex-col overflow-hidden">
          <DataViewPane />
        </div>
      </div>
    </div>
  );
}
