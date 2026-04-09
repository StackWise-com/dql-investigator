import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "{{companyName}} deploys microservices every night at 2 AM via an automated CI/CD pipeline. This morning three services are down. The pipeline dashboard says 'success' for every job. The evidence isn't in the logs — deployments, config changes, and lifecycle transitions are tracked separately in Dynatrace's event store.",
  clue: "Deployments are not logged as application log records — they're recorded as events in a different part of Dynatrace. You need to query a different data source.",
  secondClue: "Dynatrace tracks deployments, config changes, and health transitions in a separate table. The fetch command can load from this table by name.",
  finalClue: "The data source for deployment and lifecycle events is called `events`. Use `fetch events` instead of `fetch logs`.",
  requiredConcepts: ["fetch events"],
  validate(query: string) {
    const n = q(query);
    if (n.includes("fetch events")) return { valid: true, partial: false, feedback: "Events loaded. Deployments, config changes, lifecycle events — all visible." };
    if (n.includes("fetch logs")) return { valid: false, partial: true, feedback: "Close — but deployments aren't in the logs table. They're in a separate events data source." };
    if (n.includes("fetch")) return { valid: false, partial: true, feedback: "Right idea with fetch. The data source you need is for events, not logs." };
    return { valid: false, partial: false, feedback: "This investigation needs a different data source than logs. Think about where deployments are recorded." };
  },
  mockRecordCount: 0,
  mockResultCount: 340,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "event.type", "event.name"],
    rows: [
      [{ value: "02:01:02" }, { value: "CUSTOM_DEPLOYMENT", style: "warn" }, { value: `${v.serviceName} ${v.deploymentVersion}`, style: "highlight" }],
      [{ value: "02:01:15" }, { value: "MARKED_FOR_TERMINATION" }, { value: `${v.serviceName} (old version)` }],
      [{ value: "01:58:00" }, { value: "CUSTOM_DEPLOYMENT" }, { value: "inventory-service v1.2.0" }],
    ],
  }),
  baseXP: 75,
  xpPerHint: 19,
  storyExplanation: "fetch events loads Dynatrace event records — deployments, config changes, custom events sent via API, and lifecycle transitions. It's separate from fetch logs. Think of logs as what your application says, events as what Dynatrace observes happening.",
  dqlLesson: `fetch events
fetch events, from:-12h
fetch events, from:-24h, to:-1h

// Events capture: CUSTOM_DEPLOYMENT, PROCESS_RESTART, CONFIG_CHANGE,
// MARKED_FOR_TERMINATION, HEALTH_EVENT, and custom events via API.
// Key fields: event.type, event.name, event.description, event.status, timestamp`,
  commandsShown: ["fetch events", "event.type"],
};

