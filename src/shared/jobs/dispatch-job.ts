import { isJobName, JobName, type TJobName } from "@/shared/jobs/job-names";
import { parseJobPayload } from "@/shared/jobs/job-payloads";
import type { JobHandlerMap } from "@/shared/jobs/job-queue.port";

export const dispatchJob = async (
  handlers: JobHandlerMap,
  name: string,
  data: unknown,
): Promise<void> => {
  if (!isJobName(name)) {
    throw new Error(`Unknown job name: ${name}`);
  }

  await runJobHandler(handlers, name, data);
};

const runJobHandler = async <K extends TJobName>(
  handlers: JobHandlerMap,
  name: K,
  data: unknown,
): Promise<void> => {
  switch (name) {
    case JobName.APPLY_ACCOUNT_DELETION:
      await handlers[JobName.APPLY_ACCOUNT_DELETION](
        parseJobPayload(JobName.APPLY_ACCOUNT_DELETION, data),
      );
      return;
    case JobName.APPLY_DUE_ACCOUNT_DELETIONS:
      await handlers[JobName.APPLY_DUE_ACCOUNT_DELETIONS](
        parseJobPayload(JobName.APPLY_DUE_ACCOUNT_DELETIONS, data),
      );
      return;
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown job name: ${String(exhaustive)}`);
    }
  }
};
