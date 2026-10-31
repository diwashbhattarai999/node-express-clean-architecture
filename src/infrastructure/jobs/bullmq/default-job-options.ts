import type { JobsOptions } from "bullmq";

export type DefaultJobOptionsInput = {
  attempts: number;
};

export const createDefaultJobOptions = (input: DefaultJobOptionsInput): JobsOptions => ({
  attempts: input.attempts,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: {
    count: 1000,
  },
  removeOnFail: {
    count: 5000,
  },
});
