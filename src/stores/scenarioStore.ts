import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScenarioStore, ScenarioState } from "../types/scenario";
import { ALL_SCENARIOS } from "../data/scenariosV2/index";
import { pickVariant } from "../utils/randomize";

// ── XP calculator ─────────────────────────────────────────────────────────────

function calcXP(
  baseXP: number,
  cluesUsed: number,
  elapsedSeconds: number,
  isFirstTry: boolean,
  noHintStreak: number
): number {
  const multipliers = [1.0, 0.75, 0.5, 0.25];
  const mult = multipliers[Math.min(cluesUsed, multipliers.length - 1)];
  let xp = Math.round(baseXP * mult);
  if (isFirstTry && cluesUsed === 0) xp += 20;
  if (elapsedSeconds < 30) xp += 30;
  if (noHintStreak >= 3 && cluesUsed === 0) xp += 50;
  return Math.max(xp, 10);
}

// ── localStorage key for codex unlocks ───────────────────────────────────────

const CODEX_KEY = "dql-detective-codex";

function loadCodex(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CODEX_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveCodex(commands: string[]): void {
  try {
    localStorage.setItem(CODEX_KEY, JSON.stringify(commands));
  } catch {
    // ignore
  }
}

// ── Parse command from query to determine vortex animation ───────────────────

function detectVortexInfo(query: string): { cmd: string | null; filterLevel: string | null } {
  const q = query.toLowerCase().trim();

  // Extract loglevel == "LEVEL" from filter clauses
  let filterLevel: string | null = null;
  const lvlMatch = q.match(/loglevel\s*==\s*["'](\w+)["']/);
  if (lvlMatch) filterLevel = lvlMatch[1].toUpperCase();

  // Parse pipes in reverse — last non-fetch command wins for animation
  const pipes = q.split("|").map((s) => s.trim());
  for (const pipe of [...pipes].reverse()) {
    if (pipe.startsWith("filter ") || pipe.startsWith("filterout ")) return { cmd: "filter", filterLevel };
    if (pipe.startsWith("parse "))          return { cmd: "parse", filterLevel };
    if (pipe.startsWith("summarize "))      return { cmd: "summarize", filterLevel };
    if (pipe.startsWith("maketimeseries ")) return { cmd: "makeTimeseries", filterLevel };
    if (pipe.startsWith("sort "))           return { cmd: "sort", filterLevel };
    if (pipe.startsWith("limit "))          return { cmd: "limit", filterLevel };
    if (pipe.startsWith("expand "))         return { cmd: "expand", filterLevel };
    if (pipe.startsWith("fieldsadd "))      return { cmd: "fieldsAdd", filterLevel };
    if (pipe.startsWith("fieldsremove "))   return { cmd: "fieldsRemove", filterLevel };
    if (pipe.startsWith("lookup ") || pipe.startsWith("join ")) return { cmd: "join", filterLevel };
  }
  // Fallback: plain fetch (no non-fetch pipes)
  if (q.startsWith("fetch")) return { cmd: "fetch", filterLevel };
  return { cmd: null, filterLevel };
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL: ScenarioState = {
  scenarios: [],
  currentScenarioIndex: 0,
  currentStepIndex: 0,
  activeVariant: null,
  cluesUsedThisStep: 0,
  queryAttempts: 0,
  lastValidation: null,
  mockResult: null,
  stepStartTime: null,
  totalXP: 0,
  noHintStreak: 0,
  stepsCompleted: [],
  scenariosCompleted: [],
  unlockedCommands: loadCodex(),
  lastQuery: "",
  showClue: false,
  activeClueLevel: 1,
  showHintModal: false,
  showStoryCard: false,
  pendingStoryCard: false,
  showFloatingXP: false,
  floatingXPValue: 0,
  showScenarioVictory: false,
  vortexCommand: null,
  vortexFilterLevel: null,
  showResultPanel: false,
  showSnitchHint: false,
  snitchHintMessage: "",
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useScenarioStore = create<ScenarioStore>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      unlockedCommands: loadCodex(),

      startVortexMode() {
        set({
          ...INITIAL,
          scenarios: ALL_SCENARIOS,
          unlockedCommands: loadCodex(),
        });
      },

      selectScenario(index: number) {
        const { scenarios } = get();
        const scenario = scenarios[index];
        if (!scenario) return;
        const variant = pickVariant(scenario);
        set({
          currentScenarioIndex: index,
          currentStepIndex: 0,
          activeVariant: variant,
          cluesUsedThisStep: 0,
          queryAttempts: 0,
          lastValidation: null,
          mockResult: null,
          stepStartTime: Date.now(),
          showClue: false,
          activeClueLevel: 1,
          showHintModal: false,
          showStoryCard: false,
          pendingStoryCard: false,
          showFloatingXP: false,
          showScenarioVictory: false,
          vortexCommand: null,
          vortexFilterLevel: null,
          lastQuery: "",
          showResultPanel: false,
          showSnitchHint: false,
          snitchHintMessage: "",
        });
      },

      executeQuery(query: string) {
        const {
          scenarios, currentScenarioIndex, currentStepIndex,
          activeVariant, cluesUsedThisStep, queryAttempts,
          stepStartTime, totalXP, noHintStreak,
          stepsCompleted, unlockedCommands,
        } = get();

        const scenario = scenarios[currentScenarioIndex];
        if (!scenario || !activeVariant) return;
        const step = scenario.steps[currentStepIndex];
        if (!step) return;

        const result = step.validate(query, activeVariant);
        const newAttempts = queryAttempts + 1;
        const { cmd: vortexCmd, filterLevel } = detectVortexInfo(query);

        if (!result.valid) {
          set({ lastValidation: result, queryAttempts: newAttempts, vortexCommand: vortexCmd, vortexFilterLevel: filterLevel, lastQuery: query });
          return;
        }

        // Step solved
        const elapsed = stepStartTime ? Math.floor((Date.now() - stepStartTime) / 1000) : 999;
        const isFirstTry = queryAttempts === 0;
        const xp = calcXP(step.baseXP, cluesUsedThisStep, elapsed, isFirstTry, noHintStreak);
        const mockResult = step.mockResultData(activeVariant);

        const stepKey = currentScenarioIndex * 100 + currentStepIndex;
        const newStepsCompleted = [...new Set([...stepsCompleted, stepKey])];

        // Unlock commands for codex
        const newCommands = [...new Set([...unlockedCommands, ...step.commandsShown])];
        saveCodex(newCommands);

        const alreadySeen = stepsCompleted.includes(stepKey);
        const showSnitch = !alreadySeen && vortexCmd === "filter" && filterLevel !== null;
        const snitchMsg = showSnitch
          ? `You've isolated ${step.mockResultCount.toLocaleString()} ${filterLevel!.toLowerCase()} log entries. The noise has cleared — something specific is emerging. Keep digging.`
          : "";

        set({
          lastValidation: result,
          queryAttempts: newAttempts,
          mockResult,
          totalXP: totalXP + xp,
          floatingXPValue: xp,
          showFloatingXP: true,
          pendingStoryCard: true,   // show card only after animation completes
          showStoryCard: false,
          stepsCompleted: newStepsCompleted,
          unlockedCommands: newCommands,
          vortexCommand: vortexCmd,
          vortexFilterLevel: filterLevel,
          lastQuery: query,
          showClue: false,
          showResultPanel: true,
          showSnitchHint: showSnitch,
          snitchHintMessage: snitchMsg,
        });
      },

      requestClue() {
        set({ showHintModal: true });
      },

      confirmClue() {
        const { scenarios, currentScenarioIndex, currentStepIndex, activeVariant, cluesUsedThisStep } = get();
        const scenario = scenarios[currentScenarioIndex];
        if (!scenario || !activeVariant) return;
        const step = scenario.steps[currentStepIndex];
        if (!step) return;

        // Cycle through 3 clue levels
        const nextLevel = (cluesUsedThisStep + 1) as 1 | 2 | 3;
        const newCluesUsed = Math.min(cluesUsedThisStep + 1, 3);

        set({
          cluesUsedThisStep: newCluesUsed,
          activeClueLevel: nextLevel,
          showClue: true,
          showHintModal: false,
        });
      },

      dismissClue() {
        set({ showClue: false });
      },

      advanceStep() {
        const {
          scenarios, currentScenarioIndex, currentStepIndex,
          noHintStreak, cluesUsedThisStep, scenariosCompleted,
          lastQuery, totalXP, unlockedCommands, stepsCompleted,
          activeVariant,
        } = get();
        const scenario = scenarios[currentScenarioIndex];
        if (!scenario) return;

        const variant = activeVariant ?? scenario.variants[0];
        const newStreak = cluesUsedThisStep === 0 ? noHintStreak + 1 : 0;

        // Cascade-skip any subsequent steps the last query already satisfies
        let nextIdx = currentStepIndex + 1;
        let bonusXP = 0;
        let newUnlocked = [...unlockedCommands];
        let newStepsCompleted = [...stepsCompleted];

        while (nextIdx < scenario.steps.length) {
          const step = scenario.steps[nextIdx];
          const result = step.validate(lastQuery, variant);
          if (result.valid) {
            bonusXP += step.baseXP;
            newUnlocked = [...new Set([...newUnlocked, ...step.commandsShown])];
            newStepsCompleted = [...new Set([...newStepsCompleted,
              currentScenarioIndex * 100 + nextIdx])];
            nextIdx++;
          } else {
            break;
          }
        }

        if (bonusXP > 0) saveCodex(newUnlocked);

        if (nextIdx >= scenario.steps.length) {
          const newCompleted = [...new Set([...scenariosCompleted, currentScenarioIndex])];
          set({
            scenariosCompleted: newCompleted,
            showScenarioVictory: true,
            showStoryCard: false,
            pendingStoryCard: false,
            totalXP: totalXP + bonusXP,
            unlockedCommands: newUnlocked,
            stepsCompleted: newStepsCompleted,
            noHintStreak: newStreak,
          });
          return;
        }

        set({
          currentStepIndex: nextIdx,
          totalXP: totalXP + bonusXP,
          unlockedCommands: newUnlocked,
          stepsCompleted: newStepsCompleted,
          cluesUsedThisStep: 0,
          queryAttempts: 0,
          lastValidation: null,
          mockResult: null,
          stepStartTime: Date.now(),
          showStoryCard: false,
          pendingStoryCard: false,
          showClue: false,
          activeClueLevel: 1,
          showFloatingXP: false,
          vortexCommand: null,
          vortexFilterLevel: null,
          noHintStreak: newStreak,
          showResultPanel: false,
          showSnitchHint: false,
          snitchHintMessage: "",
        });
      },

      dismissStoryCard() {
        set({ showStoryCard: false });
      },

      dismissFloatingXP() {
        set({ showFloatingXP: false });
      },

      dismissScenarioVictory() {
        set({ showScenarioVictory: false });
      },

      vortexAnimationComplete() {
        const { pendingStoryCard } = get();
        set({
          vortexCommand: null,
          showStoryCard: pendingStoryCard,
          pendingStoryCard: false,
        });
      },

      hideResultPanel() {
        set({ showResultPanel: false });
      },

      dismissSnitchHint() {
        set({ showSnitchHint: false });
      },
    }),
    {
      name: "dql-detective-v2",
      // Only persist progress, not transient UI state
      partialize: (state) => ({
        totalXP: state.totalXP,
        stepsCompleted: state.stepsCompleted,
        scenariosCompleted: state.scenariosCompleted,
        unlockedCommands: state.unlockedCommands,
        noHintStreak: state.noHintStreak,
      }),
    }
  )
);

// ── Selectors ─────────────────────────────────────────────────────────────────

export function getRank(totalXP: number): { title: string; badge: string } {
  if (totalXP >= 4500) return { title: "Chief of Observability", badge: "👑" };
  if (totalXP >= 3000) return { title: "Principal Investigator", badge: "💎" };
  if (totalXP >= 2000) return { title: "Staff Detective", badge: "🔴" };
  if (totalXP >= 1200) return { title: "Senior SRE", badge: "🟠" };
  if (totalXP >= 700)  return { title: "Platform Engineer", badge: "🟣" };
  if (totalXP >= 300)  return { title: "Incident Responder", badge: "🔵" };
  return { title: "Intern Analyst", badge: "🟢" };
}

export function getClueText(
  clueLevel: 1 | 2 | 3,
  step: { clue: string; secondClue: string; finalClue: string }
): string {
  if (clueLevel === 1) return step.clue;
  if (clueLevel === 2) return step.secondClue;
  return step.finalClue;
}
