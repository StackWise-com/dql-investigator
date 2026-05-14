import { schedule, validate } from "node-cron";
import { rotateNow, getCurrentBucketId } from "./log-rotator";

let job: ReturnType<typeof schedule> | null = null;
let started = false;

export function startLogRotationCron() {
  if (started) return;
  started = true;

  // Run immediately so dumps exist before the first user arrives
  try {
    rotateNow();
  } catch (err) {
    console.error("[log-cron] Initial rotation failed:", err);
  }

  const expression = "0 */4 * * *";
  if (!validate(expression)) {
    console.error("[log-cron] Invalid cron expression:", expression);
    return;
  }

  // Schedule every 4 hours
  job = schedule(expression, () => {
    try {
      rotateNow();
    } catch (err) {
      console.error("[log-cron] Scheduled rotation failed:", err);
    }
  });

  console.log(
    `[log-cron] Auto-rotation active. Bucket ${getCurrentBucketId()}. Next run in ~4h.`
  );
}

export function stopLogRotationCron() {
  if (job) {
    job.stop();
    job.destroy();
    job = null;
  }
  started = false;
}
