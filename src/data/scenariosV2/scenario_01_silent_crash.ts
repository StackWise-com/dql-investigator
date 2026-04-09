import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "{{companyName}}'s {{serviceName}} handles product listing requests for the mobile app. The app is showing a blank screen — no errors in Slack, no alerts fired, but customer complaints are flooding in. Grail holds logs from all services in the last 2 hours. The investigation starts where all investigations start: loading the evidence.",
  clue: "Every investigation begins by pulling the raw data into view. You need to load all recent log records from the storage engine before you can filter anything.",
  secondClue: "Dynatrace stores logs in a system called Grail. There's a specific command that loads data from Grail into your query — and it starts with the action you're taking.",
  finalClue: "The command that retrieves data is called `fetch`. The log data source is called `logs`. Put them together.",
  requiredConcepts: ["fetch logs"],
  validate(query: string) {
    const n = q(query);
    if (n.includes("fetch logs")) return { valid: true, partial: false, feedback: "Logs loaded. Thousands of records swirl into view." };
    if (n.includes("fetch")) return { valid: false, partial: true, feedback: "You're on the right track with 'fetch'. Specify what data source to load." };
    return { valid: false, partial: false, feedback: "Start with the command that loads data from Grail storage." };
  },
  mockRecordCount: 0,
  mockResultCount: 47000,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "loglevel", "content"],
    rows: [
      [{ value: v.errorTimestamp }, { value: "INFO" }, { value: `${v.serviceName}: request received` }],
      [{ value: v.errorTimestamp }, { value: "DEBUG" }, { value: `${v.serviceName}: cache miss` }],
      [{ value: v.errorTimestamp }, { value: "INFO" }, { value: `${v.serviceName}: response sent 200` }],
    ],
  }),
  baseXP: 50,
  xpPerHint: 13,
  storyExplanation: "fetch logs loads records from Dynatrace Grail storage. Think of it as opening the filing cabinet. By default it grabs the last 2 hours. You now have " + "{{errorCounts}}" + " records to investigate.",
  dqlLesson: `fetch logs
fetch logs, from:-2h
fetch logs, from:-24h, to:-1h
fetch logs, from:now()-3d

// fetch loads data from Grail. Always the first command in a DQL query.
// Supported sources: logs, spans, events, bizevents, dt.entity.*`,
  commandsShown: ["fetch logs"],
};

const step2 = {
  stepNumber: 2,
  narration: "{{companyName}}'s {{serviceName}} is returning HTTP 200 with empty payloads — the app receives a success response but renders nothing. {{mockRecordCount}} logs from all services are now loaded. Normal chatter (INFO, DEBUG) is drowning out the signal. Standard SRE practice: narrow to failures first.",
  clue: "Not every log record means trouble. Most are routine informational chatter. You need the ones that specifically signal a failure condition.",
  secondClue: "Dynatrace attaches a severity level to every log record. It's stored in a field that records whether the entry is informational, a warning, or an error.",
  finalClue: "The severity field is called `loglevel`. The command that keeps only matching records is called `filter`.",
  requiredConcepts: ["filter", "loglevel", "error"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasFilter = n.includes("filter") && n.includes("loglevel") && (n.includes('"error"') || n.includes("'error'"));
    if (hasFetch && hasFilter) return { valid: true, partial: false, feedback: "Filtered to errors. Non-matching records dissolve." };
    if (hasFetch && n.includes("filter") && n.includes("loglevel")) return { valid: false, partial: true, feedback: "Good — you're filtering on loglevel. Specify the severity level you're looking for." };
    if (hasFetch && n.includes("filter")) return { valid: false, partial: true, feedback: "You're filtering. The field that stores severity is called 'loglevel'." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Good start. Now narrow down to only the records showing failures." };
    return { valid: false, partial: false, feedback: "First load the logs, then narrow them down by severity." };
  },
  mockRecordCount: 47000,
  mockResultCount: 1847,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "loglevel", "content"],
    rows: [
      [{ value: v.errorTimestamp }, { value: "ERROR", style: "error" }, { value: `${v.serviceName}: null pointer in catalog response`, style: "error" }],
      [{ value: v.errorTimestamp }, { value: "ERROR", style: "error" }, { value: `${v.serviceName}: response body was empty`, style: "error" }],
      [{ value: v.errorTimestamp }, { value: "ERROR", style: "error" }, { value: `${v.serviceName}: failed to serialize product list`, style: "error" }],
    ],
  }),
  baseXP: 70,
  xpPerHint: 18,
  storyExplanation: "filter narrows your dataset to only matching records. loglevel is a standard field on every Dynatrace log record — it holds INFO, WARN, ERROR, FATAL, DEBUG, TRACE. One line took you from {{errorCounts}} records to a fraction of that.",
  dqlLesson: `| filter loglevel == "ERROR"
| filter loglevel == "WARN"
| filter loglevel == "FATAL"

// loglevel is a built-in Dynatrace field on every log record.
// Standard values: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
// filter keeps only records that match the condition — everything else dissolves.`,
  commandsShown: ["filter", "loglevel"],
};

