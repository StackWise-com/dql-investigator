import type { ScenarioV2, ScenarioVariant } from "../../types/scenario";
import type { MockData } from "../../types/detective";

function q(s: string) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

const step1 = {
  stepNumber: 1,
  narration: "{{companyName}}'s AWS bill tripled this month. CPU across the entire Kubernetes cluster is pegged at 100% around the clock. Application load hasn't changed. A crypto miner is running somewhere in the cluster — and it's been dormant long enough to avoid initial scans. Mining software leaves very specific fingerprints in process logs.",
  clue: "Cryptocurrency mining software emits specific log messages as it runs. Think about what words would appear in logs from a process that's mining cryptocurrency.",
  secondClue: "Mining software references the coin being mined in its log output. The most common coin mined on stolen compute is Monero, abbreviated as `xmr`. Generic terms like 'miner' also appear.",
  finalClue: "Search the `content` field using `contains()` or `matchesPhrase()` for terms like 'xmr', 'miner', or 'crypto'. Combine with `or`.",
  requiredConcepts: ["fetch logs", "filter", "contains", "xmr"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasMiner = (n.includes("contains(") || n.includes("matchesphrase(")) && (n.includes("xmr") || n.includes("miner") || n.includes("crypto"));
    if (hasFetch && hasMiner) return { valid: true, partial: false, feedback: "Mining activity detected in the logs. The evidence is damning." };
    if (hasFetch && n.includes("filter") && (n.includes("cpu") || n.includes("process"))) return { valid: false, partial: true, feedback: "Good instinct. Look for the specific keywords mining software uses — cryptocurrency names or generic miner identifiers." };
    if (hasFetch) return { valid: false, partial: true, feedback: "Logs loaded. Search the content field for keywords that identify crypto mining activity." };
    return { valid: false, partial: false, feedback: "Load logs and search for mining-related keywords in the content." };
  },
  mockRecordCount: 0,
  mockResultCount: 4821,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["timestamp", "dt.process.name", "content"],
    rows: [
      [{ value: v.errorTimestamp }, { value: "sidecar-metrics", style: "error" }, { value: "xmrig: mining XMR at 847 H/s", style: "error" }],
      [{ value: v.errorTimestamp }, { value: "sidecar-metrics", style: "error" }, { value: "miner pool connected: pool.minexmr.com:4444", style: "error" }],
      [{ value: v.errorTimestamp }, { value: "sidecar-metrics" }, { value: "accepted share — difficulty 120000" }],
    ],
  }),
  baseXP: 95,
  xpPerHint: 24,
  storyExplanation: "XMRig is the dominant open-source Monero miner. Finding its output in logs is unambiguous evidence of a crypto miner. The process is named 'sidecar-metrics' — a deliberately innocuous-sounding name to blend in.",
  dqlLesson: `| filter contains(content, "xmr") or contains(content, "miner")
| filter contains(content, "xmrig")
| filter contains(dt.process.name, "worker") and contains(content, "hash")

// Multi-condition or: checks any condition. Useful for broad keyword hunts.
// Combine with and to narrow: suspicious process name AND suspicious content.`,
  commandsShown: ["multi-condition filter"],
};

