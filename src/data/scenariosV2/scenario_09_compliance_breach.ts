import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "{{companyName}}'s {{serviceName}} provides PHI (Protected Health Information) to authorized users. A HIPAA audit flagged access to patient records outside business hours over the past month. The access logs are in Grail. To build an airtight evidence timeline, you first need to add time-of-day context to each access record — the raw timestamps aren't enough for legal review.",
  clue: "You need to analyze when records were accessed, broken down by hour of day and day of week. This isn't in the raw data — it needs to be computed from the existing timestamp field.",
  secondClue: "DQL has built-in time extraction functions that work on timestamp fields. You can extract the hour (0-23) and the day of week from any timestamp.",
  finalClue: "Use `fieldsAdd` to add two new computed fields. The function that extracts the hour is called `getHour()`. The function for day of week is called `getDayOfWeek()`. Both take the `timestamp` field as their argument.",
  requiredConcepts: ["fetch logs", "fieldsAdd", "getHour", "getDayOfWeek"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasGetHour = n.includes("gethour(");
    const hasGetDay = n.includes("getdayofweek(");
    if (hasFetch && hasGetHour && hasGetDay) return { valid: true, partial: false, feedback: "Time fields computed. Now you can filter by hour and day." };
    if (hasFetch && (hasGetHour || hasGetDay)) return { valid: false, partial: true, feedback: "Good — you're using time functions. Add both getHour() and getDayOfWeek() for the full time picture." };
    if (hasFetch && n.includes("fieldsadd")) return { valid: false, partial: true, feedback: "fieldsAdd is right. Use the time extraction functions: getHour(timestamp) and getDayOfWeek(timestamp)." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Logs loaded. Now add computed fields to extract time-of-day information." };
    return { valid: false, partial: false, feedback: "Load audit logs and add fields for the hour and day of each access." };
  },
  mockRecordCount: 0,
  mockResultCount: 142000,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "hour", "day", "content"],
    rows: [
      [{ value: `${v.errorTimestamp} Mon` }, { value: "9" }, { value: "1" }, { value: "Patient record accessed: ID-44821" }],
      [{ value: `${v.errorTimestamp} Sat` }, { value: "2", style: "error" }, { value: "6", style: "error" }, { value: "Patient record accessed: ID-55192", style: "error" }],
      [{ value: `${v.errorTimestamp} Sun` }, { value: "4", style: "error" }, { value: "7", style: "error" }, { value: "Patient record accessed: ID-29847", style: "error" }],
    ],
  }),
  baseXP: 110,
  xpPerHint: 28,
  storyExplanation: "getHour(timestamp) extracts the hour (0–23) from a timestamp. getDayOfWeek(timestamp) returns the day number (1=Monday…7=Sunday). These time functions let you build temporal filters that HIPAA auditors require.",
  dqlLesson: `| fieldsAdd hour = getHour(timestamp)
| fieldsAdd day = getDayOfWeek(timestamp)
| fieldsAdd month = getMonth(timestamp)
| fieldsAdd year = getYear(timestamp)

// Time extraction functions:
// getHour(ts)       — 0-23
// getDayOfWeek(ts)  — 1=Mon, 2=Tue ... 7=Sun
// getDayOfMonth(ts) — 1-31
// getMonth(ts)      — 1-12
// getYear(ts)       — 4-digit year`,
  commandsShown: ["getHour()", "getDayOfWeek()", "getMonth()"],
};

