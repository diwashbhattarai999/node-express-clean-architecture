import { describe, expect, it, vi } from "vitest";

import { HealthService } from "@/modules/health/health.service";

describe("HealthService", () => {
  it("returns ok for liveness checks", () => {
    const healthService = new HealthService();

    expect(healthService.getHealth()).toEqual({
      status: "ok",
    });
  });

  it("reports ready when the database is healthy", async () => {
    const checkDatabase = vi.fn().mockResolvedValue(true);
    const healthService = new HealthService(checkDatabase);

    await expect(healthService.getReadiness()).resolves.toEqual({
      status: "ok",
      checks: {
        database: "ok",
      },
    });
    expect(checkDatabase).toHaveBeenCalledOnce();
  });

  it("reports unavailable when the database is unhealthy", async () => {
    const checkDatabase = vi.fn().mockResolvedValue(false);
    const healthService = new HealthService(checkDatabase);

    await expect(healthService.getReadiness()).resolves.toEqual({
      status: "unavailable",
      checks: {
        database: "unavailable",
      },
    });
  });
});
