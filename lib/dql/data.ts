import type { DQLRecord } from "@/lib/types/dql";

export const sampleLogs: DQLRecord[] = [
  { timestamp: "2024-01-15T08:30:00Z", loglevel: "ERROR", "log.source": "auth-service", content: "Login failed for user=admin from ip=192.168.1.45", host: "prod-01", process_group: "auth" },
  { timestamp: "2024-01-15T08:31:00Z", loglevel: "INFO", "log.source": "api-gateway", content: "Request processed: /api/users/123", host: "prod-02", process_group: "api" },
  { timestamp: "2024-01-15T08:32:00Z", loglevel: "ERROR", "log.source": "auth-service", content: "Login failed for user=guest from ip=10.0.0.15", host: "prod-01", process_group: "auth" },
  { timestamp: "2024-01-15T08:33:00Z", loglevel: "WARN", "log.source": "database", content: "Slow query detected: SELECT * FROM orders", host: "prod-03", process_group: "db" },
  { timestamp: "2024-01-15T08:34:00Z", loglevel: "INFO", "log.source": "api-gateway", content: "Request processed: /api/orders/456", host: "prod-02", process_group: "api" },
  { timestamp: "2024-01-15T08:35:00Z", loglevel: "ERROR", "log.source": "auth-service", content: "Login failed for user=admin from ip=192.168.1.99", host: "prod-01", process_group: "auth" },
  { timestamp: "2024-01-15T08:36:00Z", loglevel: "INFO", "log.source": "worker", content: "Job completed: email-batch-42", host: "prod-04", process_group: "worker" },
  { timestamp: "2024-01-15T08:37:00Z", loglevel: "WARN", "log.source": "database", content: "Connection pool at 85% capacity", host: "prod-03", process_group: "db" },
  { timestamp: "2024-01-15T08:38:00Z", loglevel: "ERROR", "log.source": "api-gateway", content: "Timeout on /api/payment", host: "prod-02", process_group: "api" },
  { timestamp: "2024-01-15T08:39:00Z", loglevel: "INFO", "log.source": "worker", content: "Job started: report-daily", host: "prod-04", process_group: "worker" },
];

export const sampleEvents: DQLRecord[] = [
  { timestamp: "2024-01-15T09:00:00Z", "event.type": "deployment", service: "checkout", version: "v2.3.1", status: "success", host: "prod-05" },
  { timestamp: "2024-01-15T09:05:00Z", "event.type": "alert", service: "checkout", severity: "critical", message: "CPU > 90%", host: "prod-05" },
  { timestamp: "2024-01-15T09:10:00Z", "event.type": "deployment", service: "cart", version: "v1.8.2", status: "failure", host: "prod-06" },
  { timestamp: "2024-01-15T09:15:00Z", "event.type": "alert", service: "cart", severity: "warning", message: "Memory pressure", host: "prod-06" },
  { timestamp: "2024-01-15T09:20:00Z", "event.type": "deployment", service: "catalog", version: "v3.0.0", status: "success", host: "prod-07" },
  { timestamp: "2024-01-15T09:25:00Z", "event.type": "alert", service: "catalog", severity: "info", message: "Restart scheduled", host: "prod-07" },
];

export const sampleBizEvents: DQLRecord[] = [
  { timestamp: "2024-01-15T10:00:00Z", "event.type": "com.acme.order_confirmed", order_id: "ORD-001", amount: 150.00, product: "widget", accountId: "ACC-42" },
  { timestamp: "2024-01-15T10:01:00Z", "event.type": "com.acme.payment_confirmed", order_id: "ORD-001", amount: 150.00, method: "card", accountId: "ACC-42" },
  { timestamp: "2024-01-15T10:02:00Z", "event.type": "com.acme.close_order", order_id: "ORD-001", status: "fulfilled", accountId: "ACC-42" },
  { timestamp: "2024-01-15T10:05:00Z", "event.type": "com.acme.order_confirmed", order_id: "ORD-002", amount: 230.50, product: "gadget", accountId: "ACC-77" },
  { timestamp: "2024-01-15T10:06:00Z", "event.type": "com.acme.order_confirmed", order_id: "ORD-003", amount: 89.99, product: "widget", accountId: "ACC-42" },
  { timestamp: "2024-01-15T10:07:00Z", "event.type": "com.acme.payment_confirmed", order_id: "ORD-003", amount: 89.99, method: "paypal", accountId: "ACC-42" },
];

export const sampleSpans: DQLRecord[] = [
  { timestamp: "2024-01-15T11:00:00Z", "span.name": "GET /api/users", duration: 45000, "status.code": "OK", "service.name": "user-service", endpoint: "/api/users" },
  { timestamp: "2024-01-15T11:01:00Z", "span.name": "POST /api/orders", duration: 120000, "status.code": "OK", "service.name": "order-service", endpoint: "/api/orders" },
  { timestamp: "2024-01-15T11:02:00Z", "span.name": "GET /api/products", duration: 89000, "status.code": "ERROR", "service.name": "catalog-service", endpoint: "/api/products" },
  { timestamp: "2024-01-15T11:03:00Z", "span.name": "GET /api/users", duration: 34000, "status.code": "OK", "service.name": "user-service", endpoint: "/api/users" },
  { timestamp: "2024-01-15T11:04:00Z", "span.name": "POST /api/payment", duration: 250000, "status.code": "ERROR", "service.name": "payment-service", endpoint: "/api/payment" },
];

export function getSampleData(source: string): DQLRecord[] {
  switch (source) {
    case "logs":
      return [...sampleLogs];
    case "events":
      return [...sampleEvents];
    case "bizevents":
      return [...sampleBizEvents];
    case "spans":
      return [...sampleSpans];
    default:
      return [];
  }
}
