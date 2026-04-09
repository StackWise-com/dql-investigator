import { useEffect, useState } from "react";
import { VortexMode } from "./components/VortexMode/VortexMode";
import { CodexScreen } from "./components/Codex/CodexScreen";
import { useScenarioStore } from "./stores/scenarioStore";
import { getRank } from "./stores/scenarioStore";

type AppMode = "vortex" | "codex";

function App() {
  const [appMode, setAppMode] = useState<AppMode>("vortex");
  const { startVortexMode, totalXP, unlockedCommands } = useScenarioStore();

  useEffect(() => {
    startVortexMode();
  }, []);

  const rank = getRank(totalXP);

  return (
    <div className="w-full h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between shrink-0 gap-4">
        <div className="shrink-0">
          <h1 className="text-lg font-bold tracking-wide leading-none">DQL Detective</h1>
          <p className="text-gray-500 text-xs">Dynatrace Query Language</p>
        </div>

        {/* Mode buttons */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setAppMode("vortex")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              appMode === "vortex"
                ? "bg-cyan-900 border-cyan-600 text-cyan-200"
                : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-400"
            }`}
          >
            🌀 Vortex
          </button>
          <button
            onClick={() => setAppMode("codex")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              appMode === "codex"
                ? "bg-gray-700 border-gray-500 text-gray-200"
                : unlockedCommands.length > 0
                  ? "bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300"
                  : "bg-gray-900 border-gray-800 text-gray-700 cursor-default"
            }`}
            title={unlockedCommands.length === 0 ? "Solve a case to unlock the Codex" : "DQL Reference — earned by solving cases"}
          >
            📖 Codex{unlockedCommands.length > 0 && <span className="ml-1 text-cyan-400">{unlockedCommands.length}</span>}
          </button>
        </div>

        {/* Rank + XP */}
        <div className="shrink-0 text-right">
          <p className="text-cyan-400 font-bold text-sm">{totalXP.toLocaleString()} XP</p>
          <p className="text-gray-500 text-xs">{rank.badge} {rank.title}</p>
        </div>
      </header>

      {/* ── Vortex Mode ── */}
      {appMode === "vortex" && (
        <VortexMode onBackToMenu={() => setAppMode("vortex")} />
      )}

      {/* ── Codex ── */}
      {appMode === "codex" && (
        <CodexScreen onBack={() => setAppMode("vortex")} />
      )}
    </div>
  );
}

export default App;
