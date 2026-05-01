"use client";

import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { runPipeline, inferColumns } from "@/lib/dql/engine";
import { getSampleData } from "@/lib/dql/data";
import type { DQLRecord, PipelineStage } from "@/lib/types/dql";

const DISPLAY_LIMIT = 200;

export function DataViewPane() {
  const pipeline = useInvestigatorStore((s) => s.pipeline);
  const activeScenario = useInvestigatorStore((s) => s.activeScenario);
  const currentStepIndex = useInvestigatorStore((s) => s.currentStepIndex);
  const selectedStageIndex = useInvestigatorStore((s) => s.selectedStageIndex);
  const setSelectedStageIndex = useInvestigatorStore((s) => s.setSelectedStageIndex);
  const setStageResults = useInvestigatorStore((s) => s.setStageResults);
  const [flashStage, setFlashStage] = useState<number | null>(null);
  const [prevPipelineLen, setPrevPipelineLen] = useState(pipeline.length);

  const initialData = useMemo(() => {
    if (activeScenario) {
      const step = activeScenario.steps[currentStepIndex];
      return step?.sampleData || [];
    }
    return getSampleData("logs");
  }, [activeScenario, currentStepIndex]);

  const results = useMemo(() => {
    if (pipeline.length === 0) {
      const cols = inferColumns(initialData);
      return [
        {
          stageId: "input",
          command: "fetch" as const,
          data: initialData,
          columns: cols,
          recordCount: initialData.length,
          previousData: [],
          previousColumns: [],
        },
      ];
    }
    return runPipeline(pipeline, initialData);
  }, [pipeline, initialData]);

  // Auto-switch to last stage when pipeline grows (new card added or editor run)
  useEffect(() => {
    if (pipeline.length > prevPipelineLen && results.length > 0) {
      const lastIndex = results.length - 1;
      setSelectedStageIndex(lastIndex);
      setFlashStage(lastIndex);
      const t = setTimeout(() => setFlashStage(null), 800);
      setPrevPipelineLen(pipeline.length);
      return () => clearTimeout(t);
    }
    if (pipeline.length !== prevPipelineLen) {
      setPrevPipelineLen(pipeline.length);
    }
  }, [pipeline.length, prevPipelineLen, results.length, setSelectedStageIndex]);

  useEffect(() => {
    setStageResults(
      results.map((r) => ({
        stageId: r.stageId,
        data: r.data,
        columns: r.columns,
        previousData: r.previousData,
        previousColumns: r.previousColumns,
      }))
    );
  }, [results, setStageResults]);

  const displayResult =
    selectedStageIndex >= 0 && selectedStageIndex < results.length
      ? results[selectedStageIndex]
      : results[results.length - 1];

  const columns = displayResult?.columns || [];
  const rows = displayResult?.data || [];
  const command = displayResult?.command || "fetch";
  const prevRows = displayResult?.previousData || [];

  // Search term for highlighting
  const searchTerm = command === "search"
    ? String(displayResult?.stageId ? pipeline.find((p) => p.id === displayResult.stageId)?.args?.term || "" : "").toLowerCase()
    : "";

  // Build a set of keys for row identity
  const rowKey = (row: DQLRecord, idx: number) => {
    if (row["timestamp"]) return String(row["timestamp"]);
    if (row["order_id"]) return String(row["order_id"]);
    if (row["span.name"]) return String(row["span.name"]);
    return JSON.stringify(row) + idx;
  };

  const prevKeys = new Set(prevRows.map((r, i) => rowKey(r, i)));
  const currentKeys = new Set(rows.map((r, i) => rowKey(r, i)));

  const removedRows = prevRows.filter((r, i) => !currentKeys.has(rowKey(r, i)));
  const addedRows = rows.filter((r, i) => !prevKeys.has(rowKey(r, i)));

  const getRowVisualState = (row: DQLRecord, idx: number) => {
    const key = rowKey(row, idx);
    const isNew = !prevKeys.has(key) && prevRows.length > 0;
    const isRemoved = !currentKeys.has(key);

    switch (command) {
      case "filter":
        if (isRemoved) return "removed-red";
        if (!isNew && removedRows.length > 0) return "kept-green";
        return "normal";
      case "filterOut":
        if (isRemoved) return "removed-orange";
        if (!isNew && removedRows.length > 0) return "kept-green";
        return "normal";
      case "sort":
        return "swap";
      case "limit":
        if (idx >= Number(pipeline[selectedStageIndex]?.args?.count || 100)) return "cutoff";
        return "normal";
      case "summarize":
        return "merge";
      case "dedup":
        if (isRemoved) return "merged-amber";
        return "normal";
      case "fieldsAdd":
        if (isNew) return "new-green";
        return "normal";
      case "parse":
        return "scan";
      case "makeTimeseries":
        return "timeseries";
      default:
        return "normal";
    }
  };

  const getRowClasses = (state: string) => {
    switch (state) {
      case "removed-red":
        return "bg-rose-500/20 border-rose-500/40 text-rose-200";
      case "removed-orange":
        return "bg-orange-500/20 border-orange-500/40 text-orange-200";
      case "kept-green":
        return "border-emerald-500/30";
      case "new-green":
        return "bg-emerald-500/10 border-emerald-500/30";
      case "merged-amber":
        return "bg-amber-500/20 border-amber-500/40";
      case "cutoff":
        return "bg-rose-500/10 border-rose-500/20 opacity-50";
      case "scan":
        return "border-teal-400/30";
      case "timeseries":
        return "border-violet-400/30 bg-violet-400/5";
      default:
        return "";
    }
  };

  const getInitialAnimation = (state: string, idx: number) => {
    switch (state) {
      case "removed-red":
      case "removed-orange":
      case "merged-amber":
        return { opacity: 1, y: 0, scale: 1, backgroundColor: "rgba(239,68,68,0.1)" };
      case "new-green":
        return { opacity: 0, x: 20 };
      case "swap":
        return { opacity: 0, y: idx % 2 === 0 ? -10 : 10 };
      case "timeseries":
        return { opacity: 0, y: -8, scale: 0.98 };
      default:
        return { opacity: 0, y: 6 };
    }
  };

  const getAnimateState = (state: string, idx: number) => {
    switch (state) {
      case "removed-red":
      case "removed-orange":
      case "merged-amber":
        return {
          opacity: 0,
          y: 20,
          scale: 0.95,
          backgroundColor: state === "merged-amber" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.2)",
          transition: { delay: 0.3 + idx * 0.05, duration: 0.4 },
        };
      case "new-green":
        return { opacity: 1, x: 0, transition: { delay: idx * 0.03, duration: 0.3 } };
      case "swap":
        return { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25, delay: idx * 0.02 } };
      case "timeseries":
        return { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 200, damping: 20, delay: idx * 0.03 } };
      default:
        return { opacity: 1, y: 0, transition: { delay: idx < 20 ? idx * 0.015 : 0, duration: 0.2 } };
    }
  };

  return (
    <div className="flex-1 min-w-0 glass-panel border-x border-cyan-400/10 flex flex-col">
      <div className="h-10 flex items-center px-4 border-b border-white/[0.06] justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">Data View</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500">
            {displayResult?.command && selectedStageIndex >= 0
              ? `Stage ${selectedStageIndex + 1}: ${displayResult.command}`
              : "Source"}
          </span>
          <span className="text-xs font-mono text-emerald-400">{rows.length} rows</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 relative">
        {/* Persistent Pipeline Impact Timeline */}
        {results.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 glass-panel-strong border border-white/[0.06] rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">Impact</span>
              <div className="w-px h-3 bg-white/10 shrink-0" />
              {results.slice(1).map((r, i) => {
                const idx = i + 1;
                const prevCount = r.previousData.length;
                const pct = prevCount > 0 ? (r.recordCount / prevCount) * 100 : 100;
                const isActive = selectedStageIndex === idx || (selectedStageIndex < 0 && idx === results.length - 1);
                const delta = r.recordCount - prevCount;
                const deltaColor = delta < 0 ? "text-rose-400" : delta > 0 ? "text-emerald-400" : "text-slate-500";
                const deltaArrow = delta < 0 ? "▼" : delta > 0 ? "▲" : "●";
                return (
                  <motion.button
                    key={r.stageId}
                    onClick={() => {
                      setSelectedStageIndex(idx);
                      setFlashStage(idx);
                      setTimeout(() => setFlashStage(null), 600);
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                      isActive
                        ? "bg-cyan-400/10 text-cyan-300 border-cyan-400/20"
                        : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                    }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="uppercase tracking-wider">{r.command}</span>
                    <span className="text-slate-500">{prevCount}</span>
                    <span className="text-slate-600">→</span>
                    <span className={deltaColor}>
                      {deltaArrow} {r.recordCount}
                    </span>
                    <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          r.recordCount === 0
                            ? "bg-rose-400/60"
                            : pct < 50
                            ? "bg-amber-400/60"
                            : "bg-emerald-400/60"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ delay: 0.05 + i * 0.03, duration: 0.4 }}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Brief flash overlay on active stage */}
        <AnimatePresence>
          {flashStage !== null && results[flashStage] && (
            <motion.div
              key={`flash-${flashStage}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-4 top-16 z-10 glass-panel-strong border border-cyan-400/30 rounded-lg px-4 py-2 flex items-center justify-between pointer-events-none"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">{results[flashStage].command}</span>
                <span className="text-[10px] text-slate-500">
                  {results[flashStage].previousData.length} → {results[flashStage].recordCount} rows
                </span>
              </div>
              <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-400/60 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${results[flashStage].previousData.length > 0
                      ? (results[flashStage].recordCount / results[flashStage].previousData.length) * 100
                      : 100}%`,
                  }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {rows.length > 0 ? (
          <div className="min-w-full">
            <div className="flex gap-2 mb-3">
              {results.map((r, i) => (
                <motion.button
                  key={r.stageId}
                  onClick={() => {
                    setSelectedStageIndex(i);
                    setFlashStage(i);
                    setTimeout(() => setFlashStage(null), 500);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    (selectedStageIndex < 0 && i === results.length - 1) || selectedStageIndex === i
                      ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30"
                      : "bg-white/5 text-slate-400 border border-transparent hover:bg-white/10"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {r.command}
                  <span className="ml-1 opacity-60">({r.recordCount})</span>
                </motion.button>
              ))}
            </div>

            <div className="glass-panel-strong rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {columns.map((col) => (
                      <th
                        key={col.name}
                        className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                      >
                        {col.name}
                        <span className="ml-1.5 text-slate-600 font-normal">{col.type}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {rows.slice(0, DISPLAY_LIMIT).map((row, i) => {
                      const state = getRowVisualState(row, i);
                      const classes = getRowClasses(state);
                      return (
                        <motion.tr
                          key={rowKey(row, i)}
                          layout
                          initial={getInitialAnimation(state, i)}
                          animate={getAnimateState(state, i)}
                          exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                          className={`border-b border-white/[0.03] even:bg-white/[0.02] hover:bg-white/[0.04] transition-colors ${classes}`}
                        >
                          {columns.map((col) => (
                            <td
                              key={col.name}
                              className={`px-3 py-2 text-xs font-mono truncate max-w-[200px] ${state === "removed-red" || state === "removed-orange" ? "text-rose-200" : state === "new-green" ? "text-emerald-200" : "text-slate-300"}`}
                            >
                              {formatCell(row[col.name], searchTerm)}
                            </td>
                          ))}
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              {rows.length > DISPLAY_LIMIT && (
                <div className="px-3 py-2 text-[10px] text-slate-500 bg-white/[0.02] border-t border-white/[0.06]">
                  Showing {DISPLAY_LIMIT} of {rows.length} rows. Add a <code className="text-cyan-400/80">| limit</code> command to narrow results.
                </div>
              )}
            </div>

            {command === "summarize" && columns.length === 2 && rows.length > 0 && (
              <div className="mt-4 glass-panel-strong rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Summarize Chart</p>
                <div className="space-y-2">
                  {(() => {
                    const aggCol = columns[1];
                    const maxVal = Math.max(...rows.map((r) => Number(r[aggCol.name]) || 0));
                    return rows.map((row, i) => {
                      const label = String(row[columns[0].name]);
                      const val = Number(row[aggCol.name]) || 0;
                      const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                      return (
                        <div key={label} className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 w-24 truncate text-right">{label}</span>
                          <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden relative">
                            <motion.div
                              className="h-full bg-emerald-400/40 rounded"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.1 + i * 0.05, duration: 0.5, type: "spring" as const, stiffness: 200, damping: 20 }}
                            />
                            <span className="absolute inset-0 flex items-center px-2 text-[10px] text-slate-300 font-mono">{val}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {command === "makeTimeseries" && rows.length > 0 && (
              <div className="mt-4 glass-panel-strong rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Time Series</p>
                <div className="flex items-end gap-1 h-32 px-2">
                  {(() => {
                    const valCol = columns.find((c) => c.name !== "timestamp")?.name || columns[0].name;
                    const maxVal = Math.max(...rows.map((r) => Number(r[valCol]) || 0), 1);
                    return rows.map((row, i) => {
                      const val = Number(row[valCol]) || 0;
                      const pct = (val / maxVal) * 100;
                      const ts = String(row.timestamp || "").slice(11, 16);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-end justify-center h-24 bg-white/[0.02] rounded-t relative overflow-hidden">
                            <motion.div
                              className="w-3/4 bg-violet-400/40 rounded-t"
                              initial={{ height: 0 }}
                              animate={{ height: `${pct}%` }}
                              transition={{ delay: 0.05 + i * 0.04, duration: 0.5, type: "spring" as const, stiffness: 150, damping: 15 }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-500">{ts}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Filter / FilterOut impact mini-chart */}
            {(command === "filter" || command === "filterOut") && displayResult && (
              <div className="mt-4 glass-panel-strong rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">{command === "filter" ? "Filter Impact" : "FilterOut Impact"}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden relative flex">
                    {(() => {
                      const before = displayResult.previousData.length;
                      const after = displayResult.recordCount;
                      const kept = command === "filter" ? after : before - after;
                      const removed = before - kept;
                      const keptPct = before > 0 ? (kept / before) * 100 : 0;
                      const removedPct = before > 0 ? (removed / before) * 100 : 0;
                      return (
                        <>
                          <motion.div
                            className="h-full bg-emerald-400/40"
                            initial={{ width: 0 }}
                            animate={{ width: `${keptPct}%` }}
                            transition={{ duration: 0.5, type: "spring" as const, stiffness: 150, damping: 20 }}
                          />
                          <motion.div
                            className="h-full bg-rose-400/40"
                            initial={{ width: 0 }}
                            animate={{ width: `${removedPct}%` }}
                            transition={{ duration: 0.5, delay: 0.1, type: "spring" as const, stiffness: 150, damping: 20 }}
                          />
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-emerald-400">{displayResult.recordCount}</span>
                    <span className="text-[10px] text-slate-500"> / {displayResult.previousData.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sort reorder indicator */}
            {command === "sort" && prevRows.length > 0 && rows.length > 0 && (
              <div className="mt-4 glass-panel-strong rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Sort Reorder</p>
                <div className="flex items-center gap-1 h-8">
                  {(() => {
                    const sortField = String(pipeline[selectedStageIndex]?.args?.field || "");
                    const getVal = (r: DQLRecord) => {
                      const v = r[sortField];
                      if (typeof v === "number") return v;
                      if (typeof v === "string" && !isNaN(Date.parse(v))) return new Date(v).getTime();
                      return String(v);
                    };
                    const prevVals = prevRows.slice(0, 20).map(getVal);
                    const currVals = rows.slice(0, 20).map(getVal);
                    const maxNum = Math.max(...prevVals.filter((v) => typeof v === "number") as number[], 1);
                    return currVals.map((val, i) => {
                      const pct = typeof val === "number" ? (Math.abs(val) / maxNum) * 100 : 50;
                      return (
                        <motion.div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-0.5"
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.02, type: "spring" as const, stiffness: 300, damping: 20 }}
                        >
                          <div className="w-full h-4 bg-white/5 rounded relative overflow-hidden">
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 bg-amber-400/40 rounded-t"
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.min(pct, 100)}%` }}
                              transition={{ delay: i * 0.02, duration: 0.3 }}
                            />
                          </div>
                          <span className="text-[8px] text-slate-600">{i + 1}</span>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            pipeline={pipeline}
            results={results}
            initialData={initialData}
          />
        )}
      </div>
    </div>
  );
}

interface Diagnostic {
  stageIndex: number;
  command: string;
  title: string;
  message: string;
}

function diagnoseEmptyResults(
  pipeline: PipelineStage[],
  results: { stageId: string; command: string; data: DQLRecord[]; recordCount: number; previousData: DQLRecord[] }[]
): Diagnostic | null {
  if (pipeline.length === 0) return null;
  const emptyIdx = results.findIndex((r) => r.recordCount === 0);
  if (emptyIdx === -1) return null;

  const stage = pipeline[emptyIdx];
  const prevData = results[emptyIdx].previousData;

  switch (stage.command) {
    case "filter": {
      const condition = String(stage.args.condition || "");
      const fieldMatch = condition.match(/^([A-Za-z0-9_.\s]+)/);
      const field = fieldMatch ? fieldMatch[1].trim() : null;

      if (field && prevData.length > 0) {
        const hasField = prevData.some((r) => field in r);
        if (!hasField) {
          const availableFields = [...new Set(prevData.flatMap((r) => Object.keys(r)))].slice(0, 8).join(", ");
          return {
            stageIndex: emptyIdx,
            command: stage.command,
            title: "Field not found",
            message: `Your filter references "${field}", but that field doesn't exist. Available fields: ${availableFields}.`,
          };
        }
        const uniqueValues = [...new Set(prevData.map((r) => String(r[field] ?? "null")))];
        const preview = uniqueValues.slice(0, 10).join(", ");
        return {
          stageIndex: emptyIdx,
          command: stage.command,
          title: "Filter removed all rows",
          message: `Condition "${condition}" matched no records. Values for "${field}" in previous stage: ${preview}${uniqueValues.length > 10 ? ` (+${uniqueValues.length - 10} more)` : ""}.`,
        };
      }
      return {
        stageIndex: emptyIdx,
        command: stage.command,
        title: "Filter removed all rows",
        message: `Condition "${condition}" returned 0 rows. Check that your field names and values are correct.`,
      };
    }
    case "filterOut": {
      const condition = String(stage.args.condition || "");
      return {
        stageIndex: emptyIdx,
        command: stage.command,
        title: "FilterOut removed all rows",
        message: `Every row matched "${condition}", so filterOut removed everything. Try a more specific condition.`,
      };
    }
    case "search": {
      const term = String(stage.args.term || "");
      return {
        stageIndex: emptyIdx,
        command: stage.command,
        title: "Search found nothing",
        message: `No records contain "${term}". Try a different term or check for typos.`,
      };
    }
    case "parse": {
      const pattern = String(stage.args.pattern || "");
      const field = String(stage.args.field || "content");
      return {
        stageIndex: emptyIdx,
        command: stage.command,
        title: "Parse found no matches",
        message: `Pattern "${pattern}" didn't match any values in field "${field}". Check the pattern syntax and ensure the field exists.`,
      };
    }
    case "limit": {
      const count = Number(stage.args.count) || 0;
      return {
        stageIndex: emptyIdx,
        command: stage.command,
        title: "Limit capped to 0",
        message: `Limit ${count} cut off all rows. Increase the limit or remove the stage.`,
      };
    }
    default:
      return {
        stageIndex: emptyIdx,
        command: stage.command,
        title: "Pipeline produced 0 rows",
        message: `The ${stage.command} stage at position ${emptyIdx + 1} returned no records. Try adjusting your pipeline.`,
      };
  }
}

function EmptyState({
  pipeline,
  results,
  initialData,
}: {
  pipeline: PipelineStage[];
  results: { stageId: string; command: string; data: DQLRecord[]; recordCount: number; previousData: DQLRecord[] }[];
  initialData: DQLRecord[];
}) {
  const [showDiagnosis, setShowDiagnosis] = useState(false);

  if (pipeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
        <div className="w-32 h-20 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center">
          <span className="text-xs text-slate-600">No records</span>
        </div>
        <p className="text-sm text-slate-500">No data to display.</p>
        <p className="text-xs text-slate-600">Build a pipeline in the Command Deck to transform data.</p>
      </div>
    );
  }

  const diagnosis = diagnoseEmptyResults(pipeline, results);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
      <div className="w-32 h-20 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center">
        <span className="text-xs text-slate-600">No records</span>
      </div>
      <p className="text-sm text-slate-500">No data to display.</p>

      {!showDiagnosis ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDiagnosis(true)}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-300 border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          Diagnose
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm text-left glass-panel-strong rounded-lg border border-amber-400/20 p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Stage {diagnosis ? diagnosis.stageIndex + 1 : "?"}: {diagnosis?.command}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-200">{diagnosis?.title}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{diagnosis?.message}</p>
          {diagnosis && diagnosis.command === "filter" && (
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Tip: Click a stage button above the table to inspect the data at any point in the pipeline.
            </p>
          )}
          <button
            onClick={() => setShowDiagnosis(false)}
            className="text-[10px] text-slate-500 hover:text-slate-300 mt-1"
          >
            Hide
          </button>
        </motion.div>
      )}
    </div>
  );
}

function formatCell(value: unknown, searchTerm = ""): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-slate-600 italic">null</span>;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === "object") return "{...}";
  const s = String(value);
  const display = s.length > 60 ? s.slice(0, 60) + "..." : s;

  if (searchTerm && display.toLowerCase().includes(searchTerm)) {
    const parts = display.split(new RegExp(`(${escapeRegExp(searchTerm)})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm ? (
        <span key={i} className="bg-amber-400/30 text-amber-200 px-0.5 rounded">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }
  return display;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
