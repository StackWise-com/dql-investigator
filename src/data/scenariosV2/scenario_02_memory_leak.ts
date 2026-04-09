import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "{{companyName}}'s {{serviceName}} transcodes video for streaming delivery. It's been getting progressively slower over 3 days — buffering complaints are up, but no process has crashed. The default query window is 2 hours, but this degradation started 3 days ago. You need the full history to see the trend.",
  clue: "The default log window only covers recent hours. This issue has been building for 3 days — you need to look further back in time than the default window allows.",
  secondClue: "The `fetch` command accepts a time range parameter called `from:`. It controls how far back in time to retrieve records.",
  finalClue: "The `from:` parameter accepts relative offsets. To go back 3 days, use `now()` — a function that returns the current timestamp — and subtract 3 days using `3d`.",
  requiredConcepts: ["fetch logs", "from", "now()"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasTimeRange = n.includes("3d") || n.includes("now()-3d") || (n.includes("from:") && (n.includes("72h") || n.includes("3d")));
    if (hasFetch && hasTimeRange) return { valid: true, partial: false, feedback: "3 days of logs loaded. That's a lot of data to sift through." };
    if (hasFetch && n.includes("from:")) return { valid: false, partial: true, feedback: "Good — you're using from:. Extend it to cover 3 days of data." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Logs loaded. But the default window is 2 hours — you need 3 days of history." };
    return { valid: false, partial: false, feedback: "Load the logs with an extended time range covering the degradation period." };
  },
  mockRecordCount: 0,
  mockResultCount: 890000,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "dt.process.name", "content"],
    rows: [
      [{ value: "3 days ago" }, { value: v.serviceName }, { value: "heap usage: 42%" }],
      [{ value: "2 days ago" }, { value: v.serviceName }, { value: "heap usage: 61%" }],
      [{ value: "1 day ago" }, { value: v.serviceName }, { value: "heap usage: 78%" }],
      [{ value: "now" }, { value: v.serviceName }, { value: "heap usage: 94% — GC pausing 8s", style: "error" }],
    ],
  }),
  baseXP: 65,
  xpPerHint: 16,
  storyExplanation: "fetch logs, from:now()-3d extends the query window to 3 days ago. now() returns the current timestamp. You can subtract time with d (days), h (hours), m (minutes). The vortex now holds 3 days of operational history.",
  dqlLesson: `fetch logs, from:now()-3d
fetch logs, from:now()-24h
fetch logs, from:now()-7d, to:now()-1d
fetch logs, from:-2h                    // shorthand for now()-2h

// now() returns the current timestamp.
// Subtract: d = days, h = hours, m = minutes, s = seconds
// Absolute range: from:"2026-04-09T03:41:00Z", to:"2026-04-09T03:45:00Z"`,
  commandsShown: ["fetch logs", "from:", "now()"],
};

const step2 = {
  stepNumber: 2,
  narration: "{{companyName}}'s {{serviceName}} is a JVM-based transcoder. 890,000 logs from 3 days cover every service on every host. The memory issue is in one specific process — filtering to it now will eliminate 97% of the noise and make the trend visible.",
  clue: "You know which service is leaking memory. Every log record contains metadata about which process emitted it. Filter to only that process.",
  secondClue: "Dynatrace automatically tags log records with the name of the OS process that generated them. There's a specific field for this on every record.",
  finalClue: "The field that identifies the OS process name is called `dt.process.name`. The function `contains()` or `matchesPhrase()` searches inside a field for a substring.",
  requiredConcepts: ["filter", "contains", "dt.process.name"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasProcessFilter = n.includes("dt.process.name") && (n.includes("contains(") || n.includes("matchesphrase(") || n.includes("=="));
    if (hasFetch && hasProcessFilter) return { valid: true, partial: false, feedback: "Filtered to the target process. Noise dissolves." };
    if (hasFetch && (n.includes("contains(") || n.includes("matchesphrase("))) return { valid: false, partial: true, feedback: "Good use of content search. Apply it to the field that identifies the process name." };
    if (hasFetch && n.includes("filter")) return { valid: false, partial: true, feedback: "Filtering is right. Look for the Dynatrace field that stores the process name." };
    return { valid: false, partial: false, feedback: "Fetch 3 days of logs and filter to the specific process that's misbehaving." };
  },
  mockRecordCount: 890000,
  mockResultCount: 24300,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "dt.process.name", "content"],
    rows: [
      [{ value: "3d ago" }, { value: v.serviceName, style: "highlight" }, { value: "GC pause: 120ms" }],
      [{ value: "2d ago" }, { value: v.serviceName, style: "highlight" }, { value: "GC pause: 890ms", style: "warn" }],
      [{ value: "1d ago" }, { value: v.serviceName, style: "highlight" }, { value: "GC pause: 3.2s", style: "error" }],
      [{ value: "now" }, { value: v.serviceName, style: "highlight" }, { value: "GC pause: 8.1s — OutOfMemoryError imminent", style: "error" }],
    ],
  }),
  baseXP: 80,
  xpPerHint: 20,
  storyExplanation: "dt.process.name is a Dynatrace-managed field that identifies which process generated the log. Using contains() or matchesPhrase() lets you match on a substring — useful when process names include version suffixes or hostnames.",
  dqlLesson: `| filter contains(dt.process.name, "transcode")
| filter contains(content, "timeout")
| filter contains(log.source, "pgi.log")

// contains(field, "substring") — case-sensitive substring search
// matchesPhrase(field, "phrase") — phrase-level search, same result for substrings
// dt.process.name — identifies the OS process that emitted the log`,
  commandsShown: ["contains()", "dt.process.name"],
};

