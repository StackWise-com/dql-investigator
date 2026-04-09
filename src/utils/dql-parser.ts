import type {
  Query,
  QueryStep,
  FilterCondition,
  FilterStep,
  FieldsAddStep,
  SummarizeStep,
  SortStep,
  LimitStep,
  AggregationDef,
  LogData,
} from "../types/game";

// Fields that MUST be accessed with the log. prefix in DQL
const LOG_NAMESPACED = new Set(["level", "service", "message", "source", "status"]);

function validateField(field: string): string | null {
  const bare = field.startsWith("log.") ? null : field.split(".")[0];
  if (bare && LOG_NAMESPACED.has(bare)) {
    return `Use "log.${bare}" instead of "${bare}" — log attributes require the log. prefix`;
  }
  return null;
}

// ---- Public API ----

export function parseQuery(input: string): Query {
  const trimmed = input.trim();
  if (!trimmed.startsWith("fetch logs")) {
    return { steps: [], isValid: false, error: 'Queries must start with "fetch logs"' };
  }

  // Normalize whitespace, then split on pipe
  const normalized = trimmed.replace(/[ \t]+/g, " ");
  const parts = normalized.split(/\s*\|\s*/).map((p) => p.trim());
  const steps: QueryStep[] = [];

  for (const part of parts) {
    if (part === "fetch logs" || part.startsWith("fetch logs,")) {
      steps.push({ type: "fetch" });
      continue;
    }

    if (part.startsWith("filter ")) {
      const step = parseFilterStep(part.slice(7).trim(), "filter");
      if (!step) return { steps: [], isValid: false, error: `Invalid filter syntax: "${part}"` };
      steps.push(step);
      continue;
    }

    if (part.startsWith("filterOut ")) {
      const step = parseFilterStep(part.slice(10).trim(), "filterOut");
      if (!step) return { steps: [], isValid: false, error: `Invalid filterOut syntax: "${part}"` };
      steps.push(step);
      continue;
    }

    if (part.startsWith("fieldsAdd ")) {
      const step = parseFieldsAddStep(part.slice(10).trim());
      if (!step) return { steps: [], isValid: false, error: `Invalid fieldsAdd syntax: "${part}"` };
      steps.push(step);
      continue;
    }

    if (part.startsWith("summarize ")) {
      const step = parseSummarizeStep(part.slice(10).trim());
      if (!step) return { steps: [], isValid: false, error: `Invalid summarize syntax: "${part}"` };
      steps.push(step);
      continue;
    }

    if (part.startsWith("sort ")) {
      const step = parseSortStep(part.slice(5).trim());
      if (!step) return { steps: [], isValid: false, error: `Invalid sort syntax: "${part}"` };
      steps.push(step);
      continue;
    }

    if (part.startsWith("limit ")) {
      const n = parseInt(part.slice(6).trim(), 10);
      if (isNaN(n)) return { steps: [], isValid: false, error: "Invalid limit value" };
      steps.push({ type: "limit", count: n } as LimitStep);
      continue;
    }

    return {
      steps: [],
      isValid: false,
      error: `Unknown command: "${part.split(" ")[0]}"`,
    };
  }

  // Validate field naming conventions
  for (const step of steps) {
    if (step.type === "filter" || step.type === "filterOut") {
      for (const cond of step.conditions) {
        const err = validateField(cond.field);
        if (err) return { steps: [], isValid: false, error: err };
      }
    }
  }

  return { steps, isValid: true };
}

export type ExecuteResult =
  | { type: "logs"; data: LogData[] }
  | { type: "summary"; data: Record<string, unknown>[]; preSummaryLogs: LogData[] };

export function executeQuery(logs: LogData[], query: Query): ExecuteResult {
  if (!query.isValid) return { type: "logs", data: logs };

  // Use a mutable "enriched" layer so fieldsAdd can add dynamic fields
  let current: Record<string, unknown>[] = logs.map((l) => l as unknown as Record<string, unknown>);

  for (const step of query.steps) {
    if (step.type === "fetch") continue;

    if (step.type === "filter" || step.type === "filterOut") {
      current = applyFilter(current, step);
      continue;
    }

    if (step.type === "fieldsAdd") {
      current = applyFieldsAdd(current, step);
      continue;
    }

    if (step.type === "summarize") {
      const preSummaryLogs = current as unknown as LogData[];
      const summaryData = applySummarize(current, step);
      return { type: "summary", data: summaryData, preSummaryLogs };
    }

    if (step.type === "sort") {
      current = applyGenericSort(current, step);
      continue;
    }

    if (step.type === "limit") {
      current = current.slice(0, step.count);
      continue;
    }
  }

  return { type: "logs", data: current as unknown as LogData[] };
}

