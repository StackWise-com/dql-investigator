"use client";

import { useEffect, useRef, useCallback } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { parsePipeline } from "@/lib/dql/parser";

let monacoLoaded = false;
let monacoInstance: typeof import("monaco-editor") | null = null;

async function loadMonaco() {
  if (monacoInstance) return monacoInstance;
  if (typeof window === "undefined") return null;
  const monaco = await import("monaco-editor");
  monacoInstance = monaco;
  monacoLoaded = true;
  return monaco;
}

export function MonacoQueryEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);
  const editorValue = useInvestigatorStore((s) => s.editorValue);
  const setEditorValue = useInvestigatorStore((s) => s.setEditorValue);
  const setPipeline = useInvestigatorStore((s) => s.setPipeline);

  const handleRun = useCallback(() => {
    const parsed = parsePipeline(editorValue);
    setPipeline(parsed);
  }, [editorValue, setPipeline]);

  useEffect(() => {
    let disposed = false;

    loadMonaco().then((monaco) => {
      if (!monaco || !containerRef.current || disposed) return;

      monaco.editor.defineTheme("dql-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "22D3EE", fontStyle: "bold" },
          { token: "function", foreground: "34D399" },
          { token: "string", foreground: "FBBF24" },
          { token: "number", foreground: "A78BFA" },
          { token: "operator", foreground: "F472B6" },
          { token: "comment", foreground: "64748B", fontStyle: "italic" },
        ],
        colors: {
          "editor.background": "#0B1221",
          "editor.lineHighlightBackground": "#1E293B55",
          "editor.selectionBackground": "#22D3EE33",
          "editor.inactiveSelectionBackground": "#22D3EE22",
        },
      });

      const editor = monaco.editor.create(containerRef.current, {
        value: editorValue,
        language: "plaintext",
        theme: "dql-dark",
        fontSize: 13,
        fontFamily: "GeistMono, monospace",
        lineNumbers: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        roundedSelection: false,
        padding: { top: 12, bottom: 12 },
        overviewRulerLanes: 0,
        lineHeight: 22,
        automaticLayout: true,
        wordWrap: "on",
        suggest: { showKeywords: false },
      });

      editorRef.current = editor;

      editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        setEditorValue(value);
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        const parsed = parsePipeline(editor.getValue());
        setPipeline(parsed);
      });
    });

    return () => {
      disposed = true;
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== editorValue) {
      editor.setValue(editorValue);
    }
  }, [editorValue]);

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">DQL Editor</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25 border border-emerald-400/30 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
            Run
          </button>
          <span className="text-xs text-slate-600">Monaco</span>
        </div>
      </div>
      <div ref={containerRef} className="h-[140px] rounded-lg overflow-hidden border border-white/[0.08]" />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        <span>Supported: fetch, filter, fields, sort, limit, summarize, dedup, search, parse, expand</span>
        <span className="text-slate-500">Ctrl + Enter to run</span>
      </div>
    </div>
  );
}
