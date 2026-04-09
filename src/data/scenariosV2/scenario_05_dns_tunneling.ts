import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "{{companyName}}'s Security Operations Center detected abnormally long DNS queries to unfamiliar external domains overnight. DNS tunneling disguises data exfiltration as DNS lookups — the data is encoded in subdomain strings. Gigamon network sensors feed all traffic logs into Dynatrace Grail, tagged by protocol. Start by loading the DNS traffic.",
  clue: "This investigation involves network traffic logs, not application logs. Network logs include a field that identifies which protocol a traffic record belongs to.",
  secondClue: "Gigamon-ingested network logs include a field called `app_name` that identifies the protocol — dns, http, ssl, smb, and others.",
  finalClue: "Fetch logs from the overnight window and `filter` where `app_name` equals the DNS protocol identifier.",
  requiredConcepts: ["fetch logs", "filter", "app_name"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasAppName = n.includes("app_name");
    if (hasFetch && hasAppName) return { valid: true, partial: false, feedback: "DNS traffic logs loaded. Something lurks in these query patterns." };
    if (hasFetch && n.includes("filter") && n.includes("dns")) return { valid: false, partial: true, feedback: "Good targeting of DNS. The field that identifies protocol is app_name." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Logs loaded. Now scope to DNS protocol traffic using the app_name field." };
    return { valid: false, partial: false, feedback: "Load logs and filter to DNS traffic." };
  },
  mockRecordCount: 0,
  mockResultCount: 48200,
  mockResultData: (): MockData => ({
    headers: ["timestamp", "app_name", "dns_query", "src_ip"],
    rows: [
      [{ value: "02:14:11" }, { value: "dns", style: "highlight" }, { value: "google.com" }, { value: "10.0.1.42" }],
      [{ value: "02:14:12" }, { value: "dns" }, { value: "internal.corp" }, { value: "10.0.1.55" }],
      [{ value: "02:14:13" }, { value: "dns" }, { value: "a7b3c9d1e5.exfil.ru", style: "error" }, { value: "10.0.1.88" }],
    ],
  }),
  baseXP: 80,
  xpPerHint: 20,
  storyExplanation: "app_name is a Gigamon-ingested field that identifies the application protocol (dns, http, ssl, smb, etc.). Network security logs use these vendor-specific fields alongside standard Dynatrace fields.",
  dqlLesson: `fetch logs, from:-12h
| filter app_name == "dns"
| filter app_name == "http"
| filter app_name == "ssl"

// Gigamon network fields (ingested via Dynatrace Log Ingest API):
// app_name — protocol (dns, http, ssl, smb, dhcp, bgp...)
// src_ip, dst_ip — source/destination IPs
// src_port, dst_port — ports
// dns_query — the DNS query string`,
  commandsShown: ["app_name", "src_ip", "dst_ip"],
};

const step2 = {
  stepNumber: 2,
  narration: "48,200 DNS records are loaded. Standard DNS traffic uses a well-known port — that's all legitimate lookups. DNS tunneling uses non-standard ports to bypass basic controls. Removing the normal traffic will leave only the suspicious records visible.",
  clue: "Normal DNS queries go to a well-known port number. You want to exclude those and keep only the traffic that deviates from standard behavior.",
  secondClue: "There's a variant of the `filter` command that inverts the match — it removes records that meet the condition rather than keeping them.",
  finalClue: "The inverted filter command is called `filterOut`. Apply it to `dst_port` — the standard DNS port is 53.",
  requiredConcepts: ["filterOut", "dst_port"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasFilterOut = n.includes("filterout");
    const hasPort = n.includes("dst_port") || n.includes("port");
    if (hasFetch && hasFilterOut && hasPort) return { valid: true, partial: false, feedback: "Standard DNS filtered out. Suspicious non-standard port traffic remains." };
    if (hasFetch && n.includes("filter") && hasPort && !hasFilterOut) return { valid: false, partial: true, feedback: "You're filtering on port — but you want to REMOVE matching records. There's a command that inverts the filter." };
    if (hasFetch && hasFilterOut) return { valid: false, partial: true, feedback: "filterOut is correct. Specify what port to exclude." };
    return { valid: false, partial: false, feedback: "Filter out the normal DNS traffic by excluding records on the standard DNS port." };
  },
  mockRecordCount: 48200,
  mockResultCount: 1240,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "dst_port", "dns_query", "src_ip"],
    rows: [
      [{ value: "02:14:13" }, { value: "5353", style: "warn" }, { value: `a7b3${v.errorCounts[0]}.data.${v.configValue}`, style: "error" }, { value: v.ipAddresses[0] }],
      [{ value: "02:14:45" }, { value: "8053", style: "warn" }, { value: `c9d1${v.errorCounts[1]}.cmd.${v.configValue}`, style: "error" }, { value: v.ipAddresses[0] }],
      [{ value: "02:15:02" }, { value: "5353", style: "warn" }, { value: `e5f7${v.errorCounts[2]}.data.${v.configValue}`, style: "error" }, { value: v.ipAddresses[0] }],
    ],
  }),
  baseXP: 100,
  xpPerHint: 25,
  storyExplanation: "filterOut is the logical inverse of filter — it removes matching records and keeps everything else. Here it removes standard port-53 DNS queries (legitimate traffic), leaving only the anomalous queries on non-standard ports.",
  dqlLesson: `| filterOut dst_port == "53"
| filterOut loglevel == "DEBUG"
| filterOut event.category == "INFO"

// filterOut: removes matching records, keeps the rest.
// Opposite of filter — useful for stripping out known-good noise.
// Same condition syntax as filter.`,
  commandsShown: ["filterOut", "dst_port"],
};

