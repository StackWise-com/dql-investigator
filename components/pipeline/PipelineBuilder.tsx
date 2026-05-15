"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import type { PipelineStage, DQLCommandName } from "@/lib/types/dql";

const COMMANDS: { name: DQLCommandName; category: string; description: string }[] = [
  { name: "fetch", category: "Source", description: "Load data from a source" },
  { name: "data", category: "Source", description: "Generate sample records inline" },
  { name: "filter", category: "Filter", description: "Keep rows matching a condition" },
  { name: "filterOut", category: "Filter", description: "Remove rows matching a condition" },
  { name: "search", category: "Filter", description: "Token-based search" },
  { name: "fieldsKeep", category: "Select", description: "Keep only specified columns" },
  { name: "fieldsAdd", category: "Select", description: "Add computed columns" },
  { name: "fieldsRemove", category: "Select", description: "Remove columns" },
  { name: "fieldsRename", category: "Select", description: "Rename columns" },
  { name: "sort", category: "Order", description: "Sort rows by field" },
  { name: "limit", category: "Order", description: "Limit row count" },
  { name: "summarize", category: "Aggregate", description: "Group and aggregate" },
  { name: "makeTimeseries", category: "Aggregate", description: "Create time series for charting" },
  { name: "dedup", category: "Aggregate", description: "Remove duplicate rows" },
  { name: "parse", category: "Parse", description: "Extract fields from text" },
  { name: "expand", category: "Structure", description: "Expand arrays into rows" },
  { name: "append", category: "Join", description: "Append subquery results" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Source: "border-emerald-400/30 text-emerald-400",
  Filter: "border-rose-400/30 text-rose-400",
  Select: "border-cyan-400/30 text-cyan-400",
  Order: "border-amber-400/30 text-amber-400",
  Aggregate: "border-violet-400/30 text-violet-400",
  Parse: "border-teal-400/30 text-teal-400",
  Structure: "border-sky-400/30 text-sky-400",
  Join: "border-fuchsia-400/30 text-fuchsia-400",
};

export function PipelineBuilder() {
  const pipeline = useInvestigatorStore((s) => s.pipeline);
  const addStage = useInvestigatorStore((s) => s.addStage);
  const removeStage = useInvestigatorStore((s) => s.removeStage);
  const moveStage = useInvestigatorStore((s) => s.moveStage);

  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(COMMANDS.map((c) => c.category)));
  const filteredCommands = filterCategory
    ? COMMANDS.filter((c) => c.category === filterCategory)
    : COMMANDS;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-3">
        <div className="flex flex-wrap gap-1">
          <motion.button
            onClick={() => setFilterCategory(null)}
            className={`px-2 py-0.5 rounded text-xs font-medium border ${
              filterCategory === null
                ? "bg-white/10 text-slate-200 border-white/20"
                : "text-slate-500 border-transparent hover:bg-white/5"
            }`}
          >
            All
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 rounded text-xs font-medium border ${
                filterCategory === cat
                  ? "bg-white/10 text-slate-200 border-white/20"
                  : "text-slate-500 border-transparent hover:bg-white/5"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {filteredCommands.map((cmd) => (
            <motion.button
              key={cmd.name}
              onClick={() => {
                const id = `stage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                addStage({
                  id,
                  command: cmd.name,
                  args: cmd.name === "fetch" ? { source: "logs" } : cmd.name === "limit" ? { count: 10 } : {},
                  raw: cmd.name,
                });
                setExpandedStage(id);
              }}
              className={`glass-panel rounded-md p-2 text-left border ${
                CATEGORY_COLORS[cmd.category] || "border-slate-600 text-slate-400"
              }`}
            >
              <span className="text-xs font-semibold block">{cmd.name}</span>
              <span className="text-xs text-slate-500 block mt-0.5 leading-tight">{cmd.description}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="text-xs font-medium text-slate-500 mb-2">Pipeline</div>
        <div className="space-y-1.5">
          <AnimatePresence>
            {pipeline.map((stage, index) => (
              <motion.div
                key={stage.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: 50 }}
                className={`glass-panel rounded-md border ${
                  CATEGORY_COLORS[
                    COMMANDS.find((c) => c.name === stage.command)?.category || ""
                  ] || "border-slate-700"
                }`}
              >
                <div
                  className="flex items-center justify-between px-3 py-2 cursor-pointer"
                  onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-mono">{index + 1}</span>
                    <span className="text-xs font-semibold">{stage.command}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index > 0) moveStage(index, index - 1);
                      }}
                      className="text-slate-600 hover:text-slate-300 text-xs px-1"
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index < pipeline.length - 1) moveStage(index, index + 1);
                      }}
                      className="text-slate-600 hover:text-slate-300 text-xs px-1"
                      disabled={index >= pipeline.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStage(stage.id);
                      }}
                      className="text-slate-600 hover:text-rose-400 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedStage === stage.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        <StageEditor stage={stage} index={index} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StageEditor({ stage, index }: { stage: PipelineStage; index: number }) {
  const pipeline = useInvestigatorStore((s) => s.pipeline);
  const setPipeline = useInvestigatorStore((s) => s.setPipeline);

  const updateArg = (key: string, value: unknown) => {
    const newPipeline = [...pipeline];
    newPipeline[index] = {
      ...newPipeline[index],
      args: { ...newPipeline[index].args, [key]: value },
    };
    setPipeline(newPipeline);
  };

  switch (stage.command) {
    case "fetch":
      return (
        <>
          <label className="text-xs text-slate-500">Source</label>
          <select
            value={String(stage.args.source || "logs")}
            onChange={(e) => updateArg("source", e.target.value)}
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40"
          >
            <option value="logs">logs</option>
            <option value="events">events</option>
            <option value="bizevents">bizevents</option>
            <option value="spans">spans</option>
          </select>
        </>
      );
    case "data":
      return (
        <>
          <label className="text-xs text-slate-500">Sample Records (JSON array)</label>
          <textarea
            value={String(stage.args.raw || "[{\"name\":\"test\",\"value\":1}]")}
            onChange={(e) => updateArg("raw", e.target.value)}
            placeholder='[{"name":"test","value":1}]'
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono h-20 resize-none"
          />
        </>
      );
    case "filter":
    case "filterOut":
      return (
        <>
          <label className="text-xs text-slate-500">Condition</label>
          <input
            value={String(stage.args.condition || "")}
            onChange={(e) => updateArg("condition", e.target.value)}
            placeholder="loglevel == 'ERROR'"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "fieldsKeep":
      return (
        <>
          <label className="text-xs text-slate-500">Fields (comma-separated)</label>
          <input
            value={String(stage.args.fields || "")}
            onChange={(e) => updateArg("fields", e.target.value)}
            placeholder="timestamp, loglevel, content"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "fieldsAdd":
      return (
        <>
          <label className="text-xs text-slate-500">Assignments</label>
          <input
            value={String(stage.args.assignments || "")}
            onChange={(e) => updateArg("assignments", e.target.value)}
            placeholder="severity = if(loglevel == 'ERROR', 'CRITICAL', 'WARNING')"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "sort":
      return (
        <>
          <label className="text-xs text-slate-500">Field</label>
          <input
            value={String(stage.args.field || "")}
            onChange={(e) => updateArg("field", e.target.value)}
            placeholder="timestamp"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono mb-2"
          />
          <label className="text-xs text-slate-500">Direction</label>
          <select
            value={String(stage.args.direction || "asc")}
            onChange={(e) => updateArg("direction", e.target.value)}
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </>
      );
    case "limit":
      return (
        <>
          <label className="text-xs text-slate-500">Count</label>
          <input
            type="number"
            value={Number(stage.args.count) || 10}
            onChange={(e) => updateArg("count", Number(e.target.value))}
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "summarize":
      return (
        <>
          <label className="text-xs text-slate-500">Aggregation</label>
          <input
            value={String(stage.args.aggregation || "count")}
            onChange={(e) => updateArg("aggregation", e.target.value)}
            placeholder="count"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono mb-2"
          />
          <label className="text-xs text-slate-500">By field</label>
          <input
            value={String(stage.args.by || "")}
            onChange={(e) => updateArg("by", e.target.value)}
            placeholder="host"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono mb-2"
          />
          <label className="text-xs text-slate-500">Alias</label>
          <input
            value={String(stage.args.alias || "count")}
            onChange={(e) => updateArg("alias", e.target.value)}
            placeholder="count"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "makeTimeseries":
      return (
        <>
          <label className="text-xs text-slate-500">Aggregation</label>
          <select
            value={String(stage.args.aggregation || "count")}
            onChange={(e) => updateArg("aggregation", e.target.value)}
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 mb-2"
          >
            <option value="count">count</option>
            <option value="sum">sum</option>
            <option value="avg">avg</option>
            <option value="max">max</option>
            <option value="min">min</option>
          </select>
          <label className="text-xs text-slate-500">Interval</label>
          <input
            value={String(stage.args.interval || "1h")}
            onChange={(e) => updateArg("interval", e.target.value)}
            placeholder="1h"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono mb-2"
          />
          <label className="text-xs text-slate-500">By field</label>
          <input
            value={String(stage.args.by || "")}
            onChange={(e) => updateArg("by", e.target.value)}
            placeholder="loglevel"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono mb-2"
          />
          <label className="text-xs text-slate-500">Alias</label>
          <input
            value={String(stage.args.alias || "count")}
            onChange={(e) => updateArg("alias", e.target.value)}
            placeholder="count"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "search":
      return (
        <>
          <label className="text-xs text-slate-500">Search term</label>
          <input
            value={String(stage.args.term || "")}
            onChange={(e) => updateArg("term", e.target.value)}
            placeholder="error"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "fieldsRemove":
      return (
        <>
          <label className="text-xs text-slate-500">Fields to remove (comma-separated)</label>
          <input
            value={String(stage.args.fields || "")}
            onChange={(e) => updateArg("fields", e.target.value)}
            placeholder="timestamp, host"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "fieldsRename":
      return (
        <>
          <label className="text-xs text-slate-500">Renames (old = new, comma-separated)</label>
          <input
            value={String(stage.args.assignments || "")}
            onChange={(e) => updateArg("assignments", e.target.value)}
            placeholder="old_name = new_name"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "dedup":
      return (
        <>
          <label className="text-xs text-slate-500">Field</label>
          <input
            value={String(stage.args.field || "")}
            onChange={(e) => updateArg("field", e.target.value)}
            placeholder="timestamp"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "parse":
      return (
        <>
          <label className="text-xs text-slate-500">Field</label>
          <input
            value={String(stage.args.field || "content")}
            onChange={(e) => updateArg("field", e.target.value)}
            placeholder="content"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono mb-2"
          />
          <label className="text-xs text-slate-500">Pattern</label>
          <input
            value={String(stage.args.pattern || "")}
            onChange={(e) => updateArg("pattern", e.target.value)}
            placeholder="ip=IP:attacker_ip"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    case "expand":
      return (
        <>
          <label className="text-xs text-slate-500">Array field</label>
          <input
            value={String(stage.args.field || "")}
            onChange={(e) => updateArg("field", e.target.value)}
            placeholder="tags"
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
    default:
      return (
        <>
          <label className="text-xs text-slate-500">Raw args</label>
          <input
            value={String(stage.args.raw || "")}
            onChange={(e) => updateArg("raw", e.target.value)}
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40 font-mono"
          />
        </>
      );
  }
}
