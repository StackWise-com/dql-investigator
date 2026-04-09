import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "NovaTech's ENTIRE platform is down. Revenue: zero. Three teams point fingers at each other. The CEO is in the war room. With every service throwing errors, the first job is finding the epicenter — which single process group is generating the most errors. Everything else is downstream noise from that root failure.",
  clue: "Start with the broadest view: load all recent error logs and group them by service to find where the failure is concentrated.",
  secondClue: "You need to count errors per service. The field that identifies a service's Dynatrace entity is `dt.entity.process_group`. Group by that field.",
  finalClue: "Fetch logs, filter for `loglevel` ERROR, then use `summarize` with `count()` grouped `by:{dt.entity.process_group}`, then `sort` descending.",
  requiredConcepts: ["fetch logs", "filter loglevel", "summarize", "by:dt.entity.process_group"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasFilter = n.includes("loglevel") && (n.includes('"error"') || n.includes("'error'"));
    const hasSummarize = n.includes("summarize") && n.includes("count()");
    const hasByPG = n.includes("dt.entity.process_group") && n.includes("by:");
    if (hasFetch && hasFilter && hasSummarize && hasByPG) return { valid: true, partial: false, feedback: "Epicenter found. One process group dominates." };
    if (hasFetch && hasFilter && hasSummarize) return { valid: false, partial: true, feedback: "Good summarize. Group by dt.entity.process_group to identify the service." };
    if (hasFetch && hasFilter) return { valid: false, partial: true, feedback: "Error filter is right. Now aggregate to find which service has the most errors." };
    return { valid: false, partial: false, feedback: "Load error logs and find the service with the highest error count." };
  },
  mockRecordCount: 0,
  mockResultCount: 5,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["dt.entity.process_group", "count()"],
    rows: [
      [{ value: v.processGroup, style: "highlight" }, { value: String(v.errorCounts[0]), style: "error" }],
      [{ value: "PROCESS_GROUP-1B7E" }, { value: String(v.errorCounts[1]), style: "error" }],
      [{ value: "PROCESS_GROUP-C4D1" }, { value: String(v.errorCounts[2]), style: "warn" }],
      [{ value: "PROCESS_GROUP-9E3A" }, { value: "312" }],
      [{ value: "PROCESS_GROUP-5F0B" }, { value: "47" }],
    ],
  }),
  baseXP: 120,
  xpPerHint: 30,
  storyExplanation: "The epicenter is clear — one process group accounts for the vast majority of errors. Everything else is downstream cascade. Start at the root, not the smoke.",
  dqlLesson: `fetch logs, from:-2h
| filter loglevel == "ERROR"
| summarize count(), by:{dt.entity.process_group}
| sort \`count()\` desc

// Pattern: fetch → filter → summarize → sort
// This 4-command pipeline answers "what is generating the most errors?"
// in seconds. The most fundamental DQL incident-response pattern.`,
  commandsShown: ["fetch→filter→summarize→sort pattern"],
};

const step2 = {
  stepNumber: 2,
  narration: "Epicenter identified — one process group accounts for the overwhelming majority of errors. Zoom in: fetch logs from that specific service, parse the HTTP status codes embedded in the content, and count by status to understand whether this is a 503 (upstream down), 500 (internal error), or 429 (rate limited).",
  clue: "The HTTP status codes that reveal the failure type are embedded as integers in the content text — not in a separate field. Extract them first, then count.",
  secondClue: "Use `parse` with DPL to extract the integer status code. `LD` skips any text, `INT:` captures an integer with a name you choose.",
  finalClue: "Filter to the epicenter's `dt.entity.process_group`, then `parse` the content with `LD` and `INT:httpstatus`, then `summarize count()` grouped `by:{httpstatus}`.",
  requiredConcepts: ["filter dt.entity.process_group", "parse", "int:", "summarize by:httpstatus"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasProcessGroup = n.includes("dt.entity.process_group");
    const hasParse = n.includes("parse") && n.includes("int:");
    const hasSummarize = n.includes("summarize") && n.includes("count()");
    if (hasFetch && hasProcessGroup && hasParse && hasSummarize) return { valid: true, partial: false, feedback: "Status breakdown: 503 dominates. Upstream dependency down." };
    if (hasFetch && hasProcessGroup && hasParse) return { valid: false, partial: true, feedback: "Parsed correctly. Now aggregate the status codes." };
    if (hasFetch && hasProcessGroup) return { valid: false, partial: true, feedback: "Scoped to the epicenter. Now extract and count HTTP status codes from the content." };
    return { valid: false, partial: false, feedback: "Scope to the epicenter, parse HTTP status codes, count by status." };
  },
  mockRecordCount: 5,
  mockResultCount: 3,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["httpstatus", "count()"],
    rows: [
      [{ value: "503", style: "error" }, { value: String(v.errorCounts[3]), style: "error" }],
      [{ value: "500", style: "error" }, { value: String(v.errorCounts[4]), style: "error" }],
      [{ value: "429", style: "warn" }, { value: "189", style: "warn" }],
    ],
  }),
  baseXP: 140,
  xpPerHint: 35,
  storyExplanation: "503 Service Unavailable — this service can't reach something upstream. It's not broken itself, it's being starved. The 503 is a symptom; the cause is further up the chain.",
  dqlLesson: `fetch logs, from:-2h
| filter dt.entity.process_group == "PROCESS_GROUP-8A2F"
| parse content, "LD 'HTTP_STATUS ' INT:httpstatus"
| filter httpstatus >= 400
| summarize count(), by:{httpstatus}

// DPL: LD = skip any chars, INT:name = capture integer
// Filter parsed fields just like any other field.`,
  commandsShown: ["parse + summarize pipeline"],
};

