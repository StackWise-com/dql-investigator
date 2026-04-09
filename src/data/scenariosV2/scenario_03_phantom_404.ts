import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "{{companyName}}'s {{serviceName}} serves appointment booking and medical records to patients. There's a sudden spike in 404 errors — pages the engineers know exist are returning 'Not Found'. The dev team swears nothing changed. The logs hold the answer, but all services emit to the same Grail store — you need to scope immediately to the right process group.",
  clue: "Grail holds logs from every service in the environment. To avoid drowning in unrelated logs, scope your query immediately to the specific service that's showing 404s.",
  secondClue: "Dynatrace automatically tags every log record with the entity ID of the process group that emitted it. This lets you filter to a single service without knowing its hostname.",
  finalClue: "The field that holds the process group entity identifier is called `dt.entity.process_group`. Filter to the portal's process group ID.",
  requiredConcepts: ["fetch logs", "filter", "dt.entity.process_group"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasProcessGroup = n.includes("dt.entity.process_group");
    if (hasFetch && hasProcessGroup) return { valid: true, partial: false, feedback: "Portal logs loaded and scoped to the right process group." };
    if (hasFetch && n.includes("filter")) return { valid: false, partial: true, feedback: "You're filtering. Scope to the portal's entity — use the process group field." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Good. Now scope to the portal process group to filter out unrelated services." };
    return { valid: false, partial: false, feedback: "Load the portal's log records first." };
  },
  mockRecordCount: 0,
  mockResultCount: 18400,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "dt.entity.process_group", "content"],
    rows: [
      [{ value: v.errorTimestamp }, { value: v.processGroup, style: "highlight" }, { value: "GET /dashboard 200 OK" }],
      [{ value: v.errorTimestamp }, { value: v.processGroup, style: "highlight" }, { value: "GET /assets/app.js 404 Not Found", style: "error" }],
      [{ value: v.errorTimestamp }, { value: v.processGroup, style: "highlight" }, { value: "GET /assets/styles.css 404 Not Found", style: "error" }],
    ],
  }),
  baseXP: 70,
  xpPerHint: 18,
  storyExplanation: "dt.entity.process_group is the Dynatrace entity ID for a process group. Every log emitted by that process carries this field automatically. Using it as a filter immediately scopes your investigation to one service.",
  dqlLesson: `fetch logs, from:-1h
| filter dt.entity.process_group == "PROCESS_GROUP-8A2F"
| filter dt.entity.host == "HOST-DD5679D1"

// dt.entity.* fields are Dynatrace-managed entity references.
// They appear on logs, spans, and events automatically.
// Use them to scope queries to a specific service, host, or container.`,
  commandsShown: ["dt.entity.process_group", "dt.entity.host"],
};