const step3 = {
  stepNumber: 3,
  narration: "{{companyName}}'s {{serviceName}} is a Java process — JVM memory leaks leave specific signatures in logs. 24,300 process logs are in view. The JVM emits heap usage percentages and garbage collection times as plain text in the log content. Filtering for those keywords will isolate the memory pressure evidence.",
  clue: "Memory leaks in JVM applications produce specific log messages. Think about what terminology appears when a Java process is running out of usable memory.",
  secondClue: "JVM logs use specific terms for its memory area and for the process that reclaims memory. These terms would appear in the `content` field of the log records.",
  finalClue: "Search the `content` field using `contains()` or `matchesPhrase()` for the words 'memory' or 'heap'. Combine two searches with the boolean operator `or`.",
  requiredConcepts: ["filter", "contains", "content", "memory"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasMemory = (n.includes("contains(") || n.includes("matchesphrase(")) && (n.includes("memory") || n.includes("heap"));
    if (hasFetch && hasMemory) return { valid: true, partial: false, feedback: "Memory pressure logs isolated. The GC pause times tell a story." };
    if (hasFetch && n.includes("filter") && (n.includes("memory") || n.includes("heap"))) return { valid: false, partial: true, feedback: "Good — you're looking for memory keywords. Use contains() or matchesPhrase() to search inside the content field." };
    return { valid: false, partial: false, feedback: "Filter process logs for content related to memory or heap usage." };
  },
  mockRecordCount: 24300,
  mockResultCount: 312,
  mockResultData: (): MockData => ({
    headers: ["timestamp", "content"],
    rows: [
      [{ value: "day 1" }, { value: "heap: 42% used (2.1 GB / 5 GB)" }],
      [{ value: "day 2" }, { value: "heap: 67% used — GC overhead increasing", style: "warn" }],
      [{ value: "day 3" }, { value: "heap: 91% used — GC pausing 8s per cycle", style: "error" }],
      [{ value: "now" }, { value: "java.lang.OutOfMemoryError: Java heap space", style: "error" }],
    ],
  }),
  baseXP: 90,
  xpPerHint: 23,
  storyExplanation: "The GC pause times form a perfect ramp over 3 days. This is a classic JVM memory leak signature — not a sudden crash, but steady accumulation. The container's memory limit wasn't passed to the JVM, so the heap kept growing until GC couldn't keep up.",
  dqlLesson: `| filter contains(content, "memory") or contains(content, "heap")
| filter contains(content, "OutOfMemory")
| filter contains(content, "GC overhead")

// Boolean operators: and, or, not
// Combine multiple contains() with 'or' to cast a wider net.
// 'and' requires BOTH conditions true. 'or' requires EITHER.`,
  commandsShown: ["or", "and", "not"],
};

