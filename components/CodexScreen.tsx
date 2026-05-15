"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QUERY_LIBRARY,
  getAllCategories,
  type QueryCategory,
  type QueryDifficulty,
} from "@/lib/dql/query-library";
import { ExplainerCard } from "./ExplainerCard";
import { TRACKS, getNextLesson } from "@/lib/curriculum/tracks";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { getAllScenarios } from "@/lib/dql/scenario-registry";

const SECTION_TRACK_MAP: Record<string, string> = {
  overview: "fundamentals",
  agents: "fundamentals",
  squads: "fundamentals",
  philosophy: "fundamentals",
  commands: "fundamentals",
  types: "logs-deep-dive",
  operators: "fundamentals",
  functions: "logs-deep-dive",
  examples: "real-incidents",
  "query-cookbook": "real-incidents",
};

type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "code"; code: string }
  | { type: "table"; headers: string[]; rows: string[][] };

interface Section {
  id: string;
  title: string;
  blocks: ContentBlock[];
}

const AGENT_PERSONAS: Record<string, { name: string; role: string; icon: string }> = {
  fetch: { name: "The Scout Bot", role: "Goes out and gathers raw evidence from logs, events, spans, and metrics.", icon: "🔭" },
  filter: { name: "The Security Bot", role: "Checks every record against a condition. Keeps only the matches.", icon: "🛡️" },
  filterOut: { name: "The Janitor Bot", role: "Removes rows that match a condition, keeping the rest clean.", icon: "🧹" },
  parse: { name: "The Translator Bot", role: "Reads unstructured text and extracts structured fields using patterns.", icon: "🔍" },
  summarize: { name: "The Accountant Bot", role: "Groups data and calculates aggregates like count, sum, and average.", icon: "📊" },
  sort: { name: "The Organizer Bot", role: "Arranges records in ascending or descending order.", icon: "📋" },
  fieldsAdd: { name: "The Engineer Bot", role: "Builds new columns from existing data using expressions.", icon: "🔧" },
  fieldsKeep: { name: "The Curator Bot", role: "Keeps only the columns you need and discards the rest.", icon: "🗂️" },
  fieldsRemove: { name: "The Pruner Bot", role: "Cuts away unnecessary columns to speed up processing.", icon: "✂️" },
  fieldsRename: { name: "The Label Bot", role: "Renames columns to make them clearer or consistent.", icon: "🏷️" },
  dedup: { name: "The Cleaner Bot", role: "Removes duplicate rows based on a chosen field.", icon: "🧼" },
  join: { name: "The Detective Bot", role: "Connects records from different sources using a shared key.", icon: "🔗" },
  append: { name: "The Merger Bot", role: "Stacks results from multiple queries into one dataset.", icon: "➕" },
  makeTimeseries: { name: "The Timekeeper Bot", role: "Buckets data by time intervals to spot trends.", icon: "⏰" },
  limit: { name: "The Gatekeeper Bot", role: "Caps the result count so you never get overwhelmed.", icon: "🚪" },
  search: { name: "The Hound Bot", role: "Token-based full-text search across every field.", icon: "🐕" },
  expand: { name: "The Splitter Bot", role: "Turns array values into separate rows for individual analysis.", icon: "✂️" },
};

