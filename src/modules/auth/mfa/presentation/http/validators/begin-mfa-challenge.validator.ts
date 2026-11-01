import { z } from "zod";

export const beginMfaChallengeSchema = z.object({
  body: z.object({
    mfaToken: z.string({ error: "MFA token is required." }).trim().min(1, "MFA token is required."),
    factorId: z.uuid({ error: "Factor id must be a valid UUID." }).optional(),
  }),
});

export type BeginMfaChallengeSchema = typeof beginMfaChallengeSchema;
