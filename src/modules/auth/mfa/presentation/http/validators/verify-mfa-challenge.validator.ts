import { z } from "zod";

export const verifyMfaChallengeSchema = z.object({
  body: z.object({
    challengeId: z.uuid({ error: "Challenge id must be a valid UUID." }),
    code: z
      .string({ error: "Verification code is required." })
      .trim()
      .min(6, "Verification code is required.")
      .max(20, "Verification code is invalid."),
  }),
});

export type VerifyMfaChallengeSchema = typeof verifyMfaChallengeSchema;
