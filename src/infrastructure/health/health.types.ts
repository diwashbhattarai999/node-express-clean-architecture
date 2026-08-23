export type HealthStatus = "ok" | "degraded" | "unavailable";

export interface HealthCheckResult {
  status: HealthStatus;
}

export interface ReadinessCheckResult {
  status: HealthStatus;
  checks: Record<string, HealthStatus>;
}
