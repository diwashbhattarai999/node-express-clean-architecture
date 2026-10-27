import type {
  HealthCheckResult,
  HealthStatus,
  ReadinessCheckResult,
} from "@/modules/health/health.types";

export type DependencyHealthChecker = () => Promise<boolean>;

const defaultDatabaseHealthChecker: DependencyHealthChecker = async () => {
  const { checkDatabaseHealth } = await import("@/infrastructure/database/drizzle/health-check");

  return checkDatabaseHealth();
};

const defaultRedisHealthChecker: DependencyHealthChecker = async () => {
  const { checkRedisHealth } = await import("@/infrastructure/redis/health-check");

  return checkRedisHealth();
};

export class HealthService {
  private readonly checkDatabase: DependencyHealthChecker;
  private readonly checkRedis: DependencyHealthChecker;

  constructor(
    checkDatabase: DependencyHealthChecker = defaultDatabaseHealthChecker,
    checkRedis: DependencyHealthChecker = defaultRedisHealthChecker,
  ) {
    this.checkDatabase = checkDatabase;
    this.checkRedis = checkRedis;
  }

  getHealth(): HealthCheckResult {
    return {
      status: "ok",
    };
  }

  async getReadiness(): Promise<ReadinessCheckResult> {
    const [isDatabaseHealthy, isRedisHealthy] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const databaseStatus: HealthStatus = isDatabaseHealthy ? "ok" : "unavailable";
    const redisStatus: HealthStatus = isRedisHealthy ? "ok" : "unavailable";
    const isReady = isDatabaseHealthy && isRedisHealthy;

    return {
      status: isReady ? "ok" : "unavailable",
      checks: {
        database: databaseStatus,
        redis: redisStatus,
      },
    };
  }
}
