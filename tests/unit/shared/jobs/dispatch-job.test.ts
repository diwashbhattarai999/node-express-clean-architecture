import { describe, expect, it, vi } from "vitest";

import { dispatchJob } from "@/shared/jobs/dispatch-job";
import { JobName } from "@/shared/jobs/job-names";
import type { JobHandlerMap } from "@/shared/jobs/job-queue.port";

describe("dispatchJob", () => {
  const handlers: JobHandlerMap = {
    [JobName.APPLY_ACCOUNT_DELETION]: vi.fn(),
    [JobName.APPLY_DUE_ACCOUNT_DELETIONS]: vi.fn(),
  };

  it("dispatches a typed account deletion job", async () => {
    await dispatchJob(handlers, JobName.APPLY_ACCOUNT_DELETION, {
      userId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(handlers[JobName.APPLY_ACCOUNT_DELETION]).toHaveBeenCalledWith({
      userId: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("rejects an unknown job name", async () => {
    await expect(dispatchJob(handlers, "not-a-job", {})).rejects.toThrow("Unknown job name");
  });

  it("rejects an invalid payload", async () => {
    await expect(dispatchJob(handlers, JobName.APPLY_ACCOUNT_DELETION, {})).rejects.toThrow();
  });
});