const step2 = {
  stepNumber: 2,
  narration: "Mining confirmed — XMRig is running on the cluster. Kubernetes workloads are organized by namespace and pod. Dynatrace automatically tags every log record with the Kubernetes context of the container that emitted it. Those tags will tell you exactly where in the cluster this miner lives.",
  clue: "Kubernetes logs in Dynatrace are tagged with the namespace, pod name, and container name of the workload that produced them. Use those tags to locate the miner.",
  secondClue: "Dynatrace automatically populates Kubernetes metadata fields on every log record from a containerized workload. The namespace field specifically tells you which Kubernetes namespace the miner is hiding in.",
  finalClue: "Use the `fields` command to show only the `k8s.namespace.name`, `k8s.pod.name`, and `k8s.container.name` fields alongside the timestamp and content.",
  requiredConcepts: ["fields", "k8s.namespace.name"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasMiner = n.includes("xmr") || n.includes("miner") || n.includes("crypto");
    const hasK8s = n.includes("k8s.namespace") || n.includes("k8s.pod") || n.includes("k8s.container");
    if (hasFetch && hasMiner && hasK8s) return { valid: true, partial: false, feedback: "Container identified. The miner lives in a suspicious namespace." };
    if (hasFetch && hasMiner && n.includes("fields")) return { valid: false, partial: true, feedback: "fields command found. Include the k8s.namespace.name field to identify the container." };
    if (hasFetch && hasMiner) return { valid: false, partial: true, feedback: "Miner found. Now identify WHICH container it's running in using Kubernetes fields." };
    return { valid: false, partial: false, feedback: "Find the miner logs and identify the Kubernetes namespace and pod." };
  },
  mockRecordCount: 4821,
  mockResultCount: 4821,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["k8s.namespace.name", "k8s.pod.name", "k8s.container.name", "content"],
    rows: [
      [{ value: v.configKey, style: "error" }, { value: `${v.serviceName}-7d9f4`, style: "error" }, { value: "sidecar-metrics", style: "error" }, { value: "xmrig: 847 H/s", style: "error" }],
      [{ value: v.configKey, style: "error" }, { value: `${v.serviceName}-7d9f4` }, { value: "sidecar-metrics" }, { value: "pool: pool.minexmr.com" }],
    ],
  }),
  baseXP: 100,
  xpPerHint: 25,
  storyExplanation: "k8s.namespace.name, k8s.pod.name, and k8s.container.name are automatically populated by Dynatrace for Kubernetes workloads. The miner is in the 'monitoring' namespace — it deliberately hides alongside legitimate monitoring tools.",
  dqlLesson: `| fields k8s.namespace.name, k8s.pod.name, k8s.container.name, content
| fields timestamp, loglevel, content        // keep only listed fields
| fieldsAdd deployment = k8s.namespace.name  // add without dropping others

// Kubernetes fields (auto-populated by Dynatrace):
// k8s.namespace.name, k8s.pod.name, k8s.container.name
// k8s.cluster.name, k8s.deployment.name
// 'fields' KEEPS only listed fields. 'fieldsAdd' ADDS without dropping.`,
  commandsShown: ["fields", "k8s.namespace.name", "k8s.pod.name"],
};

const step3 = {
  stepNumber: 3,
  narration: "Container located — a suspiciously named sidecar in the {{configKey}} namespace. The container is identified by a Dynatrace process group ID. To unmask it — get the actual human-readable service name and metadata — you need to join those IDs against Dynatrace's entity catalog.",
  clue: "The process group ID is an opaque identifier. To get the human-readable service name behind it, you need to look it up against the Dynatrace entity data.",
  secondClue: "DQL has a command that lets you enrich records by joining with data from a separate inner query — like looking up a name by ID.",
  finalClue: "The command is called `lookup`. Fetch entity names from `dt.entity.process_group`. Use `sourceField:` for the field to match in your pipeline and `lookupField:` for the field to match against in the entity data.",
  requiredConcepts: ["lookup", "dt.entity.process_group"],
  validate(query: string) {
    const n = q(query);
    const hasFetch = n.includes("fetch logs");
    const hasLookup = n.includes("lookup");
    const hasEntityFetch = n.includes("dt.entity.process_group");
    if (hasFetch && hasLookup && hasEntityFetch) return { valid: true, partial: false, feedback: "Entity name resolved. The process group is unmasked." };
    if (hasFetch && n.includes("join")) return { valid: false, partial: true, feedback: "join works but for entity enrichment, lookup is simpler — it's designed for exactly this ID-to-name resolution pattern." };
    if (hasFetch && hasLookup) return { valid: false, partial: true, feedback: "lookup is right. The inner fetch should be from dt.entity.process_group to get entity names." };
    return { valid: false, partial: false, feedback: "Enrich the process group IDs with their human-readable names using entity data." };
  },
  mockRecordCount: 4821,
  mockResultCount: 4821,
  mockResultData: (v: ScenarioVariant): MockData => ({
    headers: ["dt.entity.process_group", "pg.entity.name", "k8s.namespace.name"],
    rows: [
      [{ value: v.processGroup, style: "highlight" }, { value: `${v.serviceName} (COMPROMISED)`, style: "error" }, { value: v.configKey, style: "error" }],
    ],
  }),
  baseXP: 140,
  xpPerHint: 35,
  storyExplanation: "lookup joins your query results with data from a separate entity fetch. sourceField is the field in your current results to match on. lookupField is the field in the entity data to match against. prefix: avoids field name collisions by prefixing all joined fields.",
  dqlLesson: `| lookup [fetch dt.entity.process_group | fields id, entity.name],
    sourceField:dt.entity.process_group, lookupField:id, prefix:"pg."

// lookup: enrich records by joining with a sub-query.
// sourceField: field in the current pipeline to match on
// lookupField: field in the sub-query to match against
// prefix: "pg." — all joined fields get this prefix (avoids collisions)

// For full join (many-to-many), use join instead of lookup.`,
  commandsShown: ["lookup", "sourceField:", "lookupField:", "prefix:"],
};

