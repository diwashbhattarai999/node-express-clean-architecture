import { z } from "zod";

export const confirmMfaEnrollSchema = z.object({
  body: z.object({
    factorId: z.uuid({ error: "Factor id must be a valid UUID." }),
    code: z
      .string({ error: "Verification code is required." })
      .trim()
      .min(6, "Verification code is required.")
      .max(20, "Verification code is invalid."),
  }),
});

export type ConfirmMfaEnrollSchema = typeof confirmMfaEnrollSchema;
