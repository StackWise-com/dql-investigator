import type { ValidationResult, MockData } from "./detective";

export interface ScenarioVariant {
  companyName: string;
  serviceName: string;
  hostName: string;
  processGroup: string;
  hostId: string;
  errorTimestamp: string;
  deploymentVersion: string;
  ipAddresses: string[];
  statusCodes: number[];
  errorMessages: string[];
  configKey: string;
  configValue: string;
  errorCounts: number[];
  // Extra variant-specific fields (optional)
  [key: string]: unknown;
}

export interface ScenarioStep {
  stepNumber: number;
  narration: string;           // template string with {{varName}} placeholders
  clue: string;                // narrative clue #1 — NO code
  secondClue: string;          // narrative clue #2 — still NO code
  finalClue: string;           // narrative clue #3 — near-giveaway, still narrative
  requiredConcepts: string[];
  validate: (query: string, variant: ScenarioVariant) => ValidationResult;
  mockRecordCount: number;     // particles shown BEFORE this step executes
  mockResultCount: number;     // particles surviving AFTER correct query
  mockResultData: (variant: ScenarioVariant) => MockData;
  baseXP: number;
  xpPerHint: number;
  storyExplanation: string;    // narrative shown AFTER solving (no code)
  dqlLesson: string;           // first + only time player sees DQL syntax for this concept
  commandsShown: string[];     // unlocked in codex after solving
}

export interface ScenarioV2 {
  id: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  stars: string;               // e.g. "★☆☆☆☆"
  title: string;
  company: string;             // template string
  briefing: string;            // template string
  steps: ScenarioStep[];
  variants: ScenarioVariant[];
  rootCause: string;           // template string — shown in post-mortem
  postMortem: string;          // full story after case closed
  commandsUnlocked: string[];  // all commands this scenario teaches
}

// Store state shape for v2
export interface ScenarioState {
  scenarios: ScenarioV2[];
  currentScenarioIndex: number;
  currentStepIndex: number;
  activeVariant: ScenarioVariant | null;

  cluesUsedThisStep: number;
  queryAttempts: number;
  lastValidation: ValidationResult | null;
  mockResult: MockData | null;
  stepStartTime: number | null;

  totalXP: number;
  noHintStreak: number;
  stepsCompleted: number[];      // encoded as scenarioIdx * 100 + stepIdx
  scenariosCompleted: number[];
  unlockedCommands: string[];    // persisted to localStorage for codex

  lastQuery: string;              // most recently submitted query (for auto-advance in advanceStep)

  // UI flags
  showClue: boolean;
  activeClueLevel: 1 | 2 | 3;
  showHintModal: boolean;
  showStoryCard: boolean;
  pendingStoryCard: boolean;      // story card waiting for animation to complete before showing
  showFloatingXP: boolean;
  floatingXPValue: number;
  showScenarioVictory: boolean;
  vortexCommand: string | null;  // "fetch" | "filter" | "parse" | "summarize" | etc.
  vortexFilterLevel: string | null; // e.g. "ERROR", "WARN" — extracted from loglevel == "X"
  showResultPanel: boolean;
  showSnitchHint: boolean;
  snitchHintMessage: string;
}

export interface ScenarioActions {
  startVortexMode: () => void;
  selectScenario: (index: number) => void;
  executeQuery: (query: string) => void;
  requestClue: () => void;      // shows HintModal
  confirmClue: () => void;      // pays XP cost, reveals clue
  dismissClue: () => void;
  advanceStep: () => void;
  dismissStoryCard: () => void;
  dismissFloatingXP: () => void;
  dismissScenarioVictory: () => void;
  vortexAnimationComplete: () => void;
  hideResultPanel: () => void;
  dismissSnitchHint: () => void;
}

export type ScenarioStore = ScenarioState & ScenarioActions;