const step2 = {
  stepNumber: 2,
  narration: "{{companyName}}'s portal logs are in view — 18,400 records from the affected process group. The HTTP status codes aren't in a dedicated field; they're embedded as integers inside the log message text. To analyze the 404 distribution, you first need to extract them into queryable fields.",
  clue: "The HTTP status code is buried inside the log message text — not in its own field. To count or filter by status code, you first need to extract it into a separate field.",
  secondClue: "DQL has a command for extracting structured values from unstructured text. It uses a purpose-built pattern language — not regular expressions.",
  finalClue: "The command is called `parse`. It uses DPL (Dynatrace Pattern Language). `LD` skips any characters. `INT:` captures an integer and names it. Combine them to skip to the status code.",
  requiredConcepts: ["parse", "content", "int:"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasParse = n.includes("parse") && n.includes("content");
    const hasINT = n.includes("int:");
    if (hasFetch && hasParse && hasINT) return { valid: true, partial: false, feedback: "HTTP status codes extracted into a new field. Records split open to reveal the parsed data." };
    if (hasFetch && hasParse && n.includes("\\d")) return { valid: false, partial: true, feedback: "⚠️ DPL doesn't support regex. \\d is not valid. Use INT: to capture an integer instead." };
    if (hasFetch && hasParse) return { valid: false, partial: true, feedback: "parse is right. Use INT: (not regex) to capture the integer status code from the content." };
    if (hasFetch && n.includes("parse")) return { valid: false, partial: true, feedback: "parse needs to work on the content field. Specify: parse content, \"<pattern>\"" };
    return { valid: false, partial: false, feedback: "The status codes are inside the log message text. You need to parse them out." };
  },
  mockRecordCount: 18400,
  mockResultCount: 18400,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "httpstatus", "content"],
    rows: [
      [{ value: v.errorTimestamp }, { value: "200" }, { value: "GET /dashboard 200 OK" }],
      [{ value: v.errorTimestamp }, { value: "404", style: "error" }, { value: "GET /assets/app.js 404 Not Found", style: "error" }],
      [{ value: v.errorTimestamp }, { value: "404", style: "error" }, { value: "GET /assets/styles.css 404 Not Found", style: "error" }],
      [{ value: v.errorTimestamp }, { value: "404", style: "error" }, { value: "GET /static/vendor.js 404 Not Found", style: "error" }],
    ],
  }),
  baseXP: 100,
  xpPerHint: 25,
  storyExplanation: "parse extracts structure from unstructured text using DPL (Dynatrace Pattern Language). LD is 'lazy line data' — skips any characters until the next pattern. INT: captures an integer and names it. The colon means 'name this capture'. DPL is NOT regex — no \\d, [0-9], or .* patterns.",
  dqlLesson: `| parse content, "LD 'HTTP_STATUS ' INT:httpstatus"
| parse content, "LD INT:httpstatus LD"
| parse content, "LD 'userId=' LD:userId ', productId=' LD:productId"

// DPL matchers (NOT regex):
// LD    = Line Data — any chars, lazy (stops at next pattern)
// INT   = integer
// LONG  = long integer
// WORD  = word (no spaces)
// IPADDR = IP address
// JSON  = JSON object
// STRING = quoted string
// Colon after matcher names the captured value: INT:httpstatus`,
  commandsShown: ["parse", "DPL matchers"],
};

const step3 = {
  stepNumber: 3,
  narration: "Status codes are now extracted into their own field. {{companyName}}'s portal is generating 18,400 requests per hour — a mix of 200s and 404s. To understand the scope of the 404 problem, you need to collapse these records into a count-per-status-code summary.",
  clue: "You need a summary showing how many times each HTTP status code appears — not all 18,400 individual records. This is an aggregation.",
  secondClue: "DQL has a command for collapsing many records into grouped summaries. You can count records and group them by any field.",
  finalClue: "The aggregation command is called `summarize`. Use `count()` to count records. Use `by:{}` with curly braces — not parentheses — to specify the grouping field.",
  requiredConcepts: ["summarize", "count()", "by:"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasParse = n.includes("parse") && n.includes("int:");
    const hasSummarize = n.includes("summarize") && n.includes("count()");
    const hasBy = n.includes("by:") && n.includes("{");
    if (hasFetch && hasParse && hasSummarize && hasBy) return { valid: true, partial: false, feedback: "Status code breakdown complete. 404 is massively dominant." };
    if (hasFetch && hasParse && hasSummarize) return { valid: false, partial: true, feedback: "summarize count() is right. Now group with by:{fieldname} using curly braces." };
    if (hasFetch && n.includes("summarize")) return { valid: false, partial: true, feedback: "⚠️ summarize needs 'count()' and 'by:{field}' — also make sure you've parsed the status code first." };
    if (hasFetch && hasParse) return { valid: false, partial: true, feedback: "Status codes parsed. Now aggregate them to see the distribution." };
    return { valid: false, partial: false, feedback: "Parse the status code, then count how many records have each code." };
  },
  mockRecordCount: 18400,
  mockResultCount: 4,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["httpstatus", "count()"],
    rows: [
      [{ value: "404", style: "error" }, { value: String(v.errorCounts[0]), style: "error" }],
      [{ value: "200" }, { value: String(v.errorCounts[1]) }],
      [{ value: "304" }, { value: String(v.errorCounts[2]) }],
      [{ value: "500", style: "warn" }, { value: "23", style: "warn" }],
    ],
  }),
  baseXP: 90,
  xpPerHint: 23,
  storyExplanation: "summarize count(), by:{httpstatus} collapses all records into one row per unique httpstatus value. The records magnetically attract into clusters. 14,200 404s vs 4,100 200s — the site is mostly 404s right now.",
  dqlLesson: `| summarize count(), by:{httpstatus}
| summarize count(), by:{loglevel}
| summarize count(), by:{dt.entity.process_group}
| summarize {count(), avg(duration)}, by:{service}

// summarize: aggregate records into groups
// count() — counts all records in each group
// by:{field} — the grouping field (CURLY BRACES required, not parentheses)
// ⚠️ DQL trap: "GROUP BY field" is SQL syntax. In DQL it's by:{field}`,
  commandsShown: ["summarize", "count()", "by:{}"],
};

