import { useScenarioStore } from "../../stores/scenarioStore";
import { CodexEntry } from "./CodexEntry";

interface Props {
  onBack: () => void;
}

// All commands from all scenarios (ordered by scenario difficulty)
const ALL_COMMANDS_ORDERED = [
  "fetch logs", "filter", "loglevel", "sort",
  "from:now()-Nd", "contains()", "fieldsAdd", "now()",
  "parse (DPL)", "DPL matchers", "INT:", "LD", "summarize", "by:{}",
  "fetch events", "event.type", "in()", "array()", "absolute timestamps",
  "filterOut", "dst_port", "matchesPhrase()", "matchesValue()", "endsWith()",
  "parse JSON:", "bracket notation", "if()", "fieldsAdd/Remove/Rename",
  "fetch dt.davis.problems", "fetch dt.davis.events", "expand",
  "countDistinct()", "event.status", "display_id",
  "lookup", "sourceField:", "lookupField:", "prefix:",
  "k8s.namespace.name", "k8s.pod.name",
  "multi-condition filter",
  "getHour()", "getDayOfWeek()", "getMonth()", "comparison operators", "boolean logic",
  "makeTimeseries", "countIf()", "interval:",
  "fetch→filter→summarize→sort pattern", "parse + summarize pipeline",
  "contains() for error patterns", "in() function recap",
  "absolute time forensics", "parse JSON: + bracket notation",
  "makeTimeseries for incident timelines", "full DQL incident pipeline",
];

export function CodexScreen({ onBack }: Props) {
  const { unlockedCommands, scenariosCompleted, totalXP } = useScenarioStore();

  const unlockedSet = new Set(unlockedCommands);
  const hasAny = unlockedCommands.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center gap-4 shrink-0">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-white font-bold">DQL Codex</h2>
          <p className="text-gray-500 text-xs">Earned by solving cases · Not visible during investigation</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-yellow-400 font-bold text-sm">{totalXP.toLocaleString()} XP</p>
          <p className="text-gray-600 text-xs">{scenariosCompleted.length}/10 cases solved</p>
        </div>
      </div>

      {!hasAny ? (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-gray-300 font-bold text-lg mb-2">Codex Locked</h3>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
              Solve your first case to unlock DQL command entries. You earn the knowledge — you don't start with it.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-500 text-sm mb-6">
              {unlockedCommands.length} commands unlocked · Solve more cases to reveal additional entries
            </p>

            {/* Unlocked section */}
            <div className="mb-8">
              <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
                Unlocked Commands
              </h3>
              <div className="flex flex-col gap-2">
                {ALL_COMMANDS_ORDERED.filter(cmd => unlockedSet.has(cmd)).map((cmd) => (
                  <CodexEntry key={cmd} command={cmd} />
                ))}
                {/* Any unlocked not in ordered list */}
                {unlockedCommands
                  .filter(cmd => !ALL_COMMANDS_ORDERED.includes(cmd))
                  .map((cmd) => (
                    <CodexEntry key={cmd} command={cmd} />
                  ))
                }
              </div>
            </div>

            {/* Locked section */}
            {ALL_COMMANDS_ORDERED.filter(cmd => !unlockedSet.has(cmd)).length > 0 && (
              <div>
                <h3 className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-3">
                  Locked — Solve More Cases
                </h3>
                <div className="flex flex-col gap-2">
                  {ALL_COMMANDS_ORDERED.filter(cmd => !unlockedSet.has(cmd)).map((cmd) => (
                    <div
                      key={cmd}
                      className="border border-gray-800 rounded-lg px-4 py-3 flex items-center gap-3 opacity-40"
                    >
                      <span className="text-gray-600 text-xs">🔒</span>
                      <span className="text-gray-600 text-xs font-mono">{cmd}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
