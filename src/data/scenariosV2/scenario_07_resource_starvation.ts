import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "{{companyName}}'s GPU inference cluster serves ML model predictions to production applications. Davis AI has been firing problem alerts all week, but the on-call team has been dismissing them as noise. 47 problems in 7 days is not noise — that's a systemic failure. Davis stores its detected problems in a dedicated table, separate from logs.",
  clue: "Davis AI problem records aren't stored in the logs table. They live in their own dedicated table in Grail that you need to fetch from directly.",
  secondClue: "Davis AI has two dedicated tables: one for problems (multi-entity anomalies) and one for individual events. You need the problems table.",
  finalClue: "The Davis problems table is called `dt.davis.problems`. Use `fetch` with that table name and a 7-day window.",
  requiredConcepts: ["fetch dt.davis.problems"],
  validate(query: string) {
    const n = q(query);
    if (n.includes("fetch dt.davis.problems")) return { valid: true, partial: false, feedback: "Davis problems loaded. A week of pain laid bare." };
    if (n.includes("fetch dt.davis.events")) return { valid: false, partial: true, feedback: "Close — dt.davis.events captures events, but problems are in dt.davis.problems." };
    if (n.includes("fetch logs") && n.includes("davis")) return { valid: false, partial: true, feedback: "Davis problems aren't in the logs table. They have a dedicated data source: dt.davis.problems." };
    if (n.includes("fetch")) return { valid: false, partial: true, feedback: "Right approach with fetch. The Davis problems table has a specific name." };
    return { valid: false, partial: false, feedback: "Load the Davis AI problem records from their dedicated data source." };
  },
  mockRecordCount: 0,
  mockResultCount: 47,
  mockResultData: (): MockData => ({
    headers: ["display_id", "event.status", "event.name", "affected_entity_ids"],
    rows: [
      [{ value: "P-1441" }, { value: "ACTIVE", style: "error" }, { value: "High CPU saturation" }, { value: "[HOST-ABC, HOST-DEF]" }],
      [{ value: "P-1438" }, { value: "ACTIVE", style: "error" }, { value: "Response time degraded" }, { value: "[HOST-ABC]" }],
      [{ value: "P-1435" }, { value: "RESOLVED" }, { value: "Memory saturation" }, { value: "[HOST-ABC]" }],
    ],
  }),
  baseXP: 90,
  xpPerHint: 23,
  storyExplanation: "dt.davis.problems is Davis AI's problem record store. Each record represents an automatically detected anomaly. Key fields: display_id, event.status (ACTIVE/RESOLVED), event.name, affected_entity_ids (array of affected entities).",
  dqlLesson: `fetch dt.davis.problems, from:now()-7d
fetch dt.davis.events, from:now()-24h

// Davis Intelligence tables:
// dt.davis.problems — automatically detected problems (multi-entity)
// dt.davis.events — individual anomaly events
// Key fields: display_id, event.status, event.name, event.description
//             affected_entity_ids, resolved_problem_duration`,
  commandsShown: ["fetch dt.davis.problems", "fetch dt.davis.events"],
};

const step2 = {
  stepNumber: 2,
  narration: "47 Davis problems over 7 days — some are resolved, some still burning. The resolved ones are historical context. You need to see only what's still active right now to understand the current state of the cluster.",
  clue: "Not all 47 problems are still ongoing. Davis tracks the status of each problem. Focus only on the ones that haven't been resolved yet.",
  secondClue: "Each Davis problem record has a field that stores its current status — whether it's still active or has been resolved.",
  finalClue: "The status field is called `event.status`. Filter to the value that represents currently-active problems: `ACTIVE`.",
  requiredConcepts: ["filter", "event.status", "active"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch dt.davis.problems");
    const hasFilter = n.includes("event.status") && (n.includes('"active"') || n.includes("'active'"));
    if (hasFetch && hasFilter) return { valid: true, partial: false, feedback: "Active problems only. Still too many — need to dig deeper." };
    if (hasFetch && n.includes("event.status")) return { valid: false, partial: true, feedback: "event.status is right. Filter to the 'ACTIVE' value." };
    if (hasFetch && n.includes("filter")) return { valid: false, partial: true, feedback: "Filtering Davis problems — check the field that stores the problem's current status." };
    return { valid: false, partial: false, feedback: "Load Davis problems and filter to only the active ones." };
  },
  mockRecordCount: 47,
  mockResultCount: 23,
  mockResultData: (): MockData => ({
    headers: ["display_id", "event.name", "affected_entity_ids"],
    rows: [
      [{ value: "P-1441", style: "error" }, { value: "High CPU saturation", style: "error" }, { value: "[HOST-GPU01, HOST-GPU02]" }],
      [{ value: "P-1438", style: "error" }, { value: "Response time degraded" }, { value: "[HOST-GPU01]" }],
      [{ value: "P-1435", style: "error" }, { value: "Memory pressure" }, { value: "[HOST-GPU01]" }],
    ],
  }),
  baseXP: 85,
  xpPerHint: 21,
  storyExplanation: "event.status == \"ACTIVE\" filters to problems still being tracked by Davis. 23 active problems in one cluster is extremely high — this isn't noise, it's a systemic failure.",
  dqlLesson: `| filter event.status == "ACTIVE"
| filter event.status == "RESOLVED"

// Davis problem status values: ACTIVE, RESOLVED
// event.kind — problem type: AVAILABILITY, PERFORMANCE, ERROR, RESOURCE_CONTENTION
// display_id — human-readable ID like "P-1441" for war-room communication`,
  commandsShown: ["event.status", "display_id"],
};

