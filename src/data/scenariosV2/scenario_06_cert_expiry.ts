import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "{{companyName}}'s {{serviceName}} handles encrypted inter-service communication. Some requests succeed, some fail with TLS errors — but the pattern seems random. An intermediate CA certificate expired over the weekend; services that cached the old TLS session kept working until their cache expired. Load the TLS-related error logs to see the scope.",
  clue: "You're looking for TLS handshake failures — a specific type of error that appears when certificate verification fails. Not all log records are relevant; scope to TLS-related content.",
  secondClue: "The `content` field of each log record contains the actual log message text. Searching inside it for TLS-related keywords will quickly scope the investigation.",
  finalClue: "Use `contains()` or `matchesPhrase()` to search the `content` field for TLS-related terms like 'TLS', 'certificate', or 'ssl'.",
  requiredConcepts: ["fetch logs", "filter", "contains", "tls"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasTLS = (n.includes("contains(") || n.includes("matchesphrase(")) && (n.includes("tls") || n.includes("ssl") || n.includes("cert"));
    if (hasFetch && hasTLS) return { valid: true, partial: false, feedback: "TLS error logs isolated. Certificate failure patterns visible." };
    if (hasFetch && n.includes("filter") && (n.includes("tls") || n.includes("ssl"))) return { valid: false, partial: true, feedback: "Right area. Use contains() or matchesPhrase() to search the content field for TLS keywords." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Logs loaded. Narrow to TLS-related errors using content search." };
    return { valid: false, partial: false, feedback: "Load logs and filter for TLS/certificate-related content." };
  },
  mockRecordCount: 0,
  mockResultCount: 3240,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "loglevel", "content"],
    rows: [
      [{ value: v.errorTimestamp }, { value: "ERROR", style: "error" }, { value: "TLS handshake failed: certificate verify error", style: "error" }],
      [{ value: v.errorTimestamp }, { value: "ERROR", style: "error" }, { value: `SSL: certificate for ${v.serviceName} expired`, style: "error" }],
      [{ value: v.errorTimestamp }, { value: "WARN", style: "warn" }, { value: "TLS: falling back to unverified connection", style: "warn" }],
    ],
  }),
  baseXP: 75,
  xpPerHint: 19,
  storyExplanation: "Filtering by content keywords quickly scopes the investigation to TLS failure messages. The sporadic pattern — some requests succeed, some fail — is the key clue. This isn't a total outage; something about specific connections is different.",
  dqlLesson: `| filter contains(content, "TLS") or contains(content, "certificate")
| filter contains(content, "handshake")
| filter contains(content, "expired") or contains(content, "verify error")

// contains() and matchesPhrase() are equivalent for substring matching.
// contains() is case-sensitive. Use lowercase to cast a wider net.`,
  commandsShown: ["contains() multi-condition"],
};

