"use client";

import { useEffect, useRef } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";

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
        <span className="text-xs text-slate-600">Monaco</span>
      </div>
      <div ref={containerRef} className="h-[140px] rounded-lg overflow-hidden border border-white/[0.08]" />
      <div className="mt-2 text-xs text-slate-600">
        Supported: fetch, filter, fields, sort, limit, summarize, dedup, search, parse, expand
      </div>
    </div>
  );
}
