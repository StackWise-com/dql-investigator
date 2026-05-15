"use client";

import { useRef, useState } from "react";
import { Popover } from "@/components/ui/Popover";
import { MenuItem } from "@/components/ui/MenuItem";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import type { PipelineStage } from "@/lib/types/dql";

interface CellMenuProps {
  field: string;
  value: unknown;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  return String(value);
}

function quoteValue(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "null";
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

export function CellMenu({ field, value }: CellMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const addStage = useInvestigatorStore((s) => s.addStage);
  const editorValue = useInvestigatorStore((s) => s.editorValue);
  const setEditorValue = useInvestigatorStore((s) => s.setEditorValue);

  const applyFilter = (op: "==" | "!=") => {
    const condition = `${field} ${op} ${quoteValue(value)}`;
    const command = op === "==" ? "filter" : "filterOut";
    const raw = `${command} ${condition}`;
    const stage: PipelineStage = {
      id: `stage-cell-${Date.now()}`,
      command,
      args: { condition },
      raw,
    };
    addStage(stage);
    const base = editorValue.trimEnd();
    setEditorValue(base ? `${base}\n| ${raw}` : `| ${raw}`);
    setOpen(false);
  };

  const copyValue = () => {
    navigator.clipboard.writeText(formatValue(value));
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="opacity-0 group-hover/cell:opacity-100 absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all text-[10px] leading-none"
        title="Cell actions"
      >
        ⋮
      </button>
      <Popover anchorRef={btnRef} open={open} onClose={() => setOpen(false)} placement="bottom-end">
        <div className="px-3 py-1.5 border-b border-white/[0.06]">
          <span className="text-[10px] text-slate-500 font-mono truncate block max-w-[180px]">
            {field}: {formatValue(value).slice(0, 40)}
          </span>
        </div>
        <MenuItem
          label="Filter for value (==)"
          icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round"/></svg>}
          onClick={() => applyFilter("==")}
        />
        <MenuItem
          label="Filter out (!=)"
          icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round"/><path d="M2 14L14 2" strokeLinecap="round"/></svg>}
          onClick={() => applyFilter("!=")}
        />
        <div className="my-1 border-t border-white/[0.06]" />
        <MenuItem
          label="Copy value"
          icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><rect x="5" y="5" width="8" height="9" rx="1"/><path d="M3 11V3a1 1 0 011-1h6"/></svg>}
          onClick={copyValue}
        />
      </Popover>
    </>
  );
}
