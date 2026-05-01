"use client";

import { useRef } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";

export function QueryEditor() {
  const editorValue = useInvestigatorStore((s) => s.editorValue);
  const setEditorValue = useInvestigatorStore((s) => s.setEditorValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTemplate = (template: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newValue = editorValue.slice(0, start) + template + editorValue.slice(end);
    setEditorValue(newValue);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + template.length;
    }, 0);
  };

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">DQL Query</span>
        <div className="flex gap-1">
          {[
            { label: "Fetch", tpl: "fetch logs\n| " },
            { label: "Filter", tpl: 'filter loglevel == "ERROR"\n| ' },
            { label: "Fields", tpl: "fields timestamp, loglevel, content\n| " },
            { label: "Sort", tpl: "sort timestamp desc\n| " },
            { label: "Limit", tpl: "limit 10" },
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => insertTemplate(t.tpl)}
              className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={editorValue}
        onChange={(e) => setEditorValue(e.target.value)}
        placeholder={`fetch logs, from: -24h
| filter loglevel == "ERROR"
| fields timestamp, log.source, content
| sort timestamp desc
| limit 10`}
        spellCheck={false}
        className="flex-1 min-h-[200px] bg-slate-900/80 border border-white/[0.08] rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400/40 resize-none leading-relaxed"
      />
      <div className="mt-2 text-[10px] text-slate-600">
        Supported: fetch, filter, fields, sort, limit, summarize, dedup, search, parse, expand
      </div>
    </div>
  );
}
