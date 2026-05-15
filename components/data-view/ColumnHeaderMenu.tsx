"use client";

import { useRef, useState } from "react";
import { Popover } from "@/components/ui/Popover";
import { MenuItem } from "@/components/ui/MenuItem";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import type { DQLColumn } from "@/lib/types/dql";

interface ColumnHeaderMenuProps {
  column: DQLColumn;
}

export function ColumnHeaderMenu({ column }: ColumnHeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const columnSort = useInvestigatorStore((s) => s.columnSort);
  const setColumnSort = useInvestigatorStore((s) => s.setColumnSort);
  const hiddenColumns = useInvestigatorStore((s) => s.hiddenColumns);
  const toggleHiddenColumn = useInvestigatorStore((s) => s.toggleHiddenColumn);
  const addStage = useInvestigatorStore((s) => s.addStage);
  const editorValue = useInvestigatorStore((s) => s.editorValue);
  const setEditorValue = useInvestigatorStore((s) => s.setEditorValue);

  const isActive = columnSort?.field === column.name;
  const isHidden = hiddenColumns.includes(column.name);

  const sortBy = (dir: "asc" | "desc") => {
    setColumnSort({ field: column.name, dir });
    setOpen(false);
  };

  const hide = () => {
    toggleHiddenColumn(column.name);
    setOpen(false);
  };

  const filterByField = () => {
    const condition = `${column.name} == ""`;
    const raw = `filter ${condition}`;
    addStage({ id: `stage-col-${Date.now()}`, command: "filter", args: { condition }, raw });
    const base = editorValue.trimEnd();
    setEditorValue(base ? `${base}\n| ${raw}` : `| ${raw}`);
    setOpen(false);
  };

  return (
    <span className="inline-flex items-center gap-1 group/header">
      <span className="text-[10px] font-medium text-slate-400">{column.name}</span>
      {column.type && (
        <span className="text-[9px] text-slate-600 font-normal">{column.type}</span>
      )}
      {isActive && (
        <span className="text-[9px] text-accent">{columnSort?.dir === "asc" ? "↑" : "↓"}</span>
      )}
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="opacity-0 group-hover/header:opacity-100 w-4 h-4 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-all text-[10px]"
        title="Column options"
      >
        ⌄
      </button>
      <Popover anchorRef={btnRef} open={open} onClose={() => setOpen(false)} placement="bottom-start">
        <div className="px-3 py-1.5 border-b border-white/[0.06]">
          <span className="text-[10px] font-medium text-slate-400">{column.name}</span>
          {column.type && <span className="text-[9px] text-slate-600 ml-1">{column.type}</span>}
        </div>
        <MenuItem
          label="Sort ascending"
          icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M4 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          onClick={() => sortBy("asc")}
        />
        <MenuItem
          label="Sort descending"
          icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          onClick={() => sortBy("desc")}
        />
        {isActive && (
          <MenuItem
            label="Clear sort"
            icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/></svg>}
            onClick={() => { setColumnSort(null); setOpen(false); }}
          />
        )}
        <div className="my-1 border-t border-white/[0.06]" />
        <MenuItem
          label="Filter by this field…"
          icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round"/></svg>}
          onClick={filterByField}
        />
        <div className="my-1 border-t border-white/[0.06]" />
        <MenuItem
          label={isHidden ? "Show column" : "Hide column"}
          icon={isHidden
            ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
            : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/><path d="M2 14L14 2" strokeLinecap="round"/></svg>
          }
          onClick={hide}
        />
      </Popover>
    </span>
  );
}
