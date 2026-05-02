export interface DQLRecord {
  [key: string]: unknown;
}

export interface DQLColumn {
  name: string;
  type: string;
}

export type DQLCommandName =
  | "fetch"
  | "data"
  | "filter"
  | "filterOut"
  | "search"
  | "fields"
  | "fieldsKeep"
  | "fieldsAdd"
  | "fieldsRemove"
  | "fieldsRename"
  | "summarize"
  | "makeTimeseries"
  | "sort"
  | "limit"
  | "dedup"
  | "parse"
  | "expand"
  | "flatten"
  | "fieldsFlatten"
  | "append"
  | "join"
  | "joinNested"
  | "lookup"
  | "describe"
  | "load"
  | "timeseries"
  | "metrics";

export interface PipelineStage {
  id: string;
  command: DQLCommandName;
  args: Record<string, unknown>;
  raw: string;
}

export interface DQLResult {
  columns: DQLColumn[];
  rows: DQLRecord[];
  recordCount: number;
  stage: PipelineStage;
}

export interface GamePhase {
  id: string;
  title: string;
  description: string;
  active: boolean;
  completed: boolean;
}

export type ScenarioTrack = "onboarding" | "dql" | "dpl" | "combined";
export type ScenarioTier = "free" | "premium";

export interface Scenario {
  id: string;
  title: string;
  company: string;
  briefing: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  steps: ScenarioStep[];
  /** Learning track this case belongs to. Defaults to "dql" for legacy scenarios. */
  track?: ScenarioTrack;
  /** Premium gating tier. Defaults to "premium" unless explicitly free. */
  tier?: ScenarioTier;
}

export interface ScenarioStep {
  id: string;
  title: string;
  narration: string;
  lesson: string;
  goal: string;
  hint: string;
  sampleData: DQLRecord[];
  expectedPipeline: PipelineStage[];
  /** Optional DPL pattern phase for "dpl" or "combined" track steps. */
  dpl?: {
    /** The raw input strings the player's pattern must parse. */
    inputs: string[];
    /** Reference DPL pattern that successfully parses the inputs. */
    expectedPattern: string;
    /** Field names the pattern is expected to extract. */
    expectedFields: string[];
  };
}

export type ViewMode = "cards" | "editor";