const step3 = {
  stepNumber: 3,
  narration: "{{companyName}}'s {{serviceName}} is returning HTTP 200 with null payloads — the app shows a blank screen but no alert ever fired. Filtering for errors surfaced 1,847 records, but they come out in default order: oldest first. The oldest errors are from 2 hours ago when everything was still fine. You need the newest errors at the top — they show what's failing right now.",
  clue: "With hundreds of error records, you need to surface the most recent ones first. The default order shows oldest first — that's not useful during an active incident.",
  secondClue: "Each log record has a field that stores the exact moment it was emitted. You can use it to reorder the results.",
  finalClue: "The timestamp field stores when each record was created. The command for ordering results is called `sort`. To get newest first, use the direction `desc`.",
  requiredConcepts: ["sort", "timestamp", "desc"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasFilter = n.includes("filter") && n.includes("loglevel");
    const hasSort = n.includes("sort") && n.includes("timestamp") && n.includes("desc");
    if (hasFetch && hasFilter && hasSort) return { valid: true, partial: false, feedback: "Sorted newest first. The freshest errors surface at the top." };
    if (hasFetch && hasFilter && n.includes("sort") && n.includes("timestamp")) return { valid: false, partial: true, feedback: "Good use of sort with timestamp. Specify the direction — which end do you want at the top?" };
    if (hasFetch && hasFilter && n.includes("sort")) return { valid: false, partial: true, feedback: "sort found. Specify which field to sort on and the direction." };
    if (hasFetch && hasFilter) return { valid: false, partial: true, feedback: "Errors filtered. Now order them to put the most recent at the top." };
    return { valid: false, partial: false, feedback: "Fetch the logs, filter for errors, then order by time." };
  },
  mockRecordCount: 1847,
  mockResultCount: 1847,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "loglevel", "content"],
    rows: [
      [{ value: `${v.errorTimestamp} (latest)`, style: "highlight" }, { value: "ERROR", style: "error" }, { value: `${v.serviceName}: empty response body — HTTP 200 but null payload`, style: "error" }],
      [{ value: v.errorTimestamp }, { value: "ERROR", style: "error" }, { value: `${v.serviceName}: product catalog returned null`, style: "error" }],
      [{ value: v.errorTimestamp }, { value: "ERROR", style: "error" }, { value: `${v.serviceName}: NullPointerException in CatalogService.getProducts()`, style: "error" }],
    ],
  }),
  baseXP: 60,
  xpPerHint: 15,
  storyExplanation: "sort reorders results. timestamp desc puts the newest first. In incident response, recency matters enormously — the most recent errors tell you what's happening RIGHT NOW, not 2 hours ago.",
  dqlLesson: `| sort timestamp desc
| sort timestamp asc
| sort count() desc
| sort \`count()\` desc   // backtick-quote aggregation aliases

// sort accepts any field and a direction: desc (newest/biggest first) or asc.
// Always comes after filter/parse/summarize in the pipeline.`,
  commandsShown: ["sort"],
};

export const scenario01: ScenarioV2 = {
  id: "scenario_01_silent_crash",
  difficulty: 1,
  stars: "★☆☆☆☆",
  title: "The Silent Crash",
  company: "{{companyName}}",
  briefing: "Sunday morning. {{companyName}}'s mobile app shows a blank screen. No errors in Slack. No alerts fired. But customer complaints are flooding social media. Something is silently failing — and it's on you to find what.",
  steps: [step1, step2, step3],
  variants: [
    {
      companyName: "PulseCart", serviceName: "mobile-api", hostName: "prod-web-04",
      processGroup: "PROCESS_GROUP-8A2F", hostId: "HOST-DD5679D1",
      errorTimestamp: "09:14:22.441", deploymentVersion: "v2.3.1",
      ipAddresses: ["10.0.1.42", "10.0.1.43"], statusCodes: [200],
      errorMessages: ["null pointer in catalog response", "empty response body"],
      configKey: "catalog.service.url", configValue: "http://catalog:8080/null",
      errorCounts: [47193, 1847, 12],
    },
    {
      companyName: "QuickBuy", serviceName: "product-api", hostName: "k8s-node-07",
      processGroup: "PROCESS_GROUP-C3E9", hostId: "HOST-AB12CD34",
      errorTimestamp: "11:02:55.112", deploymentVersion: "v1.9.4",
      ipAddresses: ["10.0.2.17", "10.0.2.18"], statusCodes: [200],
      errorMessages: ["NullPointerException in ProductService", "serialization failed"],
      configKey: "product.db.connection", configValue: "jdbc:null",
      errorCounts: [52840, 2103, 9],
    },
    {
      companyName: "ShopWave", serviceName: "checkout-frontend", hostName: "dc2-app-server-3",
      processGroup: "PROCESS_GROUP-F7B2", hostId: "HOST-EF56GH78",
      errorTimestamp: "14:38:11.773", deploymentVersion: "v3.0.0",
      ipAddresses: ["192.168.1.55", "192.168.1.56"], statusCodes: [200],
      errorMessages: ["empty JSON payload", "undefined is not a function"],
      configKey: "api.endpoint.base", configValue: "https://undefined/api",
      errorCounts: [38921, 1523, 7],
    },
  ],
  rootCause: "{{serviceName}} was returning HTTP 200 with an empty JSON body due to a null pointer in the product catalog service. No HTTP error code meant no alerts fired.",
  postMortem: "The mobile app received valid HTTP 200 responses but with null/empty payloads. The frontend rendered a blank screen. Because the status code was 200, no error-rate alert triggered — the incident was completely invisible to monitoring. Root cause: a null pointer in the catalog service that returned before serializing the response body.",
  commandsUnlocked: ["fetch logs", "filter", "loglevel", "sort"],
};
