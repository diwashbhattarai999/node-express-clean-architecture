export const JobName = {
  APPLY_ACCOUNT_DELETION: "apply-account-deletion",
  APPLY_DUE_ACCOUNT_DELETIONS: "apply-due-account-deletions",
} as const;

export type TJobName = (typeof JobName)[keyof typeof JobName];

export const isJobName = (value: string): value is TJobName =>
  Object.values(JobName).includes(value as TJobName);

export const accountDeletionJobId = (userId: string): string =>
  `${JobName.APPLY_ACCOUNT_DELETION}__${userId}`;