// ---- Filter parsing ----

function parseFilterStep(expr: string, type: "filter" | "filterOut"): FilterStep | null {
  // Try "or" split first (lower precedence than "and")
  const orParts = splitOnLogicalOp(expr, " or ");
  if (orParts.length > 1) {
    const conditions = orParts.map(parseSimpleCondition);
    if (conditions.some((c) => c === null)) return null;
    return { type, logicOp: "or", conditions: conditions as FilterCondition[] };
  }

  const andParts = splitOnLogicalOp(expr, " and ");
  if (andParts.length > 1) {
    const conditions = andParts.map(parseSimpleCondition);
    if (conditions.some((c) => c === null)) return null;
    return { type, logicOp: "and", conditions: conditions as FilterCondition[] };
  }

  const cond = parseSimpleCondition(expr);
  if (!cond) return null;
  return { type, logicOp: null, conditions: [cond] };
}

/** Split on a logical operator token, respecting quotes and parens. */
function splitOnLogicalOp(expr: string, op: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let inQuote = false;
  let start = 0;
  const opLen = op.length;

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '"') inQuote = !inQuote;
    if (!inQuote) {
      if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") depth--;
      else if (depth === 0 && expr.slice(i).toLowerCase().startsWith(op.toLowerCase())) {
        results.push(expr.slice(start, i).trim());
        start = i + opLen;
        i += opLen - 1;
      }
    }
  }
  results.push(expr.slice(start).trim());
  return results.filter((p) => p.length > 0);
}

function parseSimpleCondition(expr: string): FilterCondition | null {
  expr = expr.trim();

  // contains(field, "value")
  const containsM = expr.match(/^contains\(([\w.]+),\s*"([^"]*)"\)$/i);
  if (containsM) return { field: containsM[1], operator: "contains", value: containsM[2] };

  // startsWith(field, "value")
  const swM = expr.match(/^startsWith\(([\w.]+),\s*"([^"]*)"\)$/i);
  if (swM) return { field: swM[1], operator: "startsWith", value: swM[2] };

  // endsWith(field, "value")
  const ewM = expr.match(/^endsWith\(([\w.]+),\s*"([^"]*)"\)$/i);
  if (ewM) return { field: ewM[1], operator: "endsWith", value: ewM[2] };

  // IN operator: field IN ["v1", "v2"]
  const inM = expr.match(/^([\w.]+)\s+IN\s+\[([^\]]+)\]$/i);
  if (inM) {
    const values = inM[2].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return { field: inM[1], operator: "IN", value: values };
  }

  // String comparison: field op "value"  (handles ==, !=, >=, <=, >, <)
  const strM = expr.match(/^([\w.]+)\s*(==|!=|>=|<=|>|<)\s*"([^"]*)"$/);
  if (strM) {
    return {
      field: strM[1],
      operator: strM[2] as FilterCondition["operator"],
      value: strM[3],
    };
  }

  // Numeric comparison: field op number
  const numM = expr.match(/^([\w.]+)\s*(==|!=|>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/);
  if (numM) {
    return {
      field: numM[1],
      operator: numM[2] as FilterCondition["operator"],
      value: parseFloat(numM[3]),
    };
  }

  return null;
}

// ---- fieldsAdd parsing ----

function parseFieldsAddStep(expr: string): FieldsAddStep | null {
  const m = expr.match(/^(\w+)\s*=\s*(.+)$/);
  if (!m) return null;
  return { type: "fieldsAdd", fieldName: m[1], expression: m[2].trim() };
}

// ---- summarize parsing ----

function parseSummarizeStep(expr: string): SummarizeStep | null {
  // Extract by:{field1, field2} at the end
  const byM = expr.match(/,\s*by:\{([^}]+)\}\s*$/);
  let groupBy: string[] = [];
  let aggPart = expr;

  if (byM) {
    groupBy = byM[1].split(",").map((s) => s.trim());
    aggPart = expr.slice(0, byM.index!).trim();
  }

  const aggregations = parseAggList(aggPart);
  if (aggregations.length === 0) return null;

  return { type: "summarize", aggregations, groupBy };
}

