export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG" | "CRITICAL";

export interface HintLevel {
  level: number;
  text: string;
  pattern: string;
}

export interface LogData {
  id: string;
  timestamp: string;
  service: string;
  level: LogLevel;
  message: string;
  isAnswer?: boolean;
  // Generic fields
  userId?: string;
  endpoint?: string;
  duration?: string;
  statusCode?: number;
  // Case 2
  host?: string;
  queryTime?: number;
  // Case 3
  transactionId?: string;
  amount?: number;
  responseCode?: string;
}

export interface CaseData {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  narrative: string;
  initialLogs: number;
  hints: HintLevel[];
  concepts: string[];
  logs: LogData[];
  solution: {
    query: string;
    victoryMessage: string;
  };
}

export interface GameState {
  currentCaseId: string;
  currentCaseData: CaseData | null;
  casesCompleted: string[];
  totalScore: number;
  logs: LogData[];
  logsDisplayed: LogData[];
  summarizeResult: Record<string, unknown>[] | null;
  queryHistory: string[];
  currentQuery: string;
  isGameRunning: boolean;
  showVictoryScreen: boolean;
  showDebugPanel: boolean;
  currentHintIndex: number;
  hintsUsedThisCase: number;
  cameraPosition: [number, number, number];
  logRotation: [number, number, number];
}

// ---- DQL Query Types ----

export interface FilterCondition {
  field: string;
  operator: "==" | "!=" | "IN" | ">=" | "<=" | ">" | "<" | "contains" | "startsWith" | "endsWith";
  value: string | string[] | number;
}

export interface FetchStep { type: "fetch" }

export interface FilterStep {
  type: "filter" | "filterOut";
  logicOp: "and" | "or" | null;
  conditions: FilterCondition[];
}

export interface FieldsAddStep {
  type: "fieldsAdd";
  fieldName: string;
  expression: string;
}

export interface AggregationDef {
  alias: string;
  func: "count" | "countIf" | "avg" | "sum" | "min" | "max" | "median";
  arg?: string;
}

export interface SummarizeStep {
  type: "summarize";
  aggregations: AggregationDef[];
  groupBy: string[];
}

export interface SortStep {
  type: "sort";
  field: string;
  dir: "asc" | "desc";
}

export interface LimitStep {
  type: "limit";
  count: number;
}

export type QueryStep =
  | FetchStep
  | FilterStep
  | FieldsAddStep
  | SummarizeStep
  | SortStep
  | LimitStep;

export interface Query {
  steps: QueryStep[];
  isValid: boolean;
  error?: string;
}
