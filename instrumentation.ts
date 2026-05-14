export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startLogRotationCron } = await import("@/lib/dql/log-cron");
      startLogRotationCron();
    } catch (err) {
      console.error("[instrumentation] Failed to start log rotation cron:", err);
    }
  }
}