function parseAggList(expr: string): AggregationDef[] {
  const parts = splitTopLevelCommas(expr);
  const result: AggregationDef[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // alias = func(...)
    const assignM = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignM) {
      const fn = parseAggFunc(assignM[2].trim());
      if (fn) result.push({ alias: assignM[1], ...fn });
    } else {
      const fn = parseAggFunc(trimmed);
      if (fn) result.push({ alias: fn.func, ...fn });
    }
  }
  return result;
}

function splitTopLevelCommas(expr: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "(" || ch === "{" || ch === "[") depth++;
    else if (ch === ")" || ch === "}" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(expr.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(expr.slice(start));
  return parts;
}

function parseAggFunc(expr: string): { func: AggregationDef["func"]; arg?: string } | null {
  expr = expr.trim();
  if (expr === "count()") return { func: "count" };

  const countIfM = expr.match(/^countIf\((.+)\)$/i);
  if (countIfM) return { func: "countIf", arg: countIfM[1].trim() };

  const namedM = expr.match(/^(avg|sum|min|max|median)\((\w+)\)$/i);
  if (namedM) {
    return {
      func: namedM[1].toLowerCase() as AggregationDef["func"],
      arg: namedM[2],
    };
  }
  return null;
}

// ---- sort parsing ----

function parseSortStep(expr: string): SortStep | null {
  const parts = expr.trim().split(/\s+/);
  if (!parts[0]) return null;
  const dir = parts[1]?.toLowerCase() === "asc" ? "asc" : "desc";
  return { type: "sort", field: parts[0], dir };
}

// ---- Execution helpers ----

function getFieldValue(obj: Record<string, unknown>, path: string): unknown {
  const normalized = path.startsWith("log.") ? path.slice(4) : path;
  return normalized
    .split(".")
    .reduce(
      (cur: unknown, prop: string) =>
        cur != null ? (cur as Record<string, unknown>)[prop] : undefined,
      obj as unknown
    );
}

function evaluateCondition(log: Record<string, unknown>, cond: FilterCondition): boolean {
  const v = getFieldValue(log, cond.field);

  switch (cond.operator) {
    case "==":
      return String(v) === String(cond.value);
    case "!=":
      return String(v) !== String(cond.value);
    case ">":
      return typeof cond.value === "number" ? Number(v) > cond.value : String(v) > String(cond.value);
    case ">=":
      return typeof cond.value === "number" ? Number(v) >= cond.value : String(v) >= String(cond.value);
    case "<":
      return typeof cond.value === "number" ? Number(v) < cond.value : String(v) < String(cond.value);
    case "<=":
      return typeof cond.value === "number" ? Number(v) <= cond.value : String(v) <= String(cond.value);
    case "IN": {
      const vals = Array.isArray(cond.value) ? cond.value : [String(cond.value)];
      return vals.includes(String(v));
    }
    case "contains":
      return String(v).includes(String(cond.value));
    case "startsWith":
      return String(v).startsWith(String(cond.value));
    case "endsWith":
      return String(v).endsWith(String(cond.value));
    default:
      return false;
  }
}

function applyFilter(data: Record<string, unknown>[], step: FilterStep): Record<string, unknown>[] {
  const invert = step.type === "filterOut";
  return data.filter((log) => {
    const match =
      step.logicOp === "or"
        ? step.conditions.some((c) => evaluateCondition(log, c))
        : step.conditions.every((c) => evaluateCondition(log, c));
    return invert ? !match : match;
  });
}

function applyFieldsAdd(
  data: Record<string, unknown>[],
  step: FieldsAddStep
): Record<string, unknown>[] {
  return data.map((log) => ({
    ...log,
    [step.fieldName]: evaluateExpression(log, step.expression),
  }));
}

function evaluateExpression(log: Record<string, unknown>, expr: string): unknown {
  // formatTimestamp(field, format:"FMT")
  const fmtM = expr.match(/^formatTimestamp\(([\w.]+),\s*format:"([^"]+)"\)$/i);
  if (fmtM) {
    const val = getFieldValue(log, fmtM[1]);
    if (typeof val === "string") return formatTs(val, fmtM[2]);
    return null;
  }
  // getHour(field)
  const hourM = expr.match(/^getHour\(([\w.]+)\)$/i);
  if (hourM) {
    const val = getFieldValue(log, hourM[1]);
    if (typeof val === "string") return new Date(val).getUTCHours();
    return null;
  }
  return getFieldValue(log, expr);
}

function formatTs(ts: string, fmt: string): string {
  const d = new Date(ts);
  if (fmt === "HH") return String(d.getUTCHours()).padStart(2, "0");
  if (fmt === "EE") return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  if (fmt === "yyyy-MM-dd") return ts.slice(0, 10);
  return ts;
}

function applySummarize(
  data: Record<string, unknown>[],
  step: SummarizeStep
): Record<string, unknown>[] {
  const groups = new Map<string, Record<string, unknown>[]>();

  for (const log of data) {
    const key =
      step.groupBy.length > 0
        ? step.groupBy.map((f) => String(getFieldValue(log, f) ?? "")).join("\x00")
        : "__all__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  const result: Record<string, unknown>[] = [];

  for (const [key, groupLogs] of groups) {
    const row: Record<string, unknown> = {};
    if (step.groupBy.length > 0) {
      const parts = key.split("\x00");
      step.groupBy.forEach((f, i) => { row[f] = parts[i]; });
    }
    for (const agg of step.aggregations) {
      row[agg.alias] = computeAgg(agg, groupLogs);
    }
    result.push(row);
  }

  return result;
}

function computeAgg(agg: AggregationDef, logs: Record<string, unknown>[]): unknown {
  switch (agg.func) {
    case "count":
      return logs.length;

    case "countIf": {
      if (!agg.arg) return 0;
      const cond = parseSimpleCondition(agg.arg);
      if (!cond) return 0;
      return logs.filter((l) => evaluateCondition(l, cond)).length;
    }

    case "avg": {
      if (!agg.arg) return null;
      const vals = logs
        .map((l) => {
          const v = getFieldValue(l, agg.arg!);
          if (typeof v === "number") return v;
          if (typeof v === "string") {
            const n = parseFloat(v); // handles "5234ms" → 5234
            return isNaN(n) ? null : n;
          }
          return null;
        })
        .filter((v): v is number => v !== null);
      if (!vals.length) return 0;
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }

    case "sum": {
      if (!agg.arg) return null;
      const vals = logs
        .map((l) => getFieldValue(l, agg.arg!))
        .filter((v): v is number => typeof v === "number");
      return vals.reduce((a, b) => a + b, 0);
    }

    case "min": {
      if (!agg.arg) return null;
      const vals = logs.map((l) => getFieldValue(l, agg.arg!)).filter((v) => v != null);
      if (!vals.length) return null;
      return vals.reduce((a, b) => ((a as number) < (b as number) ? a : b));
    }

    case "max": {
      if (!agg.arg) return null;
      const vals = logs.map((l) => getFieldValue(l, agg.arg!)).filter((v) => v != null);
      if (!vals.length) return null;
      return vals.reduce((a, b) => ((a as number) > (b as number) ? a : b));
    }

    case "median": {
      if (!agg.arg) return null;
      const vals = logs
        .map((l) => getFieldValue(l, agg.arg!))
        .filter((v): v is number => typeof v === "number")
        .sort((a, b) => a - b);
      if (!vals.length) return null;
      const mid = Math.floor(vals.length / 2);
      return vals.length % 2 === 0 ? (vals[mid - 1] + vals[mid]) / 2 : vals[mid];
    }

    default:
      return null;
  }
}

function applyGenericSort(
  data: Record<string, unknown>[],
  step: SortStep
): Record<string, unknown>[] {
  return [...data].sort((a, b) => {
    const av = getFieldValue(a, step.field);
    const bv = getFieldValue(b, step.field);
    if (typeof av === "number" && typeof bv === "number") {
      return step.dir === "asc" ? av - bv : bv - av;
    }
    const as = String(av ?? "");
    const bs = String(bv ?? "");
    const cmp = as < bs ? -1 : as > bs ? 1 : 0;
    return step.dir === "asc" ? cmp : -cmp;
  });
}