const step3 = {
  stepNumber: 3,
  narration: "1,240 suspicious DNS queries remain. DNS tunneling encodes stolen data in the subdomain portion of queries — long, random-looking strings sent to attacker-controlled domains. The query patterns visible in `dns_query` will confirm the tunneling signature.",
  clue: "DNS tunneling hides data in the subdomain part of queries. You're looking for dns_query values that match suspicious top-level domain patterns — long subdomains sent to unusual TLDs.",
  secondClue: "To search for a phrase or substring within the `dns_query` field, you need a content-matching function. There are two equivalent ones in DQL.",
  finalClue: "Use `contains()` or `matchesPhrase()` to search the `dns_query` field for suspicious TLD strings. Combine two searches with `or`.",
  requiredConcepts: ["filter", "matchesPhrase"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasContentSearch = (n.includes("matchesphrase(") || n.includes("contains("));
    const hasDnsQuery = n.includes("dns_query");
    if (hasFetch && hasContentSearch && hasDnsQuery) return { valid: true, partial: false, feedback: "Suspicious domains isolated. The tunneling pattern is clear." };
    if (hasFetch && n.includes("filter") && hasDnsQuery) return { valid: false, partial: true, feedback: "Filtering on dns_query is right. Use contains() or matchesPhrase() to search for suspicious TLD strings." };
    return { valid: false, partial: false, feedback: "Search the dns_query field for suspicious domain patterns." };
  },
  mockRecordCount: 1240,
  mockResultCount: 847,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "dns_query", "src_ip"],
    rows: [
      [{ value: "02:14:13" }, { value: `a7b3c9d1e5f2.exfil.${v.configValue}`, style: "error" }, { value: v.ipAddresses[0], style: "highlight" }],
      [{ value: "02:14:45" }, { value: `c9d1e5f7a3b8.cmd.${v.configValue}`, style: "error" }, { value: v.ipAddresses[0], style: "highlight" }],
      [{ value: "02:15:02" }, { value: `e5f7a3b9c1d4.data.${v.configValue}`, style: "error" }, { value: v.ipAddresses[0], style: "highlight" }],
    ],
  }),
  baseXP: 110,
  xpPerHint: 28,
  storyExplanation: "matchesPhrase() and contains() both search for substrings within a field — they're equivalent for most use cases. The tunneling pattern is clear: 847 queries all from the same source IP, all to subdomains of a suspicious TLD.",
  dqlLesson: `| filter matchesPhrase(dns_query, ".ru")
| filter matchesPhrase(dns_query, ".xyz", caseSensitive:FALSE)
| filter contains(content, "connection refused")

// matchesPhrase() — phrase-level search with word boundary awareness.
// contains() — exact substring search. Both are equivalent for most cases.
// caseSensitive: parameter (default TRUE).
// endsWith(field, ".ru") — suffix match`,
  commandsShown: ["matchesPhrase()", "matchesValue()", "endsWith()"],
};

