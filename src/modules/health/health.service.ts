import type {
  HealthCheckResult,
  HealthStatus,
  ReadinessCheckResult,
} from "@/modules/health/health.types";

export type DatabaseHealthChecker = () => Promise<boolean>;

const defaultDatabaseHealthChecker: DatabaseHealthChecker = async () => {
  const { checkDatabaseHealth } = await import("@/infrastructure/database/drizzle/health-check");

  return checkDatabaseHealth();
};

export class HealthService {
  private readonly checkDatabase: DatabaseHealthChecker;

  constructor(checkDatabase: DatabaseHealthChecker = defaultDatabaseHealthChecker) {
    this.checkDatabase = checkDatabase;
  }

  getHealth(): HealthCheckResult {
    return {
      status: "ok",
    };
  }

  async getReadiness(): Promise<ReadinessCheckResult> {
    const isDatabaseHealthy = await this.checkDatabase();
    const databaseStatus: HealthStatus = isDatabaseHealthy ? "ok" : "unavailable";

    return {
      status: isDatabaseHealthy ? "ok" : "unavailable",
      checks: {
        database: databaseStatus,
      },
    };
  }
}