const step2 = {
  stepNumber: 2,
  narration: "3,240 TLS error logs — enough to confirm the pattern is real. Each error record has a JSON object embedded in the log message containing detailed certificate metadata. To query those details (expiry date, TLS version, issuer), you need to parse the JSON out into fields first.",
  clue: "The certificate details you need aren't in separate fields — they're embedded as a JSON object inside the log content string. You need to extract that JSON.",
  secondClue: "DQL's `parse` command has a special matcher for JSON. It can extract an entire embedded JSON object into a queryable record in one step.",
  finalClue: "Use `parse` on the `content` field with the `JSON:` DPL matcher. This extracts the embedded JSON into a named field. Access individual keys with bracket notation afterward.",
  requiredConcepts: ["parse", "json:"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasJSON = n.includes("parse") && n.includes("json:");
    if (hasFetch && hasJSON) return { valid: true, partial: false, feedback: "JSON details extracted. Certificate metadata now queryable." };
    if (hasFetch && n.includes("parse") && n.includes("\\{")) return { valid: false, partial: true, feedback: "⚠️ DPL doesn't use regex. Don't escape braces. Use the JSON: matcher: parse content, \"LD JSON:details\"" };
    if (hasFetch && n.includes("parse") && n.includes("content")) return { valid: false, partial: true, feedback: "parse content is right. Use the JSON: matcher to capture the embedded JSON object." };
    return { valid: false, partial: false, feedback: "Extract the JSON certificate details from the log content field." };
  },
  mockRecordCount: 3240,
  mockResultCount: 3240,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "details"],
    rows: [
      [{ value: v.errorTimestamp }, { value: `{ "cert_expiry": "2026-04-07", "ssl_version": "TLSv1.2", "issuer": "IntermediateCA-${v.deploymentVersion}" }`, style: "highlight" }],
      [{ value: v.errorTimestamp }, { value: `{ "cert_expiry": "2026-04-07", "ssl_version": "TLSv1.3", "issuer": "IntermediateCA-${v.deploymentVersion}" }` }],
    ],
  }),
  baseXP: 110,
  xpPerHint: 28,
  storyExplanation: "The JSON: DPL matcher extracts an entire embedded JSON object into a record field. Once extracted, you access fields inside it with bracket notation: details[cert_expiry]. This is more powerful than trying to parse individual values with LD patterns.",
  dqlLesson: `| parse content, "LD JSON:details"
| fieldsAdd cert_expiry = details[cert_expiry_date]
| fieldsAdd ssl_ver = details[ssl_version]

// JSON: matcher in DPL extracts embedded JSON into a record.
// Access record fields with bracket notation: record[fieldName]
// Nested: details[address][city]
// ⚠️ Bracket notation, NOT dot notation: details[field] not details.field`,
  commandsShown: ["parse JSON:", "bracket notation"],
};

const step3 = {
  stepNumber: 3,
  narration: "Certificate metadata is now extracted. The records show both cert_expiry dates and TLS protocol versions. The combination tells the full story: expired certificate plus deprecated protocol versions in use. Adding computed classification fields will make this immediately readable for the security team.",
  clue: "You want to add two new fields to each record: the TLS version extracted from the JSON, and a status label classifying it as deprecated or current.",
  secondClue: "Use `fieldsAdd` to compute new fields. Access JSON sub-fields with bracket notation. For conditional values, DQL has an `if()` function.",
  finalClue: "Use `fieldsAdd` with `details[ssl_version]` to extract the version. Then add another `fieldsAdd` using `if()` to set a status — 'DEPRECATED' for TLSv1.0 or TLSv1.1, 'OK' for newer versions.",
  requiredConcepts: ["fieldsAdd", "if(", "details["],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasJSON = n.includes("json:");
    const hasFieldsAdd = n.includes("fieldsadd");
    const hasIf = n.includes("if(");
    const hasBracket = n.includes("details[");
    if (hasFetch && hasJSON && hasFieldsAdd && hasIf && hasBracket) return { valid: true, partial: false, feedback: "TLS versions classified. Deprecated connections identified." };
    if (hasFetch && hasJSON && hasFieldsAdd && hasBracket) return { valid: false, partial: true, feedback: "Good bracket notation. Now add a conditional field using if() to classify the TLS version." };
    if (hasFetch && hasJSON && hasFieldsAdd) return { valid: false, partial: true, feedback: "fieldsAdd is right. Use bracket notation details[ssl_version] to access the JSON field." };
    if (hasFetch && hasJSON) return { valid: false, partial: true, feedback: "JSON parsed. Now add computed fields to extract and classify the certificate data." };
    return { valid: false, partial: false, feedback: "Parse the JSON and add computed fields to extract certificate details." };
  },
  mockRecordCount: 3240,
  mockResultCount: 3240,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "ssl_version", "status", "cert_expiry"],
    rows: [
      [{ value: v.errorTimestamp }, { value: "TLSv1.0", style: "error" }, { value: "DEPRECATED", style: "error" }, { value: "2026-04-07 (EXPIRED)", style: "error" }],
      [{ value: v.errorTimestamp }, { value: "TLSv1.3" }, { value: "OK" }, { value: "2026-04-07 (EXPIRED)", style: "error" }],
      [{ value: v.errorTimestamp }, { value: "TLSv1.2" }, { value: "OK" }, { value: "2026-04-07 (EXPIRED)", style: "error" }],
    ],
  }),
  baseXP: 120,
  xpPerHint: 30,
  storyExplanation: "The cert_expiry date is April 7th — two days ago. Every connection, regardless of TLS version, is failing because the intermediate CA certificate expired over the weekend. Services with locally cached certs kept working until their cache expired — which explains the random timing.",
  dqlLesson: `| fieldsAdd ssl_ver = details[ssl_version]
| fieldsAdd status = if(details[ssl_version] == "TLSv1.0", "DEPRECATED", else: "OK")
| fieldsAdd status = if(loglevel == "ERROR", "CRITICAL",
    else: if(loglevel == "WARN", "ATTENTION", else: "OK"))

// if(condition, trueValue, else: falseValue)
// Nested if() for multiple conditions
// fieldsAdd: adds without dropping existing fields
// fieldsRename: fieldNewName = fieldOldName`,
  commandsShown: ["if()", "fieldsRename", "fieldsRemove"],
};