export const scenario08: ScenarioV2 = {
  id: "scenario_08_crypto_miner",
  difficulty: 4,
  stars: "★★★★☆",
  title: "The Crypto Miner",
  company: "{{companyName}}",
  briefing: "{{companyName}}'s AWS bill tripled this month. CPU usage across the K8s cluster is pegged at 100%. But application load hasn't changed. Someone — or something — is consuming resources that aren't yours to spend.",
  steps: [step1, step2, step3],
  variants: [
    {
      companyName: "EduSpark", serviceName: "content-delivery", hostName: "k8s-node-09",
      processGroup: "PROCESS_GROUP-K8S1", hostId: "HOST-K8S001",
      errorTimestamp: "ongoing", deploymentVersion: "v1.0.0-malicious",
      ipAddresses: ["10.0.13.4"], statusCodes: [],
      errorMessages: ["xmrig mining XMR", "pool connected"],
      configKey: "monitoring", configValue: "sidecar-metrics container in 'monitoring' namespace",
      errorCounts: [4821, 312, 1],
    },
    {
      companyName: "LearnLoop", serviceName: "video-transcoder", hostName: "k8s-worker-12",
      processGroup: "PROCESS_GROUP-K8S2", hostId: "HOST-K8S002",
      errorTimestamp: "ongoing", deploymentVersion: "v2.1.0-infected",
      ipAddresses: ["10.0.14.8"], statusCodes: [],
      errorMessages: ["xmrig started", "accepted share"],
      configKey: "kube-system", configValue: "health-checker container in 'kube-system' namespace",
      errorCounts: [5102, 287, 1],
    },
    {
      companyName: "StudyBase", serviceName: "assignment-grader", hostName: "eks-worker-03",
      processGroup: "PROCESS_GROUP-K8S3", hostId: "HOST-K8S003",
      errorTimestamp: "ongoing", deploymentVersion: "v0.9.9-backdoor",
      ipAddresses: ["172.16.4.15"], statusCodes: [],
      errorMessages: ["miner connected", "hashrate 1024 H/s"],
      configKey: "logging", configValue: "log-forwarder container in 'logging' namespace",
      errorCounts: [3940, 241, 1],
    },
  ],
  rootCause: "A compromised Helm chart's sidecar container ({{configValue}}) contained a hidden Monero miner that activated 72 hours after deployment.",
  postMortem: "A public Helm chart pulled from an unofficial registry contained a backdoored sidecar container image. The malware was dormant for 72 hours to evade automated scanning, then activated and began mining Monero using all available CPU. Fix: enforce image signing, restrict Helm chart sources to verified registries, implement CPU quota limits per namespace.",
  commandsUnlocked: ["lookup", "dt.entity.process_group", "k8s.namespace.name", "sourceField/lookupField/prefix"],
};
