import { useState } from "react";
import { ALL_SCENARIOS } from "../../data/scenariosV2/index";

interface Props {
  command: string;
}

// Build a lookup map: command → step dqlLesson content
function buildLessons(): Map<string, { lesson: string; scenario: string }> {
  const map = new Map<string, { lesson: string; scenario: string }>();
  for (const scenario of ALL_SCENARIOS) {
    for (const step of scenario.steps) {
      for (const cmd of step.commandsShown) {
        if (!map.has(cmd)) {
          map.set(cmd, { lesson: step.dqlLesson, scenario: scenario.title });
        }
      }
    }
  }
  return map;
}

const LESSONS = buildLessons();

export function CodexEntry({ command }: Props) {
  const [open, setOpen] = useState(false);
  const entry = LESSONS.get(command);

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors cursor-pointer ${
        open ? "border-cyan-700/60 bg-gray-900" : "border-gray-700/50 bg-gray-900/40 hover:border-gray-600"
      }`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 text-xs font-mono font-bold">{command}</span>
          {entry && (
            <span className="text-gray-600 text-xs">from: {entry.scenario}</span>
          )}
        </div>
        <span className="text-gray-600 text-xs">{open ? "▲" : "▼"}</span>
      </div>
      {open && entry && (
        <div className="border-t border-gray-700/40">
          <pre className="text-xs font-mono text-cyan-200 p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap bg-gray-950/60">
            {entry.lesson}
          </pre>
        </div>
      )}
      {open && !entry && (
        <div className="border-t border-gray-700/40 px-4 py-3">
          <p className="text-gray-500 text-xs">Solve scenarios to reveal this entry's details.</p>
        </div>
      )}
    </div>
  );
}
