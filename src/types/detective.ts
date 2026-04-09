export interface ValidationResult {
  valid: boolean;
  partial: boolean;
  feedback: string;
}

export interface IntelCard {
  title: string;
  content: string;
  syntax: string;
}

export interface SchemaField {
  field: string;
  type: string;
}

export interface MockCell {
  value: string;
  style?: "highlight" | "error" | "warn";
}

export interface MockData {
  headers: string[];
  rows: MockCell[][];
}

export interface DetectiveCase {
  id: string;
  phase: number;
  title: string;
  narrator: string;
  objective: string;
  evidence: string;
  baseXP: number;
  xpPenaltyPerHint: number;
  minXP: number;
  hints: string[];
  solutionQuery: string;
  validate: (query: string) => ValidationResult;
  mockData: MockData;
  intelCards: IntelCard[];
  schema: SchemaField[];
  commandsTaught: string[];
}

export interface DetectiveState {
  phases: DetectiveCase[];
  currentPhaseIndex: number;
  phasesCompleted: number[];
  collectedEvidence: string[];
  hintsRevealedThisPhase: number;
  queryAttempts: number;
  lastValidation: ValidationResult | null;
  mockResult: MockData | null;
  phaseStartTime: number | null;
  totalXP: number;
  noHintStreak: number;
  showFloatingXP: boolean;
  floatingXPValue: number;
  solutionRevealed: boolean;
  showFinalVictory: boolean;
}

export interface DetectiveActions {
  startDetectiveMode: () => void;
  executeDetectiveQuery: (query: string) => void;
  revealNextHint: () => void;
  revealSolution: () => void;
  advancePhase: () => void;
  resetCurrentPhase: () => void;
  dismissFloatingXP: () => void;
}

export type DetectiveStore = DetectiveState & DetectiveActions;