export const scenario06: ScenarioV2 = {
  id: "scenario_06_cert_expiry",
  difficulty: 3,
  stars: "★★★☆☆",
  title: "The Certificate Expiry Cascade",
  company: "{{companyName}}",
  briefing: "Monday morning. {{companyName}}'s inter-service communication is failing sporadically — some requests succeed, some fail with TLS errors. The pattern seems random. Something expired over the weekend.",
  steps: [step1, step2, step3],
  variants: [
    {
      companyName: "FinPay", serviceName: "payment-processor", hostName: "prod-pay-01",
      processGroup: "PROCESS_GROUP-TLS1", hostId: "HOST-TLS001",
      errorTimestamp: "09:03:11", deploymentVersion: "CA-2023-B",
      ipAddresses: ["10.0.9.5"], statusCodes: [0],
      errorMessages: ["TLS handshake failed", "certificate expired"],
      configKey: "tls.ca.cert", configValue: "/etc/pki/ca-2023-b.pem (expired 2026-04-07)",
      errorCounts: [3240, 1820, 1420],
    },
    {
      companyName: "SecurePay", serviceName: "auth-gateway", hostName: "prod-auth-02",
      processGroup: "PROCESS_GROUP-TLS2", hostId: "HOST-TLS002",
      errorTimestamp: "07:41:22", deploymentVersion: "CA-2024-A",
      ipAddresses: ["10.0.10.8"], statusCodes: [0],
      errorMessages: ["certificate verify error", "SSL error: expired"],
      configKey: "ssl.intermediate.cert", configValue: "/etc/ssl/intermediate-2024a.pem (expired)",
      errorCounts: [2890, 1540, 1350],
    },
    {
      companyName: "TrustBank", serviceName: "api-gateway", hostName: "dc4-gw-01",
      processGroup: "PROCESS_GROUP-TLS3", hostId: "HOST-TLS003",
      errorTimestamp: "11:22:55", deploymentVersion: "CA-INT-7",
      ipAddresses: ["172.16.2.9"], statusCodes: [0],
      errorMessages: ["chain verification failed", "cert not valid after April 7"],
      configKey: "cert.chain.path", configValue: "/usr/local/certs/chain-int7.pem (expired)",
      errorCounts: [3810, 2100, 1710],
    },
  ],
  rootCause: "Intermediate CA certificate ({{configValue}}) expired over the weekend. Services using cached certs continued working until their local cache expired — random timing explains the sporadic pattern.",
  postMortem: "An intermediate CA certificate expired Saturday night. Services that cached TLS sessions continued working until their sessions expired — some after hours, some after days. This created a slow-rolling cascade of failures rather than an immediate outage. Fix: set certificate expiry alerts at 30/7/1 day thresholds; automate CA rotation.",
  commandsUnlocked: ["parse JSON:", "bracket notation", "if()", "fieldsAdd/Remove/Rename"],
};
