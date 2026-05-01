"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { PipelineBuilder } from "@/components/pipeline/PipelineBuilder";
import { QueryEditor } from "@/components/pipeline/QueryEditor";
import { parsePipeline } from "@/lib/dql/parser";

const MonacoQueryEditor = dynamic(
  () => import("@/components/pipeline/MonacoQueryEditor").then((mod) => ({ default: mod.MonacoQueryEditor })),
  { ssr: false, loading: () => <QueryEditor /> }
);

export function CommandDeckPane() {
  const viewMode = useInvestigatorStore((s) => s.viewMode);
  const setViewMode = useInvestigatorStore((s) => s.setViewMode);
  const pipeline = useInvestigatorStore((s) => s.pipeline);
  const editorValue = useInvestigatorStore((s) => s.editorValue);
  const setPipeline = useInvestigatorStore((s) => s.setPipeline);
  const clearPipeline = () => useInvestigatorStore.getState().setPipeline([]);

  const isEditor = viewMode === "editor";
  const hasEditorText = editorValue.trim().length > 0;
  const pipelineFromEditor = isEditor ? parsePipeline(editorValue) : [];
  const hasUnrunChanges =
    isEditor && hasEditorText && (pipeline.length === 0 || pipeline.length !== pipelineFromEditor.length);

  const handleRun = () => {
    const parsed = parsePipeline(editorValue);
    setPipeline(parsed);
  };

  const showRunButton = isEditor && hasEditorText;

  return (
    <div className="w-[28%] min-w-[300px] glass-panel border-l border-cyan-400/20 flex flex-col">
      <div className="h-10 flex items-center px-4 border-b border-white/[0.06] justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">Command Deck</span>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("cards")}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium ${
              viewMode === "cards"
                ? "bg-cyan-400/20 text-cyan-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Cards
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("editor")}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium ${
              viewMode === "editor"
                ? "bg-cyan-400/20 text-cyan-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Editor
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {viewMode === "cards" ? <PipelineBuilder /> : <MonacoQueryEditor />}
      </div>

      <div className="p-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] text-slate-500">{pipeline.length} stage{pipeline.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-2">
          {showRunButton ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRun}
              className={`px-3 py-1.5 rounded-md text-[10px] font-medium flex items-center gap-1.5 transition-colors ${
                hasUnrunChanges
                  ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-400/25"
                  : "bg-white/5 text-slate-400 border border-white/[0.06] hover:bg-white/10"
              }`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
              Run
            </motion.button>
          ) : null}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearPipeline}
            className="px-3 py-1.5 rounded-md text-[10px] font-medium text-rose-400 hover:bg-rose-400/10 border border-rose-400/20"
          >
            Clear
          </motion.button>
        </div>
      </div>
    </div>
  );
}