const step2 = {
  stepNumber: 2,
  narration: "Time fields are now attached to all 142,000 records. Business hours for this healthcare provider are 6 AM to 10 PM. The HIPAA auditors need to see only the out-of-hours accesses — those are the potential violations. Filter to records outside that window.",
  clue: "Business hours are 6 AM to 10 PM. You want records accessed outside those hours — either before 6 AM or after 10 PM.",
  secondClue: "You can filter using the computed `hour` field you just added. Hours before 6 and after 22 define off-hours. You need records matching either condition.",
  finalClue: "Filter where `hour` is less than 6 OR greater than 22. The boolean operator `or` connects the two conditions.",
  requiredConcepts: ["filter", "hour", "or", "< 6", "> 22"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasHourFilter = n.includes("hour") && (n.includes("< 6") || n.includes("<6") || n.includes("> 22") || n.includes(">22"));
    const hasOr = n.includes(" or ");
    if (hasFetch && hasHourFilter && hasOr) return { valid: true, partial: false, feedback: "Off-hours access isolated. The pattern is suspicious." };
    if (hasFetch && hasHourFilter) return { valid: false, partial: true, feedback: "Good hour filter. Combine both conditions (before 6 AND after 22) with 'or' since you want either." };
    if (hasFetch && n.includes("hour")) return { valid: false, partial: true, feedback: "Hour field found. Filter for values outside the 6–22 business hours window." };
    return { valid: false, partial: false, feedback: "Filter to records where the access hour is outside normal business hours." };
  },
  mockRecordCount: 142000,
  mockResultCount: 8340,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "hour", "day", "content"],
    rows: [
      [{ value: `${v.errorTimestamp}` }, { value: "2", style: "error" }, { value: "6 (Sat)", style: "warn" }, { value: "Bulk patient export: 847 records", style: "error" }],
      [{ value: `${v.errorTimestamp}` }, { value: "2", style: "error" }, { value: "7 (Sun)", style: "warn" }, { value: "Bulk patient export: 912 records", style: "error" }],
      [{ value: `${v.errorTimestamp}` }, { value: "4", style: "error" }, { value: "1 (Mon)", style: "warn" }, { value: "Bulk patient export: 703 records", style: "error" }],
    ],
  }),
  baseXP: 100,
  xpPerHint: 25,
  storyExplanation: "8,340 off-hours access events. But notice the 'Bulk patient export' pattern in the content — this isn't a human browsing records at 2 AM. This is automated pipeline behavior pulling hundreds of records at a time.",
  dqlLesson: `| filter hour < 6 or hour > 22
| filter hour >= 6 and hour <= 22   // business hours
| filter day >= 1 and day <= 5      // weekdays only (Mon-Fri)
| filter day == 6 or day == 7       // weekends only

// Comparison operators: <, >, <=, >=, ==, !=
// Boolean: and, or, not
// Parentheses for grouping: (hour < 6 or hour > 22) and day >= 6`,
  commandsShown: ["comparison operators", "boolean logic"],
};

const step3 = {
  stepNumber: 3,
  narration: "8,340 off-hours events with a suspicious bulk-export pattern. The legal team needs more than a raw count — they need a timeline showing the access frequency over 30 days. A time-bucketed visualization will prove this is automated and regular, not incidental.",
  clue: "You need to show the legal team a count of off-hours access events per day over the past month. Something that produces a timeline view, not a flat list.",
  secondClue: "DQL has a command specifically for creating time-bucketed aggregations from raw records. It produces a series of time intervals, each with an aggregated value.",
  finalClue: "The command is called `makeTimeseries`. Use `countIf()` with your off-hours condition to count only violations. Set `interval:1d` for daily buckets.",
  requiredConcepts: ["makeTimeseries", "countIf", "interval:1d"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasMakeTS = n.includes("maketimeseries");
    const hasCountIf = n.includes("countif(");
    const hasInterval = n.includes("interval:");
    if (n.includes("timeseries") && !hasMakeTS) return { valid: false, partial: true, feedback: "⚠️ 'timeseries' is for pre-aggregated metrics. For log records, use makeTimeseries instead." };
    if (hasFetch && hasMakeTS && hasCountIf && hasInterval) return { valid: true, partial: false, feedback: "Timeline built. The regularity of violations is unmistakable — this is automated." };
    if (hasFetch && hasMakeTS && hasInterval) return { valid: false, partial: true, feedback: "makeTimeseries with interval looks right. Use countIf() to count only the off-hours violations." };
    if (hasFetch && hasMakeTS) return { valid: false, partial: true, feedback: "makeTimeseries is correct. Add interval:1d and use countIf() with your hour condition." };
    return { valid: false, partial: false, feedback: "Build a timeline of off-hours access events using makeTimeseries." };
  },
  mockRecordCount: 8340,
  mockResultCount: 30,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timeframe", "unauthorized_access"],
    rows: [
      [{ value: "Mon" }, { value: String(v.errorCounts[2]) }],
      [{ value: "Tue" }, { value: String(v.errorCounts[2]) }],
      [{ value: "Sat", style: "error" }, { value: String(v.errorCounts[0]), style: "error" }],
      [{ value: "Sun", style: "error" }, { value: String(v.errorCounts[0]), style: "error" }],
    ],
  }),
  baseXP: 130,
  xpPerHint: 33,
  storyExplanation: "The pattern is obvious: consistent access every 4 hours, including 2 AM and 6 AM on weekends. No human analyst works these hours. This is an automated data pipeline running on a schedule. The regularity is the proof.",
  dqlLesson: `| makeTimeseries unauthorized = countIf(hour < 6 or hour > 22), interval:1d
| makeTimeseries count(), interval:1h
| makeTimeseries errors = countIf(loglevel == "ERROR"), interval:5m

// makeTimeseries: time-bucketed aggregation from raw records (logs/events/spans).
// NOT 'timeseries' — that's for pre-aggregated metrics only.
// countIf(condition): counts records matching condition within each bucket.
// interval: bucket size — 1m, 5m, 1h, 1d, etc.`,
  commandsShown: ["makeTimeseries", "countIf()", "interval:"],
};

