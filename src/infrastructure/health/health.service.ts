import type { HealthCheckResult, ReadinessCheckResult } from "@/infrastructure/health/health.types";

export class HealthService {
  getHealth(): HealthCheckResult {
    return {
      status: "ok",
    };
  }

  getReadiness(): ReadinessCheckResult {
    return {
      status: "ok",
      checks: {},
    };
  }
}
