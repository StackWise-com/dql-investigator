import type { DQLRecord } from "@/lib/types/dql";

// Simple seeded LCG for deterministic output
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randItem<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatTimestamp(base: Date, offsetSeconds: number) {
  const d = new Date(base.getTime() + offsetSeconds * 1000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}Z`;
}

// ─── Auth Logs (case-001) ───
export function generateAuthLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-01-15T08:30:00Z");
  const users = [
    "alice", "bob", "charlie", "dave", "eve", "frank", "grace", "heidi",
    "ivan", "judy", "admin", "root", "guest", "support", "ops", "dev",
    "testuser", "api-client", "service-account", "backup",
  ];
  const ips = Array.from({ length: 80 }, (_, i) => {
    const a = randInt(rng, 10, 223);
    const b = randInt(rng, 0, 255);
    const c = randInt(rng, 0, 255);
    const d = randInt(rng, 1, 254);
    return `${a}.${b}.${c}.${d}`;
  });
  // Ensure a few "signal" IPs appear for the attacker pattern
  const signalIps = ["192.168.1.45", "192.168.1.99", "10.0.0.77", "172.16.0.5"];
  const hosts = ["prod-01", "prod-02", "prod-03", "prod-04", "prod-05"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 1, 25);
    const isSignal = i < signalIps.length * 15; // embed signal records
    const isError = isSignal ? true : rng() < 0.3;
    const isWarn = !isError && rng() < 0.1;
    const level = isError ? "ERROR" : isWarn ? "WARN" : "INFO";

    const user = isSignal && isError ? "admin" : randItem(rng, users);
    const ip = isSignal && isError ? signalIps[i % signalIps.length] : randItem(rng, ips);
    const host = randItem(rng, hosts);

    let content: string;
    if (level === "INFO") {
      content = `Login success for user=${user} from ip=${ip}`;
    } else if (level === "WARN") {
      content = `Suspicious login attempt for user=${user} from ip=${ip}`;
    } else {
      // ERROR — use attacker_ip= so parse command can extract it
      content = `Login failed for user=${user} from attacker_ip=${ip}`;
    }

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      loglevel: level,
      "log.source": "auth-service",
      content,
      host,
    });
  }

  return records;
}

// ─── Database Logs (case-002) ───
export function generateDbLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-01-15T12:00:00Z");
  const queries = [
    "SELECT * FROM orders WHERE created_at > now() - 1h",
    "SELECT COUNT(*) FROM users",
    "SELECT * FROM inventory",
    "UPDATE users SET last_login = now()",
    "INSERT INTO audit_log VALUES (...)",
    "DELETE FROM sessions WHERE expiry < now()",
    "SELECT * FROM products WHERE status = 'active'",
    "SELECT id, name FROM customers",
    "ALTER TABLE orders ADD COLUMN tracking_id",
    "VACUUM ANALYZE",
  ];
  const hosts = ["db-01", "db-02", "db-03", "db-replica-01", "db-replica-02"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 2, 40);
    const isSlow = rng() < 0.35;
    const isInfo = !isSlow && rng() < 0.6;
    const level = isSlow ? "WARN" : isInfo ? "INFO" : "ERROR";
    const host = randItem(rng, hosts);
    const query = randItem(rng, queries);
    const duration_ms = isSlow
      ? randInt(rng, 3000, 12000)
      : level === "ERROR"
      ? randInt(rng, 500, 3000)
      : randInt(rng, 20, 300);

    // Embed query_type for parse-based cases (case-030)
    const queryType = query.startsWith("SELECT") ? "SELECT" : query.startsWith("INSERT") ? "INSERT" : query.startsWith("UPDATE") ? "UPDATE" : query.startsWith("DELETE") ? "DELETE" : "ALTER";

    let content: string;
    if (level === "WARN") {
      content = `Slow query detected: query_type=${queryType} ${query}`;
    } else if (level === "ERROR") {
      content = `Query failed: query_type=${queryType} ${query}`;
    } else {
      content = `Query completed in ${duration_ms}ms: query_type=${queryType} ${query}`;
    }

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      loglevel: level,
      "log.source": "database",
      content,
      host,
      duration_ms,
    });
  }

  return records;
}

// ─── Events (case-002) ───
export function generateEvents(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-01-15T09:00:00Z");
  const services = [
    "checkout", "cart", "catalog", "payment", "shipping",
    "inventory", "auth", "notifications", "user-service",
  ];
  const eventTypes = [
    "deployment", "alert", "scale-up", "restart", "config-change",
  ];
  const hosts = Array.from({ length: 20 }, (_, i) => `prod-${String(i + 1).padStart(2, "0")}`);

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 10, 120);
    const service = randItem(rng, services);
    const eventType = randItem(rng, eventTypes);
    const host = randItem(rng, hosts);

    const rec: DQLRecord = {
      timestamp: formatTimestamp(baseTime, elapsed),
      "event.type": eventType,
      service,
      host,
    };

    if (eventType === "deployment") {
      rec.version = `v${randInt(rng, 1, 5)}.${randInt(rng, 0, 9)}.${randInt(rng, 0, 9)}`;
      rec.status = rng() < 0.8 ? "success" : "failure";
    }
    if (eventType === "alert") {
      const severity = randItem(rng, ["critical", "warning", "info"]);
      rec.severity = severity;
      rec.message = severity === "critical"
        ? "CPU > 90%"
        : severity === "warning"
        ? "Memory pressure detected"
        : "Health check passed";
    }
    if (eventType === "scale-up") {
      rec.instances = randInt(rng, 1, 5);
    }

    records.push(rec);
  }

  return records;
}

// ─── Business Events (case-003) ───
export function generateBizEvents(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-01-15T10:00:00Z");
  const products = ["widget", "gadget", "thingamajig", "doohickey", "gizmo", "sprocket"];
  const methods = ["card", "paypal", "stripe", "applepay", "googlepay"];
  const eventTypes = [
    "com.easytrade.order_confirmed",
    "com.easytrade.payment_confirmed",
    "com.easytrade.close_order",
    "com.easytrade.shipping_label_created",
    "com.easytrade.order_cancelled",
  ];
  const accounts = Array.from({ length: 50 }, (_, i) => `ACC-${100 + i}`);

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 5, 90);
    const orderId = `ORD-${String(i).padStart(4, "0")}`;
    const amount = parseFloat((rng() * 500 + 10).toFixed(2));
    const product = randItem(rng, products);
    const accountId = randItem(rng, accounts);
    const eventType = randItem(rng, eventTypes);

    const rec: DQLRecord = {
      timestamp: formatTimestamp(baseTime, elapsed),
      "event.type": eventType,
      order_id: orderId,
      amount,
      product,
      accountId,
    };

    if (eventType === "com.easytrade.payment_confirmed") {
      rec.method = randItem(rng, methods);
    }
    if (eventType === "com.easytrade.close_order") {
      rec.status = rng() < 0.8 ? "fulfilled" : "returned";
    }
    if (eventType === "com.easytrade.order_cancelled") {
      rec.reason = rng() < 0.5 ? "customer_request" : "payment_failed";
    }

    records.push(rec);
  }

  return records;
}

// ─── Spans (case-004) ───
export function generateSpans(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-01-15T11:00:00Z");
  const endpoints = [
    "/api/users", "/api/orders", "/api/products", "/api/payment",
    "/api/shipping", "/api/inventory", "/api/reports", "/api/search",
    "/api/auth", "/api/notifications", "/api/cart", "/api/checkout",
  ];
  const services = [
    "user-service", "order-service", "catalog-service", "payment-service",
    "shipping-service", "inventory-service", "reporting-service", "search-service",
    "auth-service", "notification-service", "cart-service", "checkout-service",
  ];
  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 1, 20);
    const endpoint = randItem(rng, endpoints);
    const service = randItem(rng, services);
    const method = randItem(rng, methods);
    const isError = rng() < 0.15;
    const status = isError ? "ERROR" : "OK";
    const duration = isError
      ? randInt(rng, 50000, 400000)
      : randInt(rng, 5000, 150000);

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      "span.name": `${method} ${endpoint}`,
      duration,
      "status.code": status,
      "service.name": service,
      endpoint,
    });
  }

  return records;
}

// ─── Events with Tags (case-022) ───
export function generateEventsWithTags(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-01-15T09:00:00Z");
  const services = [
    "checkout", "cart", "catalog", "payment", "shipping",
    "inventory", "auth", "notifications", "user-service",
  ];
  const eventTypes = [
    "deployment", "alert", "scale-up", "restart", "config-change",
  ];
  const hosts = Array.from({ length: 20 }, (_, i) => `prod-${String(i + 1).padStart(2, "0")}`);

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 10, 120);
    const service = randItem(rng, services);
    const eventType = randItem(rng, eventTypes);
    const host = randItem(rng, hosts);

    const rec: DQLRecord = {
      timestamp: formatTimestamp(baseTime, elapsed),
      "event.type": eventType,
      service,
      host,
    };

    if (eventType === "deployment") {
      rec.version = `v${randInt(rng, 1, 5)}.${randInt(rng, 0, 9)}.${randInt(rng, 0, 9)}`;
      rec.status = rng() < 0.8 ? "success" : "failure";
    }
    if (eventType === "alert") {
      const severity = randItem(rng, ["critical", "warning", "info"]);
      rec.severity = severity;
      rec.message = severity === "critical"
        ? "CPU > 90%"
        : severity === "warning"
        ? "Memory pressure detected"
        : "Health check passed";
    }
    if (eventType === "scale-up") {
      rec.instances = randInt(rng, 1, 5);
    }

    // Embed tags array on ~15% of records, with signal patterns for case-022
    const isSignal = i < 30;
    if (isSignal) {
      rec.tags = ["critical", "deployment"];
    } else if (rng() < 0.15) {
      rec.tags = rng() < 0.5 ? ["warning"] : ["info", "scheduled"];
    }

    records.push(rec);
  }

  return records;
}

// ─── Application Logs (case-005) ───
export function generateAppLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-01-15T08:00:00Z");
  const errorMessages = [
    "Database connection timeout",
    "Out of memory",
    "NullPointerException in CartController",
    "Connection refused to redis-cache:6379",
    "SSL handshake failed",
    "Rate limit exceeded",
    "Thread pool exhausted",
    "Disk quota exceeded",
    "Failed to serialize response",
    "Circuit breaker open",
  ];
  const infoMessages = [
    "Request processed",
    "Cache hit for key: user_prefs",
    "Scheduled job started: cleanup-temp-files",
    "Health check passed",
    "Webhook delivered successfully",
    "User session refreshed",
    "Background sync completed",
  ];
  const warnMessages = [
    "High memory usage detected",
    "Retrying failed message delivery",
    "Deprecated API endpoint called",
    "Slow response time on /api/reports",
    "Queue depth exceeds threshold",
  ];
  const hosts = ["app-01", "app-02", "app-03", "app-04", "app-05", "app-06"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  const endpoints = [
    "/api/users", "/api/orders", "/api/products", "/api/payment",
    "/api/shipping", "/api/inventory", "/api/reports", "/api/search",
  ];

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 3, 35);
    const isError = rng() < 0.25;
    const isWarn = !isError && rng() < 0.15;
    const level = isError ? "ERROR" : isWarn ? "WARN" : "INFO";
    const host = randItem(rng, hosts);
    const endpoint = randItem(rng, endpoints);

    let content: string;
    if (level === "ERROR") {
      content = randItem(rng, errorMessages);
      // Embed endpoint patterns for parse-based cases (case-023)
      if (rng() < 0.4) {
        content = `Request failed on endpoint=${endpoint} - ${content}`;
      }
    } else if (level === "WARN") {
      content = randItem(rng, warnMessages);
      if (rng() < 0.3) {
        content = `Slow response on endpoint=${endpoint} - ${content}`;
      }
    } else {
      content = randItem(rng, infoMessages);
      if (rng() < 0.2) {
        content = `Request completed on endpoint=${endpoint} - ${content}`;
      }
    }

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      loglevel: level,
      content,
      host,
    });
  }

  return records;
}
