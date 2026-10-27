import { describe, expect, it, vi } from "vitest";

import { HealthService } from "@/modules/health/health.service";

describe("HealthService", () => {
  it("returns ok for liveness checks", () => {
    const healthService = new HealthService();

    expect(healthService.getHealth()).toEqual({
      status: "ok",
    });
  });

  it("reports ready when the database and redis are healthy", async () => {
    const checkDatabase = vi.fn().mockResolvedValue(true);
    const checkRedis = vi.fn().mockResolvedValue(true);
    const healthService = new HealthService(checkDatabase, checkRedis);

    await expect(healthService.getReadiness()).resolves.toEqual({
      status: "ok",
      checks: {
        database: "ok",
        redis: "ok",
      },
    });
    expect(checkDatabase).toHaveBeenCalledOnce();
    expect(checkRedis).toHaveBeenCalledOnce();
  });

  it("reports unavailable when the database is unhealthy", async () => {
    const checkDatabase = vi.fn().mockResolvedValue(false);
    const checkRedis = vi.fn().mockResolvedValue(true);
    const healthService = new HealthService(checkDatabase, checkRedis);

    await expect(healthService.getReadiness()).resolves.toEqual({
      status: "unavailable",
      checks: {
        database: "unavailable",
        redis: "ok",
      },
    });
  });

  it("reports unavailable when redis is unhealthy", async () => {
    const checkDatabase = vi.fn().mockResolvedValue(true);
    const checkRedis = vi.fn().mockResolvedValue(false);
    const healthService = new HealthService(checkDatabase, checkRedis);

    await expect(healthService.getReadiness()).resolves.toEqual({
      status: "unavailable",
      checks: {
        database: "ok",
        redis: "unavailable",
      },
    });
  });
});