export const scenario09: ScenarioV2 = {
  id: "scenario_09_compliance_breach",
  difficulty: 5,
  stars: "★★★★★",
  title: "The Compliance Breach",
  company: "{{companyName}}",
  briefing: "{{companyName}}'s HIPAA compliance audit revealed unauthorized access to patient records outside business hours. The access logs exist in Dynatrace. You need to build the evidence timeline for the legal team — and it has to be airtight.",
  steps: [step1, step2, step3],
  variants: [
    {
      companyName: "MediVault", serviceName: "patient-records-api", hostName: "hipaa-app-01",
      processGroup: "PROCESS_GROUP-HIP1", hostId: "HOST-HIP001",
      errorTimestamp: "02:00:00", deploymentVersion: "n/a",
      ipAddresses: ["10.0.15.3"], statusCodes: [],
      errorMessages: ["bulk export", "patient record accessed"],
      configKey: "analytics.vendor.id", configValue: "DataPipeline-Corp automated job",
      errorCounts: [1847, 703, 312],
    },
    {
      companyName: "HealthRecord", serviceName: "ehr-api", hostName: "ehr-server-02",
      processGroup: "PROCESS_GROUP-HIP2", hostId: "HOST-HIP002",
      errorTimestamp: "04:00:00", deploymentVersion: "n/a",
      ipAddresses: ["10.0.16.7"], statusCodes: [],
      errorMessages: ["record batch export", "query: SELECT * FROM patients"],
      configKey: "integration.partner.id", configValue: "InsightAnalytics automated pipeline",
      errorCounts: [2103, 891, 444],
    },
    {
      companyName: "CareData", serviceName: "medical-records-svc", hostName: "records-app-03",
      processGroup: "PROCESS_GROUP-HIP3", hostId: "HOST-HIP003",
      errorTimestamp: "06:00:00", deploymentVersion: "n/a",
      ipAddresses: ["172.16.5.21"], statusCodes: [],
      errorMessages: ["export job started", "pulling patient cohort"],
      configKey: "data.processor.id", configValue: "BioAnalytics-Inc scheduled job",
      errorCounts: [1540, 612, 287],
    },
  ],
  rootCause: "A third-party analytics vendor ({{configValue}}) was pulling patient data every 4 hours including weekends and overnight — violating the data processing agreement which restricted access to business hours only.",
  postMortem: "The analytics vendor's automated pipeline had overly broad API permissions and ran on a fixed 4-hour cron schedule with no business-hours restriction. The vendor's data processing agreement explicitly limited access to business hours Mon–Fri. Fix: revoke and re-issue scoped API credentials, add time-based access policies at the API gateway, require vendor re-sign of DPA.",
  commandsUnlocked: ["getHour()", "getDayOfWeek()", "makeTimeseries", "countIf()"],
};
