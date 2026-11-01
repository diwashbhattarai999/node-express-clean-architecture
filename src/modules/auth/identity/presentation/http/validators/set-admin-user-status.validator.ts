import { z } from "zod";

import { ACCOUNT_DELETION_REASON_MAX_LENGTH } from "@/modules/auth/identity/application/constants/account-deletion";

export const setAdminUserStatusSchema = z.object({
  params: z.object({
    userId: z.uuid({ error: "User id must be a valid UUID." }),
  }),
  body: z
    .object({
      reason: z
        .string({ error: "Reason must be a string." })
        .trim()
        .max(
          ACCOUNT_DELETION_REASON_MAX_LENGTH,
          `Reason must be at most ${ACCOUNT_DELETION_REASON_MAX_LENGTH} characters.`,
        )
        .optional(),
    })
    .optional()
    .default({}),
});

export type SetAdminUserStatusSchema = typeof setAdminUserStatusSchema;
