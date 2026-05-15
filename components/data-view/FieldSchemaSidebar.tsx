"use client";

import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import type { DQLColumn, DQLRecord } from "@/lib/types/dql";

interface FieldSchemaSidebarProps {
  columns: DQLColumn[];
  sampleRow: DQLRecord | null;
}

const TYPE_COLORS: Record<string, string> = {
  string: "text-emerald-400",
  number: "text-violet-400",
  boolean: "text-amber-400",
  object: "text-blue-400",
  array: "text-cyan-400",
  null: "text-slate-500",
};

const TYPE_ABBR: Record<string, string> = {
  string: "str",
  number: "num",
  boolean: "bool",
  object: "obj",
  array: "arr",
  null: "null",
};

export function FieldSchemaSidebar({ columns, sampleRow }: FieldSchemaSidebarProps) {
  const hiddenColumns = useInvestigatorStore((s) => s.hiddenColumns);
  const toggleHiddenColumn = useInvestigatorStore((s) => s.toggleHiddenColumn);
  const addStage = useInvestigatorStore((s) => s.addStage);
  const editorValue = useInvestigatorStore((s) => s.editorValue);
  const setEditorValue = useInvestigatorStore((s) => s.setEditorValue);
  const pipeline = useInvestigatorStore((s) => s.pipeline);

  const getRuntimeType = (col: DQLColumn): string => {
    if (sampleRow) {
      const v = sampleRow[col.name];
      if (v === null || v === undefined) return col.type || "null";
      if (Array.isArray(v)) return "array";
      return typeof v;
    }
    return col.type || "string";
  };

  const addToFields = (fieldName: string) => {
    const lastStage = pipeline[pipeline.length - 1];
    if (lastStage?.command === "fields") {
      const existing = String(lastStage.args.fields || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!existing.includes(fieldName)) {
        const updated = [...existing, fieldName].join(", ");
        const raw = `fields ${updated}`;
        const newPipeline = pipeline.map((s) =>
          s.id === lastStage.id ? { ...s, args: { fields: updated }, raw } : s
        );
        useInvestigatorStore.getState().setPipeline(newPipeline);
        const lines = editorValue.trimEnd().split("\n");
        const lastLine = lines[lines.length - 1];
        if (lastLine?.trimStart().startsWith("fields") || lastLine?.trimStart().startsWith("| fields")) {
          lines[lines.length - 1] = `| ${raw}`;
          setEditorValue(lines.join("\n"));
        }
      }
    } else {
      const raw = `fields ${fieldName}`;
      addStage({ id: `stage-fields-${Date.now()}`, command: "fields", args: { fields: fieldName }, raw });
      const base = editorValue.trimEnd();
      setEditorValue(base ? `${base}\n| ${raw}` : `| ${raw}`);
    }
  };

  const filterByField = (fieldName: string) => {
    const condition = `${fieldName} == ""`;
    const raw = `filter ${condition}`;
    addStage({ id: `stage-sidebar-${Date.now()}`, command: "filter", args: { condition }, raw });
    const base = editorValue.trimEnd();
    setEditorValue(base ? `${base}\n| ${raw}` : `| ${raw}`);
  };

  if (columns.length === 0) return null;

  return (
    <div className="hidden lg:flex flex-col w-52 shrink-0 border-r border-white/[0.06] bg-slate-900/60">
      <div className="h-10 flex items-center px-3 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-slate-400">Fields</span>
        <span className="ml-auto text-xs text-slate-600">{columns.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {columns.map((col) => {
          const type = getRuntimeType(col);
          const typeColor = TYPE_COLORS[type] || "text-slate-400";
          const typeAbbr = TYPE_ABBR[type] || type.slice(0, 3);
          const isHidden = hiddenColumns.includes(col.name);

          return (
            <div
              key={col.name}
              className={`group/field flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] transition-colors ${isHidden ? "opacity-40" : ""}`}
            >
              <span className={`text-xs font-mono w-6 shrink-0 ${typeColor}`}>{typeAbbr}</span>
              <span className="flex-1 text-xs text-slate-300 truncate" title={col.name}>{col.name}</span>
              <div className="hidden group-hover/field:flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => filterByField(col.name)}
                  className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                  title="Filter by this field"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => addToFields(col.name)}
                  className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                  title="Add to fields stage"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => toggleHiddenColumn(col.name)}
                  className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                  title={isHidden ? "Show column" : "Hide column"}
                >
                  {isHidden ? (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                      <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                      <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
                      <path d="M2 14L14 2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
