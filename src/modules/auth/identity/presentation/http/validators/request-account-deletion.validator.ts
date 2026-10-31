import { z } from "zod";

import { ACCOUNT_DELETION_REASON_MAX_LENGTH } from "@/modules/auth/identity/application/constants/account-deletion";

export const requestAccountDeletionSchema = z.object({
  body: z
    .object({
      password: z
        .string({ error: "Password is required." })
        .min(1, "Password is required.")
        .optional(),
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

export type RequestAccountDeletionSchema = typeof requestAccountDeletionSchema;
export type RequestAccountDeletionInput = z.infer<RequestAccountDeletionSchema>["body"];