export const scenario03: ScenarioV2 = {
  id: "scenario_03_phantom_404",
  difficulty: 2,
  stars: "★★☆☆☆",
  title: "The Phantom 404",
  company: "{{companyName}}",
  briefing: "{{companyName}}'s patient portal shows a spike in 404 errors. The dev team swears nothing changed. The pages exist. So where are the 404s coming from?",
  steps: [step1, step2, step3],
  variants: [
    {
      companyName: "NexaHealth", serviceName: "patient-portal", hostName: "prod-portal-02",
      processGroup: "PROCESS_GROUP-5C8D", hostId: "HOST-11AA22BB",
      errorTimestamp: "14:22:07.334", deploymentVersion: "v6.2.0",
      ipAddresses: ["10.0.5.8"], statusCodes: [404, 200],
      errorMessages: ["GET /assets/app.js 404", "GET /static/vendor.js 404"],
      configKey: "cdn.origin.path", configValue: "/assets-v6 (was /assets)",
      errorCounts: [14231, 4109, 892],
    },
    {
      companyName: "MediConnect", serviceName: "patient-portal", hostName: "web-server-portal-01",
      processGroup: "PROCESS_GROUP-9A1F", hostId: "HOST-33CC44DD",
      errorTimestamp: "09:45:12.771", deploymentVersion: "v3.1.4",
      ipAddresses: ["10.0.6.14"], statusCodes: [404, 200],
      errorMessages: ["GET /dist/main.js 404", "GET /dist/styles.css 404"],
      configKey: "static.files.path", configValue: "/dist-v3 (was /dist)",
      errorCounts: [11870, 3820, 741],
    },
    {
      companyName: "HealthGrid", serviceName: "portal-frontend", hostName: "dc1-web-03",
      processGroup: "PROCESS_GROUP-B2E7", hostId: "HOST-55EE66FF",
      errorTimestamp: "16:08:44.221", deploymentVersion: "v8.0.1",
      ipAddresses: ["192.168.2.33"], statusCodes: [404, 200],
      errorMessages: ["GET /build/app.js 404", "GET /build/vendor.js 404"],
      configKey: "build.output.dir", configValue: "/build-v8 (was /build)",
      errorCounts: [16540, 5230, 1102],
    },
  ],
  rootCause: "CDN cache invalidation wiped all cached {{serviceName}} assets. Static file requests hit the origin which returned 404 because the build artifacts were at the new path {{configValue}}.",
  postMortem: "A CDN cache invalidation was triggered (separately from the deploy) and wiped all cached static assets. When browsers re-requested them, they hit the origin server which had been updated to serve files from a new path — but that path hadn't been announced to the CDN config. Fix: update CDN origin path config to match new build output directory.",
  commandsUnlocked: ["parse (DPL)", "INT:", "LD", "summarize", "by:{}"],
};
