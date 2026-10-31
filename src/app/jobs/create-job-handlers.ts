import type { ApplyAccountDeletionsUseCase } from "@/modules/auth/identity/application/use-cases/apply-account-deletions.use-case";
import { JobName } from "@/shared/jobs/job-names";
import type { JobHandlerMap } from "@/shared/jobs/job-queue.port";
import { logger } from "@/shared/logger/logger";

export type CreateJobHandlersOptions = {
  applyAccountDeletionsUseCase: ApplyAccountDeletionsUseCase;
};

export const createJobHandlers = (options: CreateJobHandlersOptions): JobHandlerMap => ({
  [JobName.APPLY_ACCOUNT_DELETION]: async (payload) => {
    const result = await options.applyAccountDeletionsUseCase.execute({
      userId: payload.userId,
    });

    logger.info(
      { userId: payload.userId, appliedUserIds: result.appliedUserIds },
      "Applied scheduled account deletion",
    );
  },

  [JobName.APPLY_DUE_ACCOUNT_DELETIONS]: async () => {
    const result = await options.applyAccountDeletionsUseCase.execute();

    logger.info({ appliedUserIds: result.appliedUserIds }, "Applied due account deletions");
  },
});
