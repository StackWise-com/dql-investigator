import * as fs from "fs";
import * as path from "path";
import {
  generateAuthLogs,
  generateDbLogs,
  generateEvents,
  generateBizEvents,
  generateSpans,
  generateAppLogs,
  generateEventsWithTags,
  generateNginxLogs,
  generateSyslogLines,
  generateFirewallLogs,
  generateJsonLogs,
  generateApacheLogs,
  generatePaymentLogs,
  generateK8sLogs,
  generateApiGatewayLogs,
} from "./log-generator";
import type { DQLRecord } from "@/lib/types/dql";
import { BUCKET_MS, getCurrentBucketId } from "./bucket";

export { BUCKET_MS, getCurrentBucketId };

/** Number of buckets to keep before deleting old ones (~24 hours worth). */
export const KEEP_BUCKETS = 6;

/** Root directory for log dumps. */
export const DUMP_ROOT = path.join(process.cwd(), "public", "log-dumps");

export function getDumpDir(bucketId: number): string {
  return path.join(DUMP_ROOT, String(bucketId));
}

interface LogSet {
  auth: DQLRecord[];
  db: DQLRecord[];
  events: DQLRecord[];
  bizEvents: DQLRecord[];
  spans: DQLRecord[];
  app: DQLRecord[];
  eventsWithTags: DQLRecord[];
  nginx: DQLRecord[];
  syslog: DQLRecord[];
  firewall: DQLRecord[];
  json: DQLRecord[];
  apache: DQLRecord[];
  payment: DQLRecord[];
  k8s: DQLRecord[];
  apiGateway: DQLRecord[];
}

function generateAllLogs(seed: number): LogSet {
  return {
    auth: generateAuthLogs(3000, seed),
    db: generateDbLogs(3000, seed),
    events: generateEvents(2000, seed),
    bizEvents: generateBizEvents(2000, seed),
    spans: generateSpans(2000, seed),
    app: generateAppLogs(3000, seed),
    eventsWithTags: generateEventsWithTags(2000, seed),
    nginx: generateNginxLogs(2000, seed),
    syslog: generateSyslogLines(2000, seed),
    firewall: generateFirewallLogs(2000, seed),
    json: generateJsonLogs(2000, seed),
    apache: generateApacheLogs(2000, seed),
    payment: generatePaymentLogs(2000, seed),
    k8s: generateK8sLogs(2000, seed),
    apiGateway: generateApiGatewayLogs(2000, seed),
  };
}

function ensureDumpDir(bucketId: number): string {
  const dir = getDumpDir(bucketId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function writeDump(bucketId: number, logs: LogSet): void {
  const dir = ensureDumpDir(bucketId);

  const manifest: Record<string, string> = {};

  const writeFile = (key: string, data: DQLRecord[]) => {
    const filePath = path.join(dir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    manifest[key] = `${key}.json`;
  };

  writeFile("auth", logs.auth);
  writeFile("db", logs.db);
  writeFile("events", logs.events);
  writeFile("biz-events", logs.bizEvents);
  writeFile("spans", logs.spans);
  writeFile("app", logs.app);
  writeFile("events-with-tags", logs.eventsWithTags);
  writeFile("nginx", logs.nginx);
  writeFile("syslog", logs.syslog);
  writeFile("firewall", logs.firewall);
  writeFile("json", logs.json);
  writeFile("apache", logs.apache);
  writeFile("payment", logs.payment);
  writeFile("k8s", logs.k8s);
  writeFile("api-gateway", logs.apiGateway);

  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify({ bucketId, createdAt: new Date().toISOString(), files: manifest }, null, 2),
    "utf-8"
  );
}

export function cleanupOldDumps(keepBuckets = KEEP_BUCKETS): void {
  if (!fs.existsSync(DUMP_ROOT)) return;

  const currentBucket = getCurrentBucketId();
  const entries = fs.readdirSync(DUMP_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const bucketId = parseInt(entry.name, 10);
    if (Number.isNaN(bucketId)) continue;

    if (currentBucket - bucketId >= keepBuckets) {
      const dirPath = path.join(DUMP_ROOT, entry.name);
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`[log-rotator] Cleaned up old bucket ${bucketId}`);
    }
  }
}

export function ensureCurrentDump(): number {
  const bucketId = getCurrentBucketId();
  const dir = getDumpDir(bucketId);

  if (fs.existsSync(path.join(dir, "manifest.json"))) {
    return bucketId;
  }

  console.log(`[log-rotator] Generating logs for bucket ${bucketId}...`);
  const logs = generateAllLogs(bucketId);
  writeDump(bucketId, logs);
  console.log(`[log-rotator] Bucket ${bucketId} ready.`);
  return bucketId;
}

export function rotateNow(): number {
  const bucketId = ensureCurrentDump();
  cleanupOldDumps();
  return bucketId;
}