const step4 = {
  stepNumber: 4,
  narration: "847 tunneling queries confirmed. All signs point to one machine inside the network acting as the exfiltration source. Grouping by source IP will identify exactly which workstation has been compromised.",
  clue: "All these suspicious queries came from somewhere inside the network. You need to count how many came from each source address to find the infected machine.",
  secondClue: "This is an aggregation problem — collapse 847 records into a summary showing counts per source IP address.",
  finalClue: "Use `summarize` with `count()` to count records. Group with `by:{}` on the source IP field `src_ip`. Then `sort` descending to put the highest count first.",
  requiredConcepts: ["summarize", "count()", "by:", "src_ip"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasSummarize = n.includes("summarize") && n.includes("count()");
    const hasByIP = n.includes("src_ip") && n.includes("by:");
    if (hasFetch && hasSummarize && hasByIP) return { valid: true, partial: false, feedback: "One machine accounts for 99% of suspicious queries. Found the infected workstation." };
    if (hasFetch && hasSummarize) return { valid: false, partial: true, feedback: "summarize count() is correct. Group by the source IP field." };
    return { valid: false, partial: false, feedback: "Aggregate the suspicious queries to find which IP is generating them." };
  },
  mockRecordCount: 847,
  mockResultCount: 3,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["src_ip", "count()"],
    rows: [
      [{ value: v.ipAddresses[0], style: "error" }, { value: "841", style: "error" }],
      [{ value: v.ipAddresses[1] }, { value: "4" }],
      [{ value: "10.0.1.100" }, { value: "2" }],
    ],
  }),
  baseXP: 90,
  xpPerHint: 23,
  storyExplanation: "One IP account for 841 out of 847 suspicious queries — 99.3%. The infected machine is unambiguous. This is the power of summarize: collapsing thousands of records into a clear signal.",
  dqlLesson: `| summarize count(), by:{src_ip}
| summarize total = count(), by:{app_name, src_ip}
| summarize tcp_rtt_max = max(tcp_rtt), by:{app_name, src_ip}

// Network security aggregations:
// Group by src_ip or dst_ip to find top talkers
// Group by app_name to see protocol distribution
// max(), min(), avg() aggregate numeric fields`,
  commandsShown: ["summarize by: network fields"],
};

export const scenario05: ScenarioV2 = {
  id: "scenario_05_dns_tunneling",
  difficulty: 3,
  stars: "★★★☆☆",
  title: "DNS Tunneling",
  company: "{{companyName}}",
  briefing: "{{companyName}}'s SOC detected unusual DNS traffic patterns overnight. Abnormally long DNS queries to unfamiliar domains. Could be DNS tunneling — data exfiltration disguised as DNS lookups.",
  steps: [step1, step2, step3, step4],
  variants: [
    {
      companyName: "ShieldNet", serviceName: "dev-workstation-14", hostName: "ws-dev-14",
      processGroup: "PROCESS_GROUP-SEC01", hostId: "HOST-SEC001",
      errorTimestamp: "02:14:13", deploymentVersion: "n/a",
      ipAddresses: ["10.0.1.88", "10.0.1.42"], statusCodes: [],
      errorMessages: ["DNS tunneling detected"],
      configKey: "c2.domain", configValue: "ru",
      errorCounts: [8834, 2291, 4417],
    },
    {
      companyName: "SecureBase", serviceName: "laptop-eng-07", hostName: "ws-eng-07",
      processGroup: "PROCESS_GROUP-SEC02", hostId: "HOST-SEC002",
      errorTimestamp: "03:22:44", deploymentVersion: "n/a",
      ipAddresses: ["192.168.10.77", "192.168.10.33"], statusCodes: [],
      errorMessages: ["abnormal DNS query length"],
      configKey: "c2.domain", configValue: "xyz",
      errorCounts: [9127, 3341, 5012],
    },
    {
      companyName: "CyberGuard", serviceName: "workstation-finance-03", hostName: "ws-fin-03",
      processGroup: "PROCESS_GROUP-SEC03", hostId: "HOST-SEC003",
      errorTimestamp: "01:44:22", deploymentVersion: "n/a",
      ipAddresses: ["172.16.5.22", "172.16.5.10"], statusCodes: [],
      errorMessages: ["encoded subdomain detected"],
      configKey: "c2.domain", configValue: "top",
      errorCounts: [7723, 1891, 3840],
    },
  ],
  rootCause: "A compromised workstation ({{ipAddresses}}) using DNS tunneling to exfiltrate data to a .{{configValue}} domain. Malware encoded stolen data in the subdomain portion of DNS queries.",
  postMortem: "A developer's workstation was compromised via a malicious npm package. The malware activated 72 hours post-install and began DNS tunneling — encoding stolen code and credentials as base64 in DNS subdomain labels. The data was decoded server-side at the attacker's C2 domain. Fix: DNS egress filtering to block non-internal resolvers and anomalous subdomain length.",
  commandsUnlocked: ["filterOut", "matchesPhrase()", "matchesValue()", "endsWith()"],
};
