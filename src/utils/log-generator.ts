import type { LogData, LogLevel } from "../types/game";

const SERVICES = ["api-auth", "api-gateway", "db-pool", "cache-service", "payment-processor"];
const ENDPOINTS = ["/login", "/api/users", "/api/orders", "/api/payments", "/api/health"];

const MESSAGES: Record<string, string[]> = {
  ERROR: [
    "JWT validation failed",
    "Database connection timeout",
    "Payment processor unavailable",
    "Memory limit exceeded",
    "Connection refused",
    "Null pointer exception",
    "Service unavailable",
  ],
  CRITICAL: [
    "Critical system failure",
    "Data corruption detected",
    "Unrecoverable error in core module",
  ],
  WARN: [
    "High latency detected",
    "Cache miss rate increasing",
    "Database pool near capacity",
    "Slow query detected",
    "Rate limit approaching",
  ],
  INFO: [
    "Request processed successfully",
    "User logged in",
    "Order created",
    "Cache cleared",
    "Health check passed",
  ],
  DEBUG: [
    "Query execution started",
    "Serializing response",
    "Cache lookup",
    "Connection opened",
    "Request received",
  ],
};

function randOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function tsOffset(baseMs: number, rangeMs: number): string {
  return new Date(baseMs - Math.random() * rangeMs).toISOString();
}

function tsInWindow(startIso: string, durationMinutes: number): string {
  const start = new Date(startIso).getTime();
  return new Date(start + Math.random() * durationMinutes * 60_000).toISOString();
}

// ---- Generic background log generator ----

export function generateMockLogs(count: number): LogData[] {
  const logs: LogData[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const levelRoll =
      i < count * 0.05 ? "ERROR" : i < count * 0.15 ? "WARN" : i < count * 0.6 ? "INFO" : "DEBUG";
    const level = levelRoll as LogLevel;
    const service = randOf(SERVICES);

    logs.push({
      id: `log-${i}`,
      timestamp: tsOffset(now, 3_600_000),
      service,
      level,
      message: randOf(MESSAGES[level] ?? MESSAGES.INFO),
      userId: String(Math.floor(Math.random() * 100_000)),
      endpoint: randOf(ENDPOINTS),
      duration: `${Math.floor(Math.random() * 500) + 10}ms`,
      statusCode: level === "ERROR" ? 500 : 200,
    });
  }
  return logs;
}

// ---- Case-specific generators ----

export function generateCase1Logs(): LogData[] {
  const base = generateMockLogs(10_000).filter(
    (l) => !(l.service === "api-auth" && l.level === "ERROR")
  );

  base.push({
    id: "log-injected-case1",
    timestamp: "2024-04-09T14:32:17Z",
    service: "api-auth",
    level: "ERROR",
    message: "JWT validation failed for user_id=12847",
    userId: "12847",
    endpoint: "/login",
    duration: "23ms",
    statusCode: 401,
    isAnswer: true,
  });

  return base;
}

export function generateCase2Logs(): LogData[] {
  const base = generateMockLogs(24_900);

  // Background db-pool WARNs with low queryTime
  for (let i = 0; i < 80; i++) {
    base.push({
      id: `log-c2-bg-${i}`,
      timestamp: tsInWindow("2024-04-09T15:00:00Z", 90),
      service: "db-pool",
      level: "WARN",
      host: randOf(["db-prod-01", "db-prod-02"]),
      message: `Query execution time: ${200 + Math.floor(Math.random() * 2800)}ms`,
      queryTime: 200 + Math.floor(Math.random() * 2800),
      duration: "1200ms",
    });
  }

  // Answer logs: db-prod-01, WARN, queryTime > 3000
  for (let i = 0; i < 20; i++) {
    const qt = 3100 + Math.floor(Math.random() * 4900);
    base.push({
      id: `log-c2-answer-${i}`,
      timestamp: "2024-04-09T15:47:23Z",
      service: "db-pool",
      level: "WARN",
      host: "db-prod-01",
      message: `Query execution time: ${qt}ms`,
      queryTime: qt,
      duration: `${qt}ms`,
      isAnswer: i === 0,
    });
  }

  return base;
}

export function generateCase3Logs(): LogData[] {
  const base = generateMockLogs(49_627);

  const distribution = [
    { hour: 14, count: 20 },
    { hour: 15, count: 30 },
    { hour: 16, count: 234 },
    { hour: 17, count: 89 },
  ];

  let idx = 0;
  let goldenSet = false;

  for (const { hour, count } of distribution) {
    for (let i = 0; i < count; i++) {
      const mm = String(Math.floor(Math.random() * 60)).padStart(2, "0");
      const ss = String(Math.floor(Math.random() * 60)).padStart(2, "0");
      const hh = String(hour).padStart(2, "0");
      const isGolden = hour === 16 && !goldenSet && i === 0;
      if (isGolden) goldenSet = true;

      base.push({
        id: `log-c3-answer-${idx}`,
        timestamp: `2024-04-09T${hh}:${mm}:${ss}Z`,
        service: "payment-processor",
        level: "ERROR",
        message: "Payment processing failed",
        transactionId: `txn_${800000 + idx}`,
        responseCode: "500",
        amount: Math.floor(Math.random() * 100_000) / 100,
        isAnswer: isGolden,
      });
      idx++;
    }
  }

  return base;
}

export function generateCase4Logs(): LogData[] {
  const base = generateMockLogs(97_155);

  const outageServices: Array<{ service: string; errors: number; criticals: number }> = [
    { service: "api-gateway",        errors: 1247, criticals: 0   },
    { service: "db-pool",            errors: 892,  criticals: 50  },
    { service: "cache-service",      errors: 456,  criticals: 30  },
    { service: "payment-processor",  errors: 200,  criticals: 10  },
    { service: "api-auth",           errors: 150,  criticals: 0   },
  ];

  let idx = 0;
  let goldenSet = false;

  for (const { service, errors, criticals } of outageServices) {
    const total = errors + criticals;
    for (let i = 0; i < total; i++) {
      const isErr = i < errors;
      const level: LogLevel = isErr ? "ERROR" : "CRITICAL";
      const ts = tsInWindow("2024-04-09T18:30:00Z", 45);
      const isGolden = service === "api-gateway" && !goldenSet && i === 0;
      if (isGolden) goldenSet = true;

      base.push({
        id: `log-c4-answer-${idx}`,
        timestamp: ts,
        service,
        level,
        message: isErr ? "Upstream service unavailable" : "Critical system failure",
        endpoint: "/api/v1/resource",
        duration: `${1000 + Math.floor(Math.random() * 4000)}ms`,
        statusCode: 503,
        isAnswer: isGolden,
      });
      idx++;
    }
  }

  return base;
}
