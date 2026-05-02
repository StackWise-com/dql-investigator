const SERVICES = [
  'checkout-service', 'auth-api', 'payment-gateway', 'user-store',
  'inventory-service', 'recommendation-engine', 'notification-service',
  'api-gateway', 'session-manager', 'cache-layer', 'order-processor',
  'product-catalog', 'search-service', 'analytics-collector'
];

const NAMESPACES = ['production', 'staging', 'database', 'infrastructure', 'monitoring'];
const HOSTS = ['ip-10-0-1-22', 'ip-10-0-1-45', 'ip-10-0-2-11', 'k8s-node-03', 'k8s-node-07'];
const LEVELS = ['INFO', 'INFO', 'INFO', 'WARN', 'WARN', 'ERROR', 'ERROR', 'DEBUG', 'NONE'];

const MESSAGES = {
  INFO: [
    'Request processed successfully | method=GET path=/api/checkout statusCode=200 responseTime=${rt}ms',
    'Cache entry updated | key=user:${uid} ttl=3600',
    'Service health check passed | uptime=${up}s memoryUsed=${mem}MB',
    'Database query executed | table=orders rows=${rows} duration=${rt}ms',
    'JWT token validated | userId=${uid} expiresIn=3600s',
    'Message published to queue | topic=order-events partitionKey=${uid}',
    'Configuration reloaded | version=v${v} changedKeys=3',
  ],
  WARN: [
    'Response time exceeded threshold | method=POST path=/api/payment responseTime=${rt}ms threshold=500ms',
    'Retry attempt ${n}/3 | service=payment-gateway reason=TIMEOUT',
    'Memory usage approaching limit | used=${mem}MB limit=512MB percentage=${pct}%',
    'Connection pool near capacity | active=${n} max=50 waiting=3',
    'Circuit breaker in HALF_OPEN state | service=inventory failureRate=45%',
    'Rate limit approaching | endpoint=/api/search remaining=12 resetIn=45s',
    'Slow database query detected | query=SELECT duration=${rt}ms slowQueryThreshold=200ms',
  ],
  ERROR: [
    'NullPointerException in PaymentService.processOrder() | traceId=${tid} userId=${uid}',
    'Database connection timeout after ${rt}ms | host=postgres-primary:5432 retries=3',
    'Failed to authenticate bearer token | userId=${uid} reason=TOKEN_EXPIRED',
    'HTTP 503 Service Unavailable from upstream | service=inventory-service retryAfter=30s',
    'Unhandled exception in OrderProcessor | error=IllegalStateException stackTrace=...',
    'Failed to publish message | topic=payment-events broker=kafka-01 errorCode=BROKER_NOT_AVAILABLE',
    'Out of memory error | used=512MB limit=512MB | service=recommendation-engine',
  ],
  DEBUG: [
    'Entering method processOrder() | orderId=${oid}',
    'SQL query: SELECT * FROM orders WHERE userId = ${uid} | executionTime=${rt}ms',
    'Cache hit for key user:${uid} | hitRate=0.87',
    'Thread pool state | active=4 queued=2 completed=1847',
    'Deserializing request body | contentType=application/json size=1.2KB',
  ],
  NONE: [
    'heartbeat',
    'ping',
    'keepalive | interval=30s',
  ]
};

function interpolate(template) {
  return template
    .replace('${rt}', Math.floor(Math.random() * 2000))
    .replace('${uid}', Math.floor(Math.random() * 99999))
    .replace('${oid}', 'ord-' + Math.random().toString(36).slice(2, 10))
    .replace('${tid}', Math.random().toString(36).slice(2, 18))
    .replace('${mem}', Math.floor(200 + Math.random() * 300))
    .replace('${pct}', Math.floor(60 + Math.random() * 35))
    .replace('${n}', Math.floor(1 + Math.random() * 3))
    .replace('${v}', Math.floor(Math.random() * 99))
    .replace('${rows}', Math.floor(Math.random() * 500))
    .replace('${up}', Math.floor(Math.random() * 86400));
}

export function generateLogs(count = 2000) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const msgTemplate = MESSAGES[level][Math.floor(Math.random() * MESSAGES[level].length)];
    const responseTime = Math.floor(Math.random() * 2000);
    return {
      timestamp: new Date(now - i * 1800 - Math.random() * 3600000).toISOString(),
      loglevel: level,
      content: interpolate(msgTemplate),
      service: service,
      host: HOSTS[Math.floor(Math.random() * HOSTS.length)],
      namespace: NAMESPACES[Math.floor(Math.random() * NAMESPACES.length)],
      responseTime,
      statusCode: level === 'ERROR' ? (Math.random() > 0.5 ? 500 : 503) : level === 'WARN' ? 429 : 200,
      traceId: Math.random().toString(36).slice(2, 18),
      spanId: Math.random().toString(36).slice(2, 10),
      userId: Math.floor(Math.random() * 99999),
      dt: {
        entity: `SERVICE-${Math.random().toString(36).slice(2, 18).toUpperCase()}`,
        process: `PROCESS_GROUP_INSTANCE-${Math.random().toString(36).slice(2, 18).toUpperCase()}`
      }
    };
  });
}