const step2 = {
  stepNumber: 2,
  narration: "340 events from the last 12 hours span deployments, restarts, config changes, and health checks. You need only the deployment-related ones. In SQL you'd write `IN (\"A\", \"B\")` — but DQL handles multi-value matching differently, and getting it wrong is one of the most common DQL mistakes.",
  clue: "You need to match records where a field equals any one of several possible values. The SQL way of doing this doesn't work in DQL.",
  secondClue: "In DQL, multi-value matching is done with a function — not a keyword. The function wraps the field name and a list of values.",
  finalClue: "The function is called `in()`. It takes the field as the first argument and an `array()` of values as the second. Write: `filter in(event.type, array(\"VALUE1\", \"VALUE2\"))`.",
  requiredConcepts: ["filter", "in(", "array(", "custom_deployment"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch events");
    const hasIn = n.includes("in(") && n.includes("array(");
    const hasDeployment = n.includes("deployment");
    const hasSQLIn = /\bevent\.type\s+in\s+\(/.test(n) || /\bevent_type\s+in\s+\(/.test(n);
    if (hasFetch && hasSQLIn) return { valid: false, partial: true, feedback: "⚠️ DQL trap: in() is a FUNCTION, not a SQL keyword. Write: filter in(event.type, array(\"CUSTOM_DEPLOYMENT\", ...))" };
    if (hasFetch && hasIn && hasDeployment) return { valid: true, partial: false, feedback: "Deployment events filtered. The timeline narrows." };
    if (hasFetch && n.includes("event.type") && hasDeployment && !hasIn) return { valid: false, partial: true, feedback: "Good targeting of event.type. Use the in() function with array() to match multiple values." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Events loaded. Now filter to only deployment-related event types." };
    return { valid: false, partial: false, feedback: "Load events and filter for deployment events." };
  },
  mockRecordCount: 340,
  mockResultCount: 6,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "event.type", "event.name", "event.description"],
    rows: [
      [{ value: "02:01:02", style: "highlight" }, { value: "CUSTOM_DEPLOYMENT", style: "highlight" }, { value: `${v.serviceName} ${v.deploymentVersion}`, style: "highlight" }, { value: `Deployed by CI/CD pipeline run #${v.errorCounts[0]}` }],
      [{ value: "02:01:15" }, { value: "MARKED_FOR_TERMINATION", style: "warn" }, { value: `${v.serviceName} (prev)` }, { value: "Old version terminating" }],
      [{ value: "01:58:00" }, { value: "CUSTOM_DEPLOYMENT" }, { value: "inventory-service v1.2.0" }, { value: "Deployed by CI/CD pipeline run #4468" }],
    ],
  }),
  baseXP: 120,
  xpPerHint: 30,
  storyExplanation: "in(event.type, array(\"A\", \"B\")) filters to records where event.type matches any value in the array. This is a critical DQL distinction from SQL: in() is a FUNCTION. Writing 'event.type IN (...)' SQL-style will error. The array() function creates a literal array of values.",
  dqlLesson: `// ✅ CORRECT — in() as a function:
| filter in(event.type, array("CUSTOM_DEPLOYMENT", "MARKED_FOR_TERMINATION"))
| filter in(loglevel, array("ERROR", "FATAL"))

// ❌ WRONG — SQL-style IN keyword:
// | filter event.type IN ("CUSTOM_DEPLOYMENT")

// ❌ WRONG — missing array():
// | filter in(event.type, ("A", "B"))

// array() creates a literal array: array("val1", "val2", "val3")`,
  commandsShown: ["in()", "array()", "fetch events"],
};