const step3 = {
  stepNumber: 3,
  narration: "503s confirm this service is being refused by something upstream. The actual error messages in the logs will name the refusing service — connection refused errors always include the target host and port that couldn't be reached.",
  clue: "The 503s mean this service can't reach something upstream. The error messages embedded in the logs will name which service is refusing connections.",
  secondClue: "Search the log content for the specific phrase that appears when a TCP connection is refused. That phrase will identify the target service.",
  finalClue: "Use `contains()` or `matchesPhrase()` to filter for log content containing 'connection refused'.",
  requiredConcepts: ["filter contains", "connection refused"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasContains = (n.includes("contains(") || n.includes("matchesphrase(")) && (n.includes("connection") || n.includes("refused"));
    if (hasFetch && hasContains) return { valid: true, partial: false, feedback: "Target identified. All 503s trace back to one upstream service." };
    if (hasFetch && n.includes("filter") && n.includes("error")) return { valid: false, partial: true, feedback: "Good error filter. Now add contains() or matchesPhrase() to find connection-related messages specifically." };
    return { valid: false, partial: false, feedback: "Find the connection refused messages to identify the upstream failure." };
  },
  mockRecordCount: 3,
  mockResultCount: 847,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "content"],
    rows: [
      [{ value: v.errorTimestamp }, { value: `ERROR connecting to ${v.serviceName}:8443 — Connection refused`, style: "error" }],
      [{ value: v.errorTimestamp }, { value: `ERROR retry exhausted for ${v.serviceName}:8443`, style: "error" }],
      [{ value: v.errorTimestamp }, { value: `ERROR circuit breaker OPEN for ${v.serviceName}`, style: "warn" }],
    ],
  }),
  baseXP: 120,
  xpPerHint: 30,
  storyExplanation: "All connection refused errors point to the same upstream service. The circuit breaker has opened — meaning the client service gave up retrying. This is the true failing service.",
  dqlLesson: `| filter contains(content, "connection refused")
| filter matchesPhrase(content, "connection refused")

// contains() and matchesPhrase() are equivalent for substring matching.
// Use either — they produce the same result for phrase searches.`,
  commandsShown: ["contains() for error patterns"],
};

