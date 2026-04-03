import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

type AppMetrics = {
  registry: Registry;
  apiRequestTotal: Counter<"method" | "route" | "status">;
  apiRequestDurationSeconds: Histogram<"method" | "route" | "status">;
};

declare global {
  var __sharebiteAppMetrics: AppMetrics | undefined;
}

function createAppMetrics(): AppMetrics {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: "sharebite_web_" });

  const apiRequestTotal = new Counter({
    name: "sharebite_api_requests_total",
    help: "Total number of API requests handled by secured route handlers.",
    labelNames: ["method", "route", "status"],
    registers: [registry],
  });

  const apiRequestDurationSeconds = new Histogram({
    name: "sharebite_api_request_duration_seconds",
    help: "API request duration in seconds.",
    labelNames: ["method", "route", "status"],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [registry],
  });

  return {
    registry,
    apiRequestTotal,
    apiRequestDurationSeconds,
  };
}

const metrics = globalThis.__sharebiteAppMetrics ?? createAppMetrics();
if (!globalThis.__sharebiteAppMetrics) {
  globalThis.__sharebiteAppMetrics = metrics;
}

export function normalizeRoute(pathname: string): string {
  if (!pathname) return "/unknown";

  return pathname
    .replace(/\/[0-9]+(?=\/|$)/g, "/:id")
    .replace(/\/[0-9a-fA-F]{8}-[0-9a-fA-F-]{27,}(?=\/|$)/g, "/:id")
    .replace(/\/[A-Za-z0-9_-]{20,}(?=\/|$)/g, "/:id");
}

export function observeApiRequest(params: {
  method: string;
  route: string;
  status: number;
  durationMs: number;
}) {
  const method = (params.method || "GET").toUpperCase();
  const route = params.route || "/unknown";
  const status = String(params.status || 500);
  const durationSeconds = Math.max(params.durationMs, 0) / 1000;

  metrics.apiRequestTotal.inc({ method, route, status });
  metrics.apiRequestDurationSeconds.observe(
    { method, route, status },
    durationSeconds,
  );
}

export function getAppMetricsContentType() {
  return metrics.registry.contentType;
}

export async function getAppMetrics() {
  return metrics.registry.metrics();
}