const step3 = {
  stepNumber: 3,
  narration: "23 active Davis problems — and each one can affect multiple entities, stored as an array. To count how many problems each individual host is involved in, you first need to flatten those arrays: one problem affecting 3 hosts should become 3 separate rows, one per host.",
  clue: "The affected entities field contains an array — multiple entities per problem. To count problems per entity, you need one row per entity, not one row per problem.",
  secondClue: "DQL has a command that 'explodes' an array field — it takes one record with multiple values and creates multiple records, one per value.",
  finalClue: "The command is called `expand`. Specify the `affected_entity_ids` field as the argument to flatten the arrays.",
  requiredConcepts: ["expand", "affected_entity_ids"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch dt.davis.problems");
    const hasExpand = n.includes("expand") && n.includes("affected_entity_ids");
    if (hasFetch && hasExpand) return { valid: true, partial: false, feedback: "Array expanded. Each entity now has its own row. The pattern is becoming visible." };
    if (hasFetch && n.includes("expand")) return { valid: false, partial: true, feedback: "expand is right. Specify the field to expand: affected_entity_ids." };
    if (hasFetch && n.includes("affected_entity")) return { valid: false, partial: true, feedback: "You're targeting affected_entity_ids. Use expand to flatten the array into individual rows." };
    return { valid: false, partial: false, feedback: "The affected entities are in an array field. Expand it to get one row per entity." };
  },
  mockRecordCount: 23,
  mockResultCount: 71,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["display_id", "event.name", "affected_entity_ids"],
    rows: [
      [{ value: "P-1441" }, { value: "High CPU saturation" }, { value: v.hostId, style: "highlight" }],
      [{ value: "P-1441" }, { value: "High CPU saturation" }, { value: "HOST-GPU02" }],
      [{ value: "P-1438" }, { value: "Response time degraded" }, { value: v.hostId, style: "highlight" }],
      [{ value: "P-1435" }, { value: "Memory pressure" }, { value: v.hostId, style: "highlight" }],
    ],
  }),
  baseXP: 120,
  xpPerHint: 30,
  storyExplanation: "expand flattens an array field — one row becomes N rows, one per array element. 23 problems with arrays became 71 individual entity references. Now each entity can be counted separately.",
  dqlLesson: `| expand affected_entity_ids
| expand tags

// expand: flattens an array field into individual rows.
// One record with array[A, B, C] becomes three records with values A, B, C.
// All other fields are duplicated into each new row.
// Use after fetching dt.davis.problems to work with individual entities.`,
  commandsShown: ["expand"],
};