const step4 = {
  stepNumber: 4,
  narration: "Upstream service identified — it's refusing all connections. Services don't die at 3 AM without a reason. Deployments are the most common cause. The deployment record is in the events table — not in the logs. Check if a deployment happened on the failing upstream service right before the outage.",
  clue: "Services don't fail at 3 AM without a trigger. Deployments are the most common cause — and they're recorded as events, not as log records.",
  secondClue: "Deployment events are in the events data source, not logs. Filter by event type — there are multiple deployment-related event types to check.",
  finalClue: "Fetch from `events`. Use `in()` with `array()` to filter for `CUSTOM_DEPLOYMENT` and `MARKED_FOR_TERMINATION` event types. Filter by the upstream service name.",
  requiredConcepts: ["fetch events", "in(", "array(", "custom_deployment"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch events");
    const hasIn = n.includes("in(") && n.includes("array(");
    const hasSQLIn = /\bevent\.type\s+in\s+\(/.test(n);
    if (hasFetch && hasSQLIn) return { valid: false, partial: true, feedback: "⚠️ in() is a FUNCTION in DQL. Write: filter in(event.type, array(\"CUSTOM_DEPLOYMENT\", ...))" };
    if (hasFetch && hasIn) return { valid: true, partial: false, feedback: "Deployment found. Timeline: deploy at 03:41, errors cascade at 03:43. This is it." };
    if (hasFetch && n.includes("event.type")) return { valid: false, partial: true, feedback: "event.type is right. Use in(event.type, array(...)) to match multiple event types." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Events loaded. Filter for deployment-type events on the upstream service." };
    return { valid: false, partial: false, feedback: "Check the events table for recent deployments to the failing service." };
  },
  mockRecordCount: 847,
  mockResultCount: 2,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "event.type", "event.name", "event.description"],
    rows: [
      [{ value: "03:41:02", style: "highlight" }, { value: "CUSTOM_DEPLOYMENT", style: "highlight" }, { value: `${v.serviceName} ${v.deploymentVersion}`, style: "highlight" }, { value: `Deployed by CI/CD pipeline #${v.errorCounts[5]}` }],
      [{ value: "03:41:15" }, { value: "MARKED_FOR_TERMINATION", style: "warn" }, { value: `${v.serviceName} (prev)` }, { value: "Old version terminating" }],
    ],
  }),
  baseXP: 130,
  xpPerHint: 33,
  storyExplanation: "Deploy at 03:41, errors at 03:43. The 2-minute gap is the service startup time before it failed its health check. The deployment is the root cause.",
  dqlLesson: `fetch events, from:-3h
| filter in(event.type, array("CUSTOM_DEPLOYMENT", "MARKED_FOR_TERMINATION"))
| filter contains(event.name, "payment")

// ⚠️ TRAP: in() is a function, not SQL keyword
// ✅ in(event.type, array("A", "B"))
// ❌ event.type IN ("A", "B")  ← SQL syntax, INVALID in DQL`,
  commandsShown: ["in() function recap"],
};

const step5 = {
  stepNumber: 5,
  narration: "Deployment at 03:41 confirmed. The errors started 2 minutes later — exactly the service startup time. Now anchor your investigation to the deployment window and load the startup logs to find what configuration broke.",
  clue: "You know the exact deployment timestamp. The startup failure logs are in the 4 minutes after that moment. Use a time range anchored to that exact moment.",
  secondClue: "The `from:` parameter accepts exact timestamps. Pinning your query to the deployment moment rather than 'last hour' is the forensic way to do post-incident analysis.",
  finalClue: "Use an absolute ISO 8601 timestamp in `from:` to anchor to the deployment moment. Add a `filter` for `loglevel` ERROR or FATAL.",
  requiredConcepts: ["fetch logs", "from:\"", "filter loglevel"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasAbsoluteTime = (n.includes("from:\"") || n.includes("from:'")) && (n.includes("t") || n.includes("z"));
    const hasFilter = n.includes("loglevel") && (n.includes('"error"') || n.includes('"fatal"') || n.includes("'fatal'"));
    if (hasFetch && hasAbsoluteTime && hasFilter) return { valid: true, partial: false, feedback: "Startup failure logs found. The config error is right there." };
    if (hasFetch && hasAbsoluteTime) return { valid: false, partial: true, feedback: "Good absolute timestamp. Filter to ERROR or FATAL severity to find the startup failure." };
    if (hasFetch && hasFilter) return { valid: false, partial: true, feedback: "Filter severity is right. Pin the time range to the deployment window using absolute timestamps." };
    return { valid: false, partial: false, feedback: "Load logs from the exact deployment window with absolute timestamps." };
  },
  mockRecordCount: 2,
  mockResultCount: 12,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "loglevel", "content"],
    rows: [
      [{ value: "03:41:08" }, { value: "FATAL", style: "error" }, { value: `${v.configKey}: ${v.configValue}`, style: "error" }],
      [{ value: "03:41:08" }, { value: "FATAL", style: "error" }, { value: "TLS handshake initialization failed", style: "error" }],
      [{ value: "03:41:09" }, { value: "ERROR", style: "error" }, { value: "Cannot bind to port 8443 — TLS context not initialized", style: "error" }],
      [{ value: "03:41:10" }, { value: "ERROR", style: "error" }, { value: "Health check endpoint unreachable — startup failed", style: "warn" }],
    ],
  }),
  baseXP: 140,
  xpPerHint: 35,
  storyExplanation: "The startup logs are unambiguous: the service failed to initialize TLS because the certificate path was wrong. Failed to bind the port. Health check failed. The service was never ready — upstream callers got 503s immediately.",
  dqlLesson: `fetch logs, from:"2026-04-09T03:41:00Z", to:"2026-04-09T03:45:00Z"
| filter contains(content, "payment-gateway")
| filter loglevel == "ERROR" or loglevel == "FATAL"

// Absolute time ranges are essential for post-incident forensics.
// Relative ranges drift — an absolute range is reproducible and shareable.`,
  commandsShown: ["absolute time forensics"],
};