const SECTIONS: Section[] = [
  {
    id: "overview",
    title: "What is DQL? The Swarm of Agents",
    blocks: [
      {
        type: "paragraph",
        text: "Imagine a factory where millions of tiny robots — each an expert at exactly one job — work together to process an ocean of data. That is DQL. Every command is a specialized agent. The pipe character (|) is the conveyor belt that hands the output of one bot to the next.",
      },
      {
        type: "heading",
        text: "Why Pipes?",
      },
      {
        type: "paragraph",
        text: "In SQL you write nested sub-queries that are hard to read and even harder to debug. In DQL you write a linear pipeline: left-to-right, stage-by-stage, like a story. Each bot only sees the data the previous bot produced. This makes every stage independently testable and optimizable.",
      },
      {
        type: "paragraph",
        text: "At petabyte scale, DQL dispatches millions of these agents in parallel across shards of data. A query that touches billions of rows can return in seconds because every bot works on its own small slice, then passes its results forward. No single bot is overwhelmed — the swarm handles the load.",
      },
      {
        type: "code",
        code: `fetch logs, from: -1h
| filter loglevel == "ERROR"
| fields timestamp, log.source, content
| sort timestamp desc
| limit 100`,
      },
      {
        type: "paragraph",
        text: "Reading the pipeline above is like reading a story: 'Fetch the logs, keep only errors, pick the columns we care about, sort by time, and show the top 100.' No mental gymnastics required.",
      },
      {
        type: "heading",
        text: "Key Principles",
      },
      {
        type: "table",
        headers: ["Principle", "Why it matters"],
        rows: [
          ["Filter as early as possible", "Reduces the dataset size for downstream agents, improving performance."],
          ["Use fieldsKeep to narrow columns", "Less data means faster transfers and clearer results."],
          ["Place sort last", "Sorting large intermediate datasets is expensive; do it only when necessary."],
          ["Always specify timeframes", "Unbounded time scans are slow and can return massive datasets."],
        ],
      },
    ],
  },
  {
    id: "agents",
    title: "Meet the Agents",
    blocks: [
      {
        type: "paragraph",
        text: "Every DQL command is a member of the detective squad. Here is the full roster — who they are, what they do, and how they hand off evidence to the next agent in line.",
      },
      {
        type: "heading",
        text: "Data Loading & Shaping",
      },
      {
        type: "table",
        headers: ["Agent", "Command", "What it does", "Example"],
        rows: [
          ["🔭 Scout Bot", "fetch", "Gathers raw evidence from logs, events, spans, metrics, or bizevents.", "fetch logs, from: -24h"],
          ["🔧 Engineer Bot", "fieldsAdd", "Builds new columns from expressions.", 'fieldsAdd error_flag = loglevel == "ERROR"'],
          ["🗂️ Curator Bot", "fieldsKeep", "Keeps only the columns you specify.", "fieldsKeep timestamp, loglevel, content"],
          ["✂️ Pruner Bot", "fieldsRemove", "Cuts away unwanted columns.", "fieldsRemove internal_id, raw_bytes"],
          ["🏷️ Label Bot", "fieldsRename", "Renames columns for clarity.", "fieldsRename src = log.source"],
          ["🔍 Translator Bot", "parse", "Extracts structured fields from raw text using typed patterns.", 'parse content, "INT:http_status"'],
          ["✂️ Splitter Bot", "expand", "Turns array values into separate rows.", "expand tags"],
          ["🧼 Cleaner Bot", "dedup", "Removes duplicate rows based on a field.", "dedup trace_id"],
        ],
      },
      {
        type: "heading",
        text: "Filtering & Search",
      },
      {
        type: "table",
        headers: ["Agent", "Command", "What it does", "Example"],
        rows: [
          ["🛡️ Security Bot", "filter", "Keeps rows matching a boolean condition.", 'filter loglevel == "ERROR"'],
          ["🧹 Janitor Bot", "filterOut", "Removes rows matching a condition (keeps nulls).", 'filterOut status == "healthy"'],
          ["🐕 Hound Bot", "search", "Token-based full-text search across all fields.", 'search "timeout"'],
        ],
      },
      {
        type: "heading",
        text: "Aggregation & Sorting",
      },
      {
        type: "table",
        headers: ["Agent", "Command", "What it does", "Example"],
        rows: [
          ["📋 Organizer Bot", "sort", "Arranges rows by field. Place last for performance.", "sort timestamp desc"],
          ["🚪 Gatekeeper Bot", "limit", "Caps the result count. Use after summarize.", "limit 10"],
          ["📊 Accountant Bot", "summarize", "Groups data and calculates aggregates.", "summarize count = count(), by:{host}"],
          ["⏰ Timekeeper Bot", "makeTimeseries", "Aggregates into time buckets.", "makeTimeseries errors = count(), interval: 5m"],
          ["➕ Merger Bot", "append", "Stacks results from a subquery.", "append (fetch events)"],
          ["🔗 Detective Bot", "join", "Connects records from different sources.", "join (fetch events), on:{trace_id}"],
        ],
      },
    ],
  },
  {
    id: "squads",
    title: "Building a Detective Squad",
    blocks: [
      {
        type: "paragraph",
        text: "No agent works alone. The real power of DQL is assembling squads that tackle complex investigations. Here are three proven formations you can copy and adapt.",
      },
      {
        type: "heading",
        text: "The Investigator Squad",
      },
      {
        type: "paragraph",
        text: "Use this when you need to find needles in a haystack: fetch evidence, narrow it down with filters, extract hidden fields, and summarize the findings.",
      },
      {
        type: "code",
        code: `// The Investigator: fetch -> filter -> parse -> summarize
fetch logs
| filter loglevel == "ERROR"
| parse content, "INT:http_status LD:msg"
| summarize count = count(), by:{http_status}`,
      },
      {
        type: "heading",
        text: "The Time Detective Squad",
      },
      {
        type: "paragraph",
        text: "Perfect for spotting trends and anomalies over time. The Timekeeper bot buckets everything, then the Engineer bot adds calculated fields.",
      },
      {
        type: "code",
        code: `// The Time Detective: fetch -> makeTimeseries -> fieldsAdd -> sort
fetch bizevents, from: -24h
| makeTimeseries orders = count(), interval: 1h
| fieldsAdd hour = formatTimestamp(timestamp, "HH")
| sort timestamp asc`,
      },
      {
        type: "heading",
        text: "The Security Sweep Squad",
      },
      {
        type: "paragraph",
        text: "Use this for audits and clean-up operations. Filter down to suspicious records, keep only the essential columns, remove duplicates, and cap the output.",
      },
      {
        type: "code",
        code: `// The Security Sweep: fetch -> filter -> fieldsKeep -> dedup -> limit
fetch logs
| filter loglevel in array("ERROR", "FATAL")
| fieldsKeep timestamp, host, content
| dedup content
| limit 50`,
      },
    ],
  },
  {
    id: "philosophy",
    title: "Why Pipes? The Philosophy",
    blocks: [
      {
        type: "paragraph",
        text: "DQL uses pipes for the same reason Unix shells use pipes: composability. Each command is a pure function that receives a dataset and produces a new dataset. There are no side effects. You can chop off the end of any pipeline, run it, and inspect exactly what that stage produced.",
      },
      {
        type: "heading",
        text: "SQL vs DQL Mindset",
      },
      {
        type: "paragraph",
        text: "SQL asks you to declare the entire shape of the result upfront. Sub-queries nest inside sub-queries. When something breaks, you peel the onion layer by layer. DQL lets you build incrementally: add one stage, see the result, add the next. It is exploratory by design.",
      },
      {
        type: "code",
        code: `// SQL: nested, bottom-up reading
SELECT host, cnt FROM (
  SELECT host, count(*) AS cnt
  FROM logs
  WHERE level = 'ERROR'
  GROUP BY host
) HAVING cnt > 10;

// DQL: linear, left-to-right reading
fetch logs
| filter level == "ERROR"
| summarize cnt = count(), by:{host}
| filter cnt > 10`,
      },
      {
        type: "heading",
        text: "Performance",
      },
      {
        type: "paragraph",
        text: "Because each stage is isolated, the DQL execution engine can optimize them independently. A filter stage that drops 99% of rows early means every downstream agent works on a dataset 100x smaller. This is the secret to petabyte-scale speed: aggressive early reduction.",
      },
      {
        type: "heading",
        text: "Readability",
      },
      {
        type: "paragraph",
        text: "A DQL pipeline reads like a recipe. You can hand it to a teammate and they will understand it in seconds. The order of operations is the order of reading. No mental stack required.",
      },
      {
        type: "heading",
        text: "Composability",
      },
      {
        type: "paragraph",
        text: "Got a pipeline that finds slow spans? Append a join stage to enrich it with log context. Need to alert on it? Wrap the whole thing in a scheduled notebook. Because each pipeline is self-contained, it becomes a reusable building block.",
      },
    ],
  },
  {
    id: "commands",
    title: "Command Reference",
    blocks: [
      {
        type: "paragraph",
        text: "Quick-reference tables for every DQL command. Click any command name to expand its detailed explainer.",
      },
      {
        type: "heading",
        text: "Data Loading & Shaping",
      },
      {
        type: "table",
        headers: ["Command", "Syntax", "Description", "Example"],
        rows: [
          ["fetch", "fetch <source>, from: -<duration>", "Load data from a source (logs, events, spans, metrics, bizevents).", "fetch logs, from: -24h"],
          ["data", "data <json>", "Generate sample records inline for testing.", 'data [{"id": 1, "name": "test"}]'],
          ["fieldsKeep", "fields <col1>, <col2>", "Keep only the specified columns.", "fields timestamp, loglevel, content"],
          ["fieldsAdd", "fieldsAdd <col> = <expr>", "Add computed columns.", 'fieldsAdd error_flag = loglevel == "ERROR"'],
          ["fieldsRemove", "fieldsRemove <col1>, <col2>", "Remove columns from the dataset.", "fieldsRemove internal_id, raw_bytes"],
          ["fieldsRename", "fieldsRename <old> = <new>", "Rename existing columns.", "fieldsRename src = log.source"],
          ["parse", 'parse <field>, "<pattern>"', "Extract structured data from text using typed capture groups.", 'parse content, "INT:http_status"'],
          ["expand", "expand <array_col>", "Turn array values into separate rows.", "expand tags"],
          ["dedup", "dedup <field>", "Remove duplicate rows based on a field.", "dedup trace_id"],
        ],
      },
      {
        type: "heading",
        text: "Filtering & Search",
      },
      {
        type: "table",
        headers: ["Command", "Syntax", "Description", "Example"],
        rows: [
          ["filter", "filter <condition>", "Keep rows matching a boolean condition.", 'filter loglevel == "ERROR"'],
          ["filterOut", "filterOut <condition>", "Remove rows matching a condition (keeps nulls).", 'filterOut status == "healthy"'],
          ["search", 'search "<term>"', "Token-based case-insensitive full-text search across all fields.", 'search "timeout"'],
        ],
      },
      {
        type: "heading",
        text: "Aggregation & Sorting",
      },
      {
        type: "table",
        headers: ["Command", "Syntax", "Description", "Example"],
        rows: [
          ["sort", "sort <field> [asc|desc]", "Sort rows by a field. Place this last for performance.", "sort timestamp desc"],
          ["limit", "limit <n>", "Cap the result count. Use after summarize.", "limit 10"],
          ["summarize", "summarize <agg>, by:{<field>}", "Group and aggregate data.", "summarize count = count(), by:{host}"],
          ["makeTimeseries", "makeTimeseries <alias> = <agg>, interval:<duration>", "Aggregate into time buckets.", "makeTimeseries errors = count(), interval: 5m"],
          ["append", "append [subquery]", "Union with results from a subquery.", "append (fetch events)"],
          ["join", "join [subquery], on:<condition>", "Merge with subquery results on a condition.", "join (fetch events), on:{trace_id}"],
        ],
      },
    ],
  },
  {
    id: "types",
    title: "Data Types",
    blocks: [
      {
        type: "paragraph",
        text: "DQL supports a rich set of primitive and composite types. Understanding them is critical for writing correct filters, parse patterns, and expressions.",
      },
      {
        type: "heading",
        text: "Primitive Types",
      },
      {
        type: "table",
        headers: ["Type", "Description", "Literal Examples", "Notes"],
        rows: [
          ["boolean", "Logical true / false values.", "true, false, TRUE, FALSE", "Case-insensitive. null == null yields null, not true."],
          ["long", "Signed 64-bit integers.", "42, -7, 0xFF", "Hex literals supported. Use toLong() for conversion."],
          ["double", "64-bit IEEE 754 floating-point.", "3.14159, -0.001, 1e10", "Use toDouble() for conversion."],
          ["timestamp", "Nanosecond precision instant in UTC.", "2024-01-15T08:30:00Z", "Can be compared and formatted."],
          ["duration", "Relative time spans.", "1s, 1m, 1h, 1d, 1w, 1M, 1y", "Used in fetch timeframes and interval arguments."],
          ["string", "UTF-8 text sequences.", '"hello", "line1\\nline2"', "Double quotes. Triple-quote for multiline blocks."],
          ["IpAddress", "IPv4 or IPv6 network address.", '"192.168.1.1", "::1"', "Supports comparison and CIDR matching."],
          ["UID", "64-bit or 128-bit identifiers.", '"0x1234567890abcdef"', "Used for entity IDs and trace IDs."],
        ],
      },
      {
        type: "heading",
        text: "Composite Types",
      },
      {
        type: "table",
        headers: ["Type", "Description", "Access Pattern", "Example"],
        rows: [
          ["array", "Ordered collection of values.", "Index access: a[0]", '[1, 2, 3], ["a", "b"]'],
          ["record", "Key-value pairs (nested objects).", "Field access: r[field]", '{"name": "server", "cpu": 45}'],
        ],
      },
      {
        type: "heading",
        text: "Type Conversion Examples",
      },
      {
        type: "code",
        code: `// String to long
fieldsAdd code = toLong(http_status)

// String to timestamp
fieldsAdd ts = toTimestamp("2024-01-15T08:30:00Z")

// Long to duration (microseconds → duration)
fieldsAdd latency = toDuration(duration_us * 1000)`,
      },
    ],
  },
  {
    id: "operators",
    title: "Operators",
    blocks: [
      {
        type: "paragraph",
        text: "Operators let you build expressions for filters, field calculations, and join conditions. Precedence matters — use parentheses when in doubt.",
      },
      {
        type: "heading",
        text: "Precedence (strongest to weakest)",
      },
      {
        type: "table",
        headers: ["Precedence", "Operators", "Description"],
        rows: [
          ["1", "- (unary)", "Negation"],
          ["2", "* / %", "Multiplication, division, modulo"],
          ["3", "@", "Time alignment"],
          ["4", "+ -", "Addition, subtraction"],
          ["5", "~", "Search / contains"],
          ["6", "== != > >= < <=", "Comparison"],
          ["7", "in", "Membership test"],
          ["8", "not", "Logical negation"],
          ["9", "and", "Logical conjunction"],
          ["10", "xor", "Exclusive or"],
          ["11", "or", "Logical disjunction"],
        ],
      },
      {
        type: "heading",
        text: "Critical Null Handling",
      },
      {
        type: "paragraph",
        text: "DQL handles null differently from most languages. Understanding these rules prevents subtle bugs in your filters.",
      },
      {
        type: "table",
        headers: ["Expression", "Result", "Explanation"],
        rows: [
          ["null == null", "null (not true)", "Null comparisons yield null, not true."],
          ["filter not x", "Removes nulls", "not null is null, so the row is excluded."],
          ["filterOut x", "Keeps nulls", "filterOut only removes rows where x is true."],
          ["isTrueOrNull(x)", "Includes nulls", "Use this function when you want nulls in the result."],
        ],
      },
      {
        type: "heading",
        text: "Operator Examples",
      },
      {
        type: "code",
        code: `// Comparison with null awareness
filter status.code == "ERROR"

// Range check
filter duration_ms >= 1000 && duration_ms <= 5000

// Membership
filter loglevel in array("ERROR", "WARN", "FATAL")

// Search (case-insensitive substring)
filter content ~ "timeout"

// Time alignment
fetch logs, from: -1h
| filter timestamp >= ago(1h) @ 5m`,
      },
    ],
  },
  {
    id: "functions",
    title: "Functions",
    blocks: [
      {
        type: "paragraph",
        text: "DQL provides a comprehensive library of built-in functions. They are categorized by domain below.",
      },
      {
        type: "heading",
        text: "Aggregation",
      },
      {
        type: "table",
        headers: ["Function", "Signature", "Example", "Result"],
        rows: [
          ["count", "count()", "count()", "Number of rows in the group"],
          ["countIf", "countIf(condition)", 'countIf(status == "ERROR")', "Count rows matching condition"],
          ["sum", "sum(field)", "sum(amount)", "Total of numeric values"],
          ["avg", "avg(field)", "avg(duration_ms)", "Arithmetic mean"],
          ["min", "min(field)", "min(timestamp)", "Smallest value"],
          ["max", "max(field)", "max(duration_ms)", "Largest value"],
          ["stddev", "stddev(field)", "stddev(latency)", "Standard deviation"],
          ["percentile", "percentile(field, p)", "percentile(duration, 95)", "P-th percentile"],
          ["collectArray", "collectArray(field)", "collectArray(trace_id)", "Array of all values"],
          ["collectDistinct", "collectDistinct(field)", "collectDistinct(host)", "Set of unique values"],
        ],
      },
      {
        type: "heading",
        text: "String",
      },
      {
        type: "table",
        headers: ["Function", "Signature", "Example", "Result"],
        rows: [
          ["concat", "concat(s1, s2, ...)", 'concat("Error: ", message)', "Concatenated string"],
          ["contains", "contains(haystack, needle)", 'contains(content, "timeout")', "true if substring found"],
          ["startsWith", "startsWith(s, prefix)", 'startsWith(endpoint, "/api/v2")', "true if prefix match"],
          ["endsWith", "endsWith(s, suffix)", 'endsWith(host, ".internal")', "true if suffix match"],
          ["indexOf", "indexOf(s, substring)", 'indexOf(content, "failed")', "Index or -1"],
          ["splitString", "splitString(s, delimiter)", 'splitString(tags, ",")', "Array of parts"],
          ["trim", "trim(s)", 'trim("  hello  ")', '"hello"'],
          ["lower", "lower(s)", 'lower("HTTP")', '"http"'],
          ["upper", "upper(s)", 'upper("http")', '"HTTP"'],
          ["jsonPath", "jsonPath(s, path)", 'jsonPath(payload, "$.user.id")', "Extracted JSON value"],
        ],
      },
      {
        type: "heading",
        text: "Time",
      },
      {
        type: "table",
        headers: ["Function", "Signature", "Example", "Result"],
        rows: [
          ["now", "now()", "now()", "Current timestamp"],
          ["duration", "duration(string)", 'duration("1h")', "Duration value"],
          ["timeframe", "timefield()", "timeframe()", "Current query timeframe"],
          ["getHour", "getHour(ts)", "getHour(timestamp)", "Hour of day (0-23)"],
          ["getDayOfWeek", "getDayOfWeek(ts)", "getDayOfWeek(timestamp)", "Day index (1-7)"],
          ["formatTimestamp", "formatTimestamp(ts, fmt)", 'formatTimestamp(ts, "yyyy-MM-dd")', "Formatted string"],
          ["timestampFromUnixMillis", "timestampFromUnixMillis(ms)", "timestampFromUnixMillis(1705312200000)", "Timestamp from epoch"],
        ],
      },
      {
        type: "heading",
        text: "Conversion",
      },
      {
        type: "table",
        headers: ["Function", "Signature", "Example", "Result"],
        rows: [
          ["toLong", "toLong(value)", 'toLong("42")', "42"],
          ["toDouble", "toDouble(value)", 'toDouble("3.14")', "3.14"],
          ["toString", "toString(value)", 'toString(42)', '"42"'],
          ["toTimestamp", "toTimestamp(value)", 'toTimestamp("2024-01-15")', "timestamp"],
          ["toDuration", "toDuration(value)", 'toDuration("1h")', "duration"],
          ["toBoolean", "toBoolean(value)", 'toBoolean("true")', "true"],
          ["toIp", "toIp(value)", 'toIp("192.168.1.1")', "IpAddress"],
          ["toUid", "toUid(value)", 'toUid("0xabc123")', "UID"],
        ],
      },
      {
        type: "heading",
        text: "Conditional",
      },
      {
        type: "table",
        headers: ["Function", "Signature", "Example", "Result"],
        rows: [
          ["if", "if(condition, then, else)", 'if(code >= 500, "critical", "ok")', '"critical" or "ok"'],
          ["coalesce", "coalesce(...)", 'coalesce(nickname, username, "anonymous")', "First non-null value"],
        ],
      },
      {
        type: "heading",
        text: "Array",
      },
      {
        type: "table",
        headers: ["Function", "Signature", "Example", "Result"],
        rows: [
          ["arraySize", "arraySize(arr)", "arraySize(tags)", "Number of elements"],
          ["arraySort", "arraySort(arr)", "arraySort(values)", "Sorted copy"],
          ["arrayDistinct", "arrayDistinct(arr)", "arrayDistinct(hosts)", "Unique values"],
          ["arrayRemoveNulls", "arrayRemoveNulls(arr)", "arrayRemoveNulls(results)", "Filtered copy"],
          ["arraySlice", "arraySlice(arr, start, end)", "arraySlice(arr, 0, 5)", "Sub-array"],
          ["arraySum", "arraySum(arr)", "arraySum(durations)", "Sum of numeric elements"],
          ["arrayAvg", "arrayAvg(arr)", "arrayAvg(latencies)", "Average of numeric elements"],
        ],
      },
      {
        type: "heading",
        text: "Math",
      },
      {
        type: "table",
        headers: ["Function", "Signature", "Example"],
        rows: [
          ["abs", "abs(n)", "abs(-5)"],
          ["ceil", "ceil(n)", "ceil(4.2)"],
          ["floor", "floor(n)", "floor(4.9)"],
          ["round", "round(n, digits)", "round(3.14159, 2)"],
          ["sqrt", "sqrt(n)", "sqrt(16)"],
          ["pow", "pow(base, exp)", "pow(2, 10)"],
          ["log", "log(n)", "log(100)"],
          ["sin / cos / tan", "sin(angle)", "sin(pi() / 2)"],
          ["pi", "pi()", "pi()"],
        ],
      },
    ],
  },
  {
    id: "examples",
    title: "Examples",
    blocks: [
      {
        type: "heading",
        text: "Basic Error Filter",
      },
      {
        type: "paragraph",
        text: "Load the last 24 hours of logs, keep only ERROR entries, select three columns, sort by time descending, and cap at 100 rows.",
      },
      {
        type: "code",
        code: `fetch logs, from: -24h
| filter loglevel == "ERROR"
| fields timestamp, log.source, content
| sort timestamp desc
| limit 100`,
      },
      {
        type: "heading",
        text: "Parse and Aggregate",
      },
      {
        type: "paragraph",
        text: "Extract an HTTP status code from the content field, filter for 4xx/5xx responses, then summarize the count per status code.",
      },
      {
        type: "code",
        code: `fetch logs
| parse content, "INT:httpstatus"
| filter httpstatus >= 400
| summarize count(), by:{httpstatus}`,
      },
      {
        type: "heading",
        text: "Time Series",
      },
      {
        type: "paragraph",
        text: "Create a time series of error counts bucketed into 5-minute intervals. Missing buckets default to 0.",
      },
      {
        type: "code",
        code: `fetch logs, from: -24h
| filter loglevel == "ERROR"
| makeTimeseries errors = count(), interval: 5m, default: 0`,
      },
      {
        type: "heading",
        text: "Business Events",
      },
      {
        type: "paragraph",
        text: "Analyze order confirmations over the last day, aggregating total revenue by product category.",
      },
      {
        type: "code",
        code: `fetch bizevents, from: -24h
| filter event.type == "com.acme.order_confirmed"
| summarize total = sum(amount), by:{product}`,
      },
      {
        type: "heading",
        text: "Latency Analysis",
      },
      {
        type: "paragraph",
        text: "Find the slowest spans with ERROR status, then compute average latency per service.",
      },
      {
        type: "code",
        code: `fetch spans, from: -1h
| filter status.code == "ERROR"
| summarize avg_latency = avg(duration), by:{service.name}
| sort avg_latency desc`,
      },
    ],
  },
  {
    id: "query-cookbook",
    title: "Query Cookbook",
    blocks: [],
  },
];