const step4 = {
  stepNumber: 4,
  narration: "Memory pressure confirmed — heap climbing steadily over 3 days. The 312 memory-related log entries are the evidence trail. To show this to the team, add a computed field showing the age of each record — how long ago it was emitted — to make the timeline human-readable at a glance.",
  clue: "You want each record to show how old it is — the time elapsed since it was created. This isn't stored in the data; it needs to be computed from what's already there.",
  secondClue: "There's a function that returns the current moment in time, and every record already has a field for the moment it was created. Subtracting them gives the age.",
  finalClue: "The command that adds new computed fields without removing existing ones is called `fieldsAdd`. The current time function is `now()`. The record creation field is `timestamp`.",
  requiredConcepts: ["fieldsAdd", "now()", "timestamp"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasFieldsAdd = n.includes("fieldsadd");
    const hasNow = n.includes("now()");
    const hasTimestamp = n.includes("timestamp");
    if (hasFetch && hasFieldsAdd && hasNow && hasTimestamp) return { valid: true, partial: false, feedback: "Age field computed. Records now show their age alongside memory data." };
    if (hasFetch && hasFieldsAdd) return { valid: false, partial: true, feedback: "fieldsAdd is correct. Compute the age using now() minus timestamp." };
    if (hasFetch && n.includes("fields")) return { valid: false, partial: true, feedback: "You're using a fields command. To ADD a new computed field without dropping others, use fieldsAdd." };
    return { valid: false, partial: false, feedback: "Add a computed field to each record that shows how old it is." };
  },
  mockRecordCount: 312,
  mockResultCount: 312,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "age", "content"],
    rows: [
      [{ value: "3d ago" }, { value: "72h 14m" }, { value: `${v.serviceName}: heap: 42%` }],
      [{ value: "2d ago" }, { value: "48h 22m" }, { value: `${v.serviceName}: heap: 67%`, style: "warn" }],
      [{ value: "1d ago" }, { value: "24h 11m" }, { value: `${v.serviceName}: heap: 91%`, style: "error" }],
    ],
  }),
  baseXP: 85,
  xpPerHint: 21,
  storyExplanation: "fieldsAdd computes new fields without dropping existing ones (unlike 'fields' which keeps only listed fields). now() - timestamp gives the age as a duration. This lets you see at a glance that the memory issue has been building for exactly 3 days.",
  dqlLesson: `| fieldsAdd age = now() - timestamp
| fieldsAdd errorRate = errors / total * 100
| fieldsAdd severity = if(loglevel == "ERROR", "HIGH", else: "LOW")

// fieldsAdd: add computed fields to every record. Existing fields stay.
// now() returns current timestamp. Arithmetic on timestamps gives durations.
// if(condition, trueValue, else: falseValue) — conditional field assignment`,
  commandsShown: ["fieldsAdd", "now()"],
};

export const scenario02: ScenarioV2 = {
  id: "scenario_02_memory_leak",
  difficulty: 2,
  stars: "★★☆☆☆",
  title: "The Memory Leak",
  company: "{{companyName}}",
  briefing: "{{companyName}}'s {{serviceName}} has been getting progressively slower over 3 days. Users report buffering. No crashes — just creeping degradation. Something is eating memory.",
  steps: [step1, step2, step3, step4],
  variants: [
    {
      companyName: "VoltStream", serviceName: "transcode-worker", hostName: "gpu-node-02",
      processGroup: "PROCESS_GROUP-3D9C", hostId: "HOST-CC4499BB",
      errorTimestamp: "day 3", deploymentVersion: "v4.1.2",
      ipAddresses: ["10.0.3.11"], statusCodes: [200],
      errorMessages: ["GC overhead limit exceeded", "OutOfMemoryError: Java heap space"],
      configKey: "jvm.heap.max", configValue: "-Xmx512m (container has 4GB)",
      errorCounts: [890000, 24300, 312, 18],
    },
    {
      companyName: "StreamFast", serviceName: "encoder-service", hostName: "media-server-05",
      processGroup: "PROCESS_GROUP-7E2A", hostId: "HOST-DD7711EE",
      errorTimestamp: "day 3", deploymentVersion: "v2.8.0",
      ipAddresses: ["10.0.4.22"], statusCodes: [200],
      errorMessages: ["heap space exhausted", "GC pause 9.4s"],
      configKey: "heap.size.max", configValue: "-Xmx256m",
      errorCounts: [720000, 19800, 278, 14],
    },
    {
      companyName: "MediaPulse", serviceName: "video-processor", hostName: "k8s-worker-11",
      processGroup: "PROCESS_GROUP-A1C5", hostId: "HOST-FF3355AA",
      errorTimestamp: "day 3", deploymentVersion: "v1.5.3",
      ipAddresses: ["172.16.0.8"], statusCodes: [200],
      errorMessages: ["OutOfMemoryError", "GC collecting too frequently"],
      configKey: "container.memory.limit", configValue: "512Mi (JVM not configured)",
      errorCounts: [1020000, 31200, 401, 22],
    },
  ],
  rootCause: "{{serviceName}}: JVM heap not configured for container memory limits. Garbage collection pauses increasing over 3 days as heap fills.",
  postMortem: "The container had 4GB of memory but the JVM was configured with a small default heap. Over 3 days it slowly filled, causing GC to work harder and harder. No crashes — GC kept rescuing it — but each rescue took longer. Root fix: set -Xmx to 70% of container memory limit.",
  commandsUnlocked: ["from:now()-Nd", "contains()", "fieldsAdd", "now()"],
};