const step6 = {
  stepNumber: 6,
  narration: "FATAL startup logs found — the service couldn't initialize. The error messages contain embedded JSON objects with the exact config key and value that caused the failure. Extract those JSON payloads to pinpoint the specific misconfiguration.",
  clue: "The error messages contain JSON objects with specific config details — the exact key and value that was wrong. Extract those JSON payloads from the content field.",
  secondClue: "Use `parse` with the `JSON:` DPL matcher to extract the embedded JSON. Once extracted into a record field, access individual keys with bracket notation.",
  finalClue: "Use `parse content, \"LD JSON:details\"`, then `fieldsAdd` with `details[error]` and `details[config_key]` using bracket notation to extract the specific fields.",
  requiredConcepts: ["parse json:", "fieldsAdd", "details[", "bracket notation"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasJSON = n.includes("json:") && n.includes("parse");
    const hasFieldsAdd = n.includes("fieldsadd") || n.includes("fields");
    const hasBracket = n.includes("details[") || (n.includes("[") && n.includes("details"));
    if (hasFetch && hasJSON && hasFieldsAdd && hasBracket) return { valid: true, partial: false, feedback: "Root cause extracted. The config key is clear." };
    if (hasFetch && hasJSON && hasFieldsAdd) return { valid: false, partial: true, feedback: "Good JSON parse. Use bracket notation to extract fields: details[error], details[config_key]." };
    if (hasFetch && hasJSON) return { valid: false, partial: true, feedback: "JSON parsed into 'details'. Now extract specific fields using fieldsAdd with bracket notation." };
    if (hasFetch && n.includes("parse")) return { valid: false, partial: true, feedback: "parse is right. Use the JSON: matcher: parse content, \"LD JSON:details\"" };
    return { valid: false, partial: false, feedback: "Parse the embedded JSON from the content and extract the config error fields." };
  },
  mockRecordCount: 12,
  mockResultCount: 12,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "error", "config_key", "config_value"],
    rows: [
      [{ value: "03:41:08" }, { value: "file not found", style: "error" }, { value: v.configKey, style: "highlight" }, { value: v.configValue, style: "error" }],
      [{ value: "03:41:08" }, { value: "TLS init failed", style: "error" }, { value: v.configKey, style: "highlight" }, { value: v.configValue, style: "error" }],
    ],
  }),
  baseXP: 160,
  xpPerHint: 40,
  storyExplanation: "The config key and its wrong value are extracted. This is the smoking gun: a wrong TLS certificate path in the deployment config. One typo in one YAML file took down an entire platform.",
  dqlLesson: `| parse content, "LD JSON:details"
| fieldsAdd error = details[error]
| fieldsAdd cfg_key = details[config_key]
| fieldsAdd cfg_val = details[config_value]

// JSON: matcher extracts embedded JSON into a record object.
// Access fields with bracket notation: details[fieldName]
// NOT dot notation (details.fieldName is INVALID)`,
  commandsShown: ["parse JSON: + bracket notation"],
};

