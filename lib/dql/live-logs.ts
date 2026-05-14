import * as fs from "fs";
import * as path from "path";
import { getCurrentBucketId, BUCKET_MS } from "./bucket";
import { getDumpDir } from "./log-rotator";
import type { DQLRecord } from "@/lib/types/dql";

/** Re-export for convenience. */
export { getCurrentBucketId, BUCKET_MS };

/** The live seed is simply the current bucket ID. */
export function getLiveSeed(): number {
  return getCurrentBucketId();
}

/** Load a dump file from the current bucket (server-side only). */
export function loadDumpFile(
  logType: string,
  bucketId?: number
): DQLRecord[] {
  const bucket = bucketId ?? getCurrentBucketId();
  const dir = getDumpDir(bucket);
  const filePath = path.join(dir, `${logType}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Dump file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as DQLRecord[];
}

/** Check whether a dump file exists for the given log type in the current bucket. */
export function hasDumpFile(logType: string, bucketId?: number): boolean {
  const bucket = bucketId ?? getCurrentBucketId();
  const filePath = path.join(getDumpDir(bucket), `${logType}.json`);
  return fs.existsSync(filePath);
}

/** Map a scenario ID to its primary log type. Used by the serving API and loaders. */
export function getLogTypeForScenario(scenarioId: string): string {
  if (scenarioId.startsWith("case-001")) return "auth";
  if (scenarioId.startsWith("case-002")) return "db";
  if (scenarioId.startsWith("case-003")) return "biz-events";
  if (scenarioId.startsWith("case-004")) return "spans";
  if (scenarioId.startsWith("case-005")) return "app";
  if (scenarioId.startsWith("case-022")) return "events-with-tags";
  if (scenarioId.startsWith("onboard-")) return "auth";
  if (scenarioId.startsWith("dpl-001") || scenarioId.startsWith("dpl-002")) return "nginx";
  if (scenarioId.startsWith("dpl-003") || scenarioId.startsWith("dpl-004")) return "syslog";
  if (scenarioId.startsWith("dpl-005") || scenarioId.startsWith("dpl-006")) return "firewall";
  if (scenarioId.startsWith("dpl-007") || scenarioId.startsWith("dpl-008")) return "json";
  if (scenarioId.startsWith("dpl-009") || scenarioId.startsWith("dpl-010")) return "apache";
  if (scenarioId.startsWith("dpl-011") || scenarioId.startsWith("dpl-012")) return "payment";
  if (scenarioId.startsWith("combo-")) return "nginx";
  if (scenarioId.startsWith("case-0")) return "auth";
  return "auth";
}