const DIFFICULTY_COLORS: Record<QueryDifficulty, string> = {
  simple: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  intermediate: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  advanced: "bg-rose-400/10 text-rose-400 border-rose-400/20",
};

function QueryCookbook() {
  const [activeCategory, setActiveCategory] = useState<QueryCategory | "all">("all");
  const [activeDifficulty, setActiveDifficulty] = useState<QueryDifficulty | "all">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = getAllCategories();

  const filtered = QUERY_LIBRARY.filter((q) => {
    if (activeCategory !== "all" && q.category !== activeCategory) return false;
    if (activeDifficulty !== "all" && q.difficulty !== activeDifficulty) return false;
    return true;
  });

  const handleCopy = async (query: string, id: string) => {
    await navigator.clipboard.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-500">Category:</span>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value as QueryCategory | "all")}
            className="bg-slate-900/80 border border-white/[0.08] rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40"
          >
            <option value="all">All ({QUERY_LIBRARY.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({c.count})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-500">Difficulty:</span>
          <select
            value={activeDifficulty}
            onChange={(e) => setActiveDifficulty(e.target.value as QueryDifficulty | "all")}
            className="bg-slate-900/80 border border-white/[0.08] rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/40"
          >
            <option value="all">All</option>
            <option value="simple">Simple</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((q) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-strong rounded-xl border border-white/[0.06] p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-100">{q.title}</h3>
                <p className="text-xs text-slate-400">{q.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${DIFFICULTY_COLORS[q.difficulty]}`}
                >
                  {q.difficulty}
                </span>
                <span className="text-xs text-slate-500">+{q.xpReward} XP</span>
              </div>
            </div>

            <pre className="text-xs font-mono text-slate-300 bg-slate-950/80 rounded-lg p-3 overflow-x-auto border border-white/[0.06] leading-relaxed">
              {q.query}
            </pre>

            <p className="text-xs text-slate-400 leading-relaxed">{q.explanation}</p>

            <button
              onClick={() => handleCopy(q.query, q.id)}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {copiedId === q.id ? "Copied!" : "Copy to clipboard"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CommandTable({ block }: { block: ContentBlock & { type: "table" } }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const isCommandTable = block.headers[0]?.toLowerCase() === "command";

  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border border-white/[0.06] rounded-lg overflow-hidden">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.03]">
            {block.headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-xs font-medium text-slate-300"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <>
              <tr
                key={ri}
                className="border-b border-white/[0.03] even:bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-xs text-slate-300">
                    {isCommandTable && ci === 0 ? (
                      <button
                        onClick={() => setExpanded(expanded === cell ? null : cell)}
                        className="text-cyan-300 hover:text-cyan-200 font-medium transition-colors flex items-center gap-1"
                      >
                        {cell}
                        <span className="text-xs text-slate-500">
                          {expanded === cell ? "▲" : "▼"}
                        </span>
                      </button>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
              {isCommandTable && expanded === row[0] && (
                <tr className="border-b border-white/[0.03]">
                  <td colSpan={block.headers.length} className="p-0">
                    <ExplainerCard command={row[0]} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlock(block: ContentBlock, idx: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={idx} className="text-sm text-slate-300 leading-relaxed mb-4">
          {block.text}
        </p>
      );
    case "heading":
      return (
        <h3 key={idx} className="text-sm font-semibold text-slate-200 mt-6 mb-3">
          {block.text}
        </h3>
      );
    case "code":
      return (
        <pre
          key={idx}
          className="text-xs font-mono text-slate-300 bg-slate-950/80 rounded-lg p-4 overflow-x-auto border border-white/[0.06] mb-4 leading-relaxed"
        >
          {block.code}
        </pre>
      );
    case "table":
      return <CommandTable key={idx} block={block} />;
    default:
      return null;
  }
}

function PracticeCTA({ sectionId }: { sectionId: string }) {
  const trackProgress = useInvestigatorStore((s) => s.trackProgress);
  const setActiveLessonContext = useInvestigatorStore((s) => s.setActiveLessonContext);
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const setPhase = useInvestigatorStore((s) => s.setPhase);
  const setShowLanding = useInvestigatorStore((s) => s.setShowLanding);

  const trackId = SECTION_TRACK_MAP[sectionId];
  if (!trackId) return null;

  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return null;

  const nextLesson = getNextLesson(trackId, trackProgress);
  if (!nextLesson) return null;

  const handleStart = () => {
    const scenario = getAllScenarios().find((s) => s.id === nextLesson.id);
    if (scenario) {
      setActiveLessonContext({ trackId, lessonId: nextLesson.id });
      setScenario(scenario);
      setPhase(2);
      setShowLanding(false);
    }
  };

  const colors: Record<string, string> = {
    cyan: "text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10",
    violet: "text-violet-400 border-violet-400/30 hover:bg-violet-400/10",
    emerald: "text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10",
    amber: "text-amber-400 border-amber-400/30 hover:bg-amber-400/10",
    rose: "text-rose-400 border-rose-400/30 hover:bg-rose-400/10",
  };
  const colorClass = colors[track.color] || colors.cyan;

  return (
    <div className="mt-8 pt-6 border-t border-white/[0.06]">
      <button
        onClick={handleStart}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${colorClass}`}
      >
        Practice this →
        <span className="text-xs text-slate-500 ml-1">{track.title} · {nextLesson.title}</span>
      </button>
    </div>
  );
}

export function CodexScreen() {
  const [activeSection, setActiveSection] = useState("overview");
  const section = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="flex-1 flex h-full">
      <div className="w-64 glass-panel border-r border-cyan-400/20 flex flex-col" data-tour-target="learn-sidebar">
        <div className="h-10 flex items-center px-4 border-b border-white/[0.06]">
          <span className="text-xs font-medium text-slate-300">DQL Codex</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeSection === s.id
                  ? "bg-cyan-400/15 text-cyan-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8" data-tour-target="learn-content">
        <AnimatePresence mode="wait">
          {section && (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl"
            >
              <h2 className="text-xl font-semibold text-slate-100 mb-6">{section.title}</h2>
              {section.id === "query-cookbook" ? (
                <div data-tour-target="learn-cookbook">
                  <QueryCookbook />
                </div>
              ) : (
                section.blocks.map((block, i) => renderBlock(block, i))
              )}
              <PracticeCTA sectionId={section.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