const step7 = {
  stepNumber: 7,
  narration: "Root cause identified. The CEO needs a visual — one chart showing the blast radius over time. Build a per-minute error timeseries covering the deployment window to show exactly how fast 8 errors per minute became 2,891.",
  clue: "Build a per-minute timeline of errors from the epicenter process group. This is the CEO's chart — it needs to show the before, spike, and after.",
  secondClue: "DQL has a command for converting raw log records into time-bucketed series. It produces intervals rather than individual records.",
  finalClue: "Use `makeTimeseries` with `countIf(loglevel == \"ERROR\")` and `interval:1m` for 1-minute buckets.",
  requiredConcepts: ["makeTimeseries", "countIf", "interval:1m"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasMakeTS = n.includes("maketimeseries");
    const hasInterval = n.includes("interval:");
    if (n.includes("timeseries") && !hasMakeTS) return { valid: false, partial: true, feedback: "⚠️ Use makeTimeseries (for logs) not timeseries (for metrics)." };
    if (hasFetch && hasMakeTS && hasInterval) return { valid: true, partial: false, feedback: "CASE CLOSED. Timeline shows 240x amplification in 4 minutes. The CEO has their answer." };
    if (hasFetch && hasMakeTS) return { valid: false, partial: true, feedback: "makeTimeseries is right. Add interval:1m to bucket by minute." };
    return { valid: false, partial: false, feedback: "Build a per-minute timeseries of the error cascade." };
  },
  mockRecordCount: 12,
  mockResultCount: 15,
  mockResultData: (): MockData => ({
    headers: ["timeframe", "errors"],
    rows: [
      [{ value: "03:39–03:40" }, { value: "8" }],
      [{ value: "03:40–03:41" }, { value: "12" }],
      [{ value: "03:41–03:42" }, { value: "34", style: "warn" }],
      [{ value: "03:42–03:43" }, { value: "187", style: "warn" }],
      [{ value: "03:43–03:44", style: "highlight" }, { value: "1,204", style: "error" }],
      [{ value: "03:44–03:45" }, { value: "2,891", style: "error" }],
    ],
  }),
  baseXP: 200,
  xpPerHint: 50,
  storyExplanation: "The timeline is the proof: 8 errors/min at 03:40, 2,891 at 03:44 — a 240x amplification in 4 minutes. Deploy at 03:41 is the inflection point. One wrong config value. One failed service. An entire platform brought down. That's cascading failure.",
  dqlLesson: `| makeTimeseries errors = countIf(loglevel == "ERROR"), interval:1m

// makeTimeseries: final weapon for showing impact over time.
// Shows the CEO the blast radius in one chart.
// interval:1m = 1-minute buckets. Use 5m for longer windows.
// Combine with by:{field} to show breakdown by service.`,
  commandsShown: ["makeTimeseries for incident timelines"],
};

export const scenario10: ScenarioV2 = {
  id: "scenario_10_cascading_catastrophe",
  difficulty: 5,
  stars: "★★★★★",
  title: "The Cascading Catastrophe",
  company: "NovaTech",
  briefing: "NovaTech's ENTIRE platform is down. Revenue: zero. The CEO is in the war room. Three teams are pointing fingers at each other. You have 10 minutes of DQL to find the single root cause and end the blame game.",
  steps: [step1, step2, step3, step4, step5, step6, step7],
  variants: [
    {
      companyName: "NovaTech", serviceName: "payment-gateway", hostName: "prod-pay-01",
      processGroup: "PROCESS_GROUP-8A2F", hostId: "HOST-DD5679D1",
      errorTimestamp: "03:41:08", deploymentVersion: "v3.8.1",
      ipAddresses: ["10.0.1.42"], statusCodes: [503],
      errorMessages: ["TLS cert path not found", "cannot bind port 8443"],
      configKey: "tls.cert.path", configValue: "/etc/pki/tls/certs/payment-gw.pem: No such file",
      errorCounts: [4287, 1943, 856, 3412, 641, 4471, 12],
    },
    {
      companyName: "NovaTech", serviceName: "auth-service", hostName: "prod-auth-02",
      processGroup: "PROCESS_GROUP-C7B1", hostId: "HOST-AB12CD34",
      errorTimestamp: "03:41:12", deploymentVersion: "v2.14.0",
      ipAddresses: ["10.0.1.55"], statusCodes: [503],
      errorMessages: ["JWT signing key not found", "cannot initialize auth context"],
      configKey: "jwt.signing.key.path", configValue: "/etc/secrets/jwt.pem: No such file",
      errorCounts: [3891, 1720, 745, 3012, 579, 4489, 9],
    },
    {
      companyName: "NovaTech", serviceName: "order-processor", hostName: "prod-order-03",
      processGroup: "PROCESS_GROUP-F4E2", hostId: "HOST-EF56GH78",
      errorTimestamp: "03:41:19", deploymentVersion: "v5.0.3",
      ipAddresses: ["10.0.1.67"], statusCodes: [503],
      errorMessages: ["DB connection string invalid", "startup failed: cannot reach postgres"],
      configKey: "db.connection.string", configValue: "jdbc:postgresql://undefined-host:5432/orders",
      errorCounts: [5102, 2241, 1012, 4103, 712, 4502, 14],
    },
  ],
  rootCause: "{{serviceName}} {{deploymentVersion}} shipped with wrong {{configKey}}: {{configValue}}. Service couldn't initialize, failed to bind port, health checks failed, upstream services cascaded to 503, circuit breakers opened — entire checkout flow collapsed.",
  postMortem: "A CI/CD pipeline deployed a new version with an incorrect config value. The service passed basic startup health checks (HTTP 200 on /health) before trying to initialize TLS/auth/DB — so the pipeline marked it 'success'. Actual failures came 42 seconds later when real requests arrived. Fix: add deep health checks verifying all critical dependencies before marking a deploy successful.",
  commandsUnlocked: ["full DQL incident pipeline", "all commands combined"],
};
