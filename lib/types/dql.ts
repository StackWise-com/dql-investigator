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

export interface Scenario {
  id: string;
  title: string;
  company: string;
  briefing: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  steps: ScenarioStep[];
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
}

export type ViewMode = "cards" | "editor";
