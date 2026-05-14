"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { parsePipeline } from "@/lib/dql/parser";

export function QueryDeck() {
  const editorValue = useInvestigatorStore((s) => s.editorValue);
  const setEditorValue = useInvestigatorStore((s) => s.setEditorValue);
  const setPipeline = useInvestigatorStore((s) => s.setPipeline);
  const pipeline = useInvestigatorStore((s) => s.pipeline);

  const [hasUnrunChanges, setHasUnrunChanges] = useState(false);

  const handleChange = (value: string) => {
    setEditorValue(value);
    setHasUnrunChanges(true);
  };

  const handleRun = () => {
    const parsed = parsePipeline(editorValue);
    setPipeline(parsed);
    setHasUnrunChanges(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  };

  const handleClear = () => {
    setEditorValue("");
    setPipeline([]);
    setHasUnrunChanges(false);
  };

  return (
    <div className="h-full flex flex-col" data-tour-target="commanddeck">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">Query Deck</span>
        <span className="text-[10px] text-slate-500">{pipeline.length} stage{pipeline.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0 p-3 flex flex-col gap-2">
        <textarea
          value={editorValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type your DQL pipeline here...\nExample:\nfetch logs\n| filter action == "stole"\n| summarize count = count()`}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 w-full resize-none rounded-lg bg-slate-950/80 border border-white/[0.08] text-xs font-mono text-slate-200 p-3 leading-relaxed focus:outline-none focus:border-cyan-400/40 placeholder:text-slate-600"
        />

        {/* Supported commands hint */}
        <div className="shrink-0 flex flex-wrap gap-1">
          {["fetch", "filter", "fields", "sort", "limit", "summarize", "dedup", "search", "parse", "expand"].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                const prefix = editorValue.length > 0 && !editorValue.endsWith("\n") ? "\n" : "";
                const pipe = editorValue.length > 0 ? "| " : "";
                const next = `${editorValue}${prefix}${pipe}${cmd} `;
                setEditorValue(next);
                setHasUnrunChanges(true);
              }}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-500 hover:text-cyan-300 hover:bg-cyan-400/10 border border-white/[0.06] transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 p-3 border-t border-white/[0.06] flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRun}
          disabled={!editorValue.trim()}
          data-tour-target="run-button"
          className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            hasUnrunChanges && editorValue.trim()
              ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-400/25"
              : editorValue.trim()
              ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-400/25"
              : "bg-white/5 text-slate-500 border border-white/[0.06] cursor-not-allowed"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
          Run Pipeline
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClear}
          className="px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-400/10 border border-rose-400/20"
        >
          Clear
        </motion.button>
      </div>
    </div>
  );
}