const step4 = {
  stepNumber: 4,
  narration: "71 individual entity references from 23 problems. Now find the root: which single entity appears in the most problems? That host is where the cascade originates — everything else is downstream noise from one failing node.",
  clue: "Count how many distinct problems each entity appears in. The entity with the highest count is the root cause.",
  secondClue: "This requires counting unique problem IDs grouped by entity. Use `summarize` to aggregate, but make sure you count distinct values to avoid double-counting.",
  finalClue: "Use `summarize` with `countDistinct(display_id)` grouped by `affected_entity_ids` using `by:{}`. Then `sort` descending.",
  requiredConcepts: ["summarize", "countDistinct", "by:", "sort"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch dt.davis.problems");
    const hasExpand = n.includes("expand") && n.includes("affected_entity_ids");
    const hasCountDistinct = n.includes("countdistinct(");
    const hasByEntity = n.includes("by:") && n.includes("affected_entity_ids");
    if (hasFetch && hasExpand && hasCountDistinct && hasByEntity) return { valid: true, partial: false, feedback: "Root entity found. One host is the epicenter of all 23 problems." };
    if (hasFetch && hasExpand && n.includes("count()") && hasByEntity) return { valid: false, partial: true, feedback: "count() would work but countDistinct(display_id) is more accurate — it avoids double-counting the same problem." };
    if (hasFetch && hasExpand && n.includes("summarize")) return { valid: false, partial: true, feedback: "summarize is right. Use countDistinct(display_id) grouped by affected_entity_ids." };
    return { valid: false, partial: false, feedback: "Expand the array, then count how many distinct problems each entity appears in." };
  },
  mockRecordCount: 71,
  mockResultCount: 8,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["affected_entity_ids", "count"],
    rows: [
      [{ value: v.hostId, style: "error" }, { value: "19", style: "error" }],
      [{ value: "HOST-GPU02" }, { value: "4" }],
      [{ value: "HOST-GPU03" }, { value: "2" }],
      [{ value: "HOST-APP01" }, { value: "1" }],
    ],
  }),
  baseXP: 130,
  xpPerHint: 33,
  storyExplanation: "One host (your GPU node) appears in 19 out of 23 active problems. This entity is the root — everything else is downstream cascade. countDistinct() counts unique values, preventing double-counting when the same entity appears in multiple problems.",
  dqlLesson: `| summarize count = countDistinct(display_id), by:{affected_entity_ids}
| summarize count = countDistinct(event.id)
| summarize {min(value), max(value), avg(value)}, by:{field}

// countDistinct(field): counts unique values of a field in each group.
// Prevents double-counting when the same value appears multiple times.
// Use count() for total records, countDistinct() for unique values.`,
  commandsShown: ["countDistinct()", "expand + summarize pattern"],
};

export const scenario07: ScenarioV2 = {
  id: "scenario_07_resource_starvation",
  difficulty: 4,
  stars: "★★★★☆",
  title: "The Resource Starvation",
  company: "{{companyName}}",
  briefing: "{{companyName}}'s GPU inference cluster is reporting intermittent timeouts. Davis has been firing problems all week but the team has been dismissing them as flaky alerts. Time to prove them wrong — and find the root cause.",
  steps: [step1, step2, step3, step4],
  variants: [
    {
      companyName: "OrbitAI", serviceName: "gpu-inference-01", hostName: "gpu-node-01",
      processGroup: "PROCESS_GROUP-GPU1", hostId: "HOST-GPU0101",
      errorTimestamp: "all week", deploymentVersion: "n/a",
      ipAddresses: ["10.0.11.5"], statusCodes: [],
      errorMessages: ["thermal throttling", "inference timeout"],
      configKey: "cooling.system.status", configValue: "degraded — fan RPM below threshold",
      errorCounts: [47, 23, 71, 19],
    },
    {
      companyName: "NeuralEdge", serviceName: "compute-node-03", hostName: "ml-node-03",
      processGroup: "PROCESS_GROUP-ML1", hostId: "HOST-ML0301",
      errorTimestamp: "all week", deploymentVersion: "n/a",
      ipAddresses: ["10.0.12.7"], statusCodes: [],
      errorMessages: ["CUDA out of memory", "compute timeout"],
      configKey: "thermal.throttle.temp", configValue: "95°C (danger threshold 85°C)",
      errorCounts: [52, 27, 84, 21],
    },
    {
      companyName: "InferTech", serviceName: "gpu-worker-07", hostName: "gpu-worker-07",
      processGroup: "PROCESS_GROUP-GPU2", hostId: "HOST-GPU0701",
      errorTimestamp: "all week", deploymentVersion: "n/a",
      ipAddresses: ["172.16.3.11"], statusCodes: [],
      errorMessages: ["throttle event", "latency spike"],
      configKey: "cooling.capacity", configValue: "40% (requires replacement)",
      errorCounts: [38, 19, 58, 16],
    },
  ],
  rootCause: "{{hostId}} is the root entity for 19 of 23 active Davis problems. Its cooling system degraded ({{configValue}}), causing thermal throttling, causing inference timeouts, cascading to all dependent services.",
  postMortem: "A single GPU node's cooling system degraded over several weeks. As temperatures rose, the hardware throttled compute capacity. Each throttle event caused inference timeouts, which cascaded into dependent services — but because there was no single catastrophic failure, the team kept dismissing Davis alerts as noise. Fix: add thermal threshold alerts at 80°C and automate node drain when triggered.",
  commandsUnlocked: ["fetch dt.davis.problems", "expand", "countDistinct()", "event.status"],
};