const step3 = {
  stepNumber: 3,
  narration: "Deployment found at 02:01. Three services went down at 02:04. To connect them causally, you need error logs that appeared after the deployment — anchored to the exact deployment timestamp, not a relative window that might drift.",
  clue: "You know the exact moment the deployment happened. Now look at error logs that appeared after that specific moment — not 'the last hour', but a precise start time.",
  secondClue: "The `from:` parameter in `fetch` can accept an exact ISO 8601 timestamp instead of a relative offset. This anchors your query to a specific moment in time.",
  finalClue: "Use an exact timestamp in `from:` — quoted, in ISO 8601 format. Then add a `filter` for `loglevel` to show only failures.",
  requiredConcepts: ["fetch logs", "from:\"", "filter", "loglevel"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasAbsoluteTime = n.includes("from:\"") || (n.includes("from:") && n.match(/from:["\d]/));
    const hasFilter = n.includes("filter") && n.includes("loglevel");
    if (hasFetch && hasAbsoluteTime && hasFilter) return { valid: true, partial: false, feedback: "Post-deployment errors isolated. The cascade is visible." };
    if (hasFetch && hasAbsoluteTime) return { valid: false, partial: true, feedback: "Good absolute time range. Now filter the results to error-level logs." };
    if (hasFetch && n.includes("filter")) return { valid: false, partial: true, feedback: "Filtering is right. Pin the time range to start at the exact deployment moment." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Logs loaded. Narrow the window to start right when the deployment happened." };
    return { valid: false, partial: false, feedback: "Load error logs starting from the exact deployment timestamp." };
  },
  mockRecordCount: 6,
  mockResultCount: 2841,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "loglevel", "content"],
    rows: [
      [{ value: "02:01:44" }, { value: "ERROR", style: "error" }, { value: `${v.serviceName}: database connection refused — ${v.configKey}=${v.configValue}`, style: "error" }],
      [{ value: "02:01:45" }, { value: "ERROR", style: "error" }, { value: `${v.serviceName}: startup failed — unable to connect to DB`, style: "error" }],
      [{ value: "02:01:46" }, { value: "FATAL", style: "error" }, { value: `${v.serviceName}: health check failed — service is not ready`, style: "error" }],
      [{ value: "02:04:01" }, { value: "ERROR", style: "error" }, { value: "upstream service: connection refused to {{serviceName}}:8080", style: "error" }],
    ],
  }),
  baseXP: 110,
  xpPerHint: 28,
  storyExplanation: "Absolute timestamps let you forensically anchor your query to the exact incident moment. The errors begin 42 seconds after deployment — exactly the time it takes the service to fail its startup sequence. This timeline is the evidence that closes the case.",
  dqlLesson: `fetch logs, from:"2026-04-09T02:01:00Z"
fetch logs, from:"2026-04-09T02:01:00Z", to:"2026-04-09T02:10:00Z"
fetch logs, from:-30m, to:-15m

// Absolute ISO 8601 timestamps pin queries to exact moments.
// Critical for forensics — don't drift with 'from:-1h' when the incident
// happened at a known time.`,
  commandsShown: ["absolute timestamps", "from:\"...\""],
};

export const scenario04: ScenarioV2 = {
  id: "scenario_04_rogue_deployment",
  difficulty: 3,
  stars: "★★★☆☆",
  title: "The Rogue Deployment",
  company: "{{companyName}}",
  briefing: "{{companyName}} runs automated deployments every night at 2 AM. This morning three services are down. The deployment pipeline says 'success'. But something clearly went wrong — and the pipeline is covering its tracks.",
  steps: [step1, step2, step3],
  variants: [
    {
      companyName: "ArcLabs", serviceName: "analytics-api", hostName: "prod-api-03",
      processGroup: "PROCESS_GROUP-D4F8", hostId: "HOST-77BB88CC",
      errorTimestamp: "02:01:02", deploymentVersion: "v5.2.1",
      ipAddresses: ["10.0.7.19"], statusCodes: [503],
      errorMessages: ["DB connection refused", "startup failed"],
      configKey: "db.connection.string", configValue: "jdbc:postgresql://undefined:5432/analytics",
      errorCounts: [4471, 18400, 2841],
    },
    {
      companyName: "DataStack", serviceName: "reporting-service", hostName: "k8s-worker-04",
      processGroup: "PROCESS_GROUP-E5G9", hostId: "HOST-99DD00EE",
      errorTimestamp: "02:03:17", deploymentVersion: "v3.1.0",
      ipAddresses: ["10.0.8.31"], statusCodes: [503],
      errorMessages: ["Redis connection refused", "cache init failed"],
      configKey: "redis.cluster.host", configValue: "redis-undefined.internal",
      errorCounts: [4489, 21300, 3102],
    },
    {
      companyName: "InsightCo", serviceName: "dashboard-api", hostName: "dc3-app-07",
      processGroup: "PROCESS_GROUP-F6H0", hostId: "HOST-AA11BB22",
      errorTimestamp: "02:00:44", deploymentVersion: "v2.8.3",
      ipAddresses: ["172.16.1.44"], statusCodes: [500],
      errorMessages: ["config file not found", "startup aborted"],
      configKey: "config.file.path", configValue: "/etc/app/config-v2.yaml (missing)",
      errorCounts: [4462, 16800, 2290],
    },
  ],
  rootCause: "{{serviceName}} {{deploymentVersion}} was deployed with an incorrect {{configKey}}: {{configValue}}. Service starts, passes basic health check, then fails on actual connections.",
  postMortem: "The CI/CD pipeline's health check only verified the HTTP endpoint returned 200 — not that actual database connections worked. The deployment was marked 'success' before any real traffic hit the new version. Fix: add integration health checks that verify downstream connections before marking a deploy successful.",
  commandsUnlocked: ["fetch events", "in()", "array()", "absolute timestamps"],
};
