import { z } from "zod";

export const verifyAddedEmailSchema = z.object({
  body: z.object({
    token: z
      .string({ error: "Token is required." })
      .trim()
      .min(1, "Token is required.")
      .max(512, "Token must be at most 512 characters."),
  }),
});

export type VerifyAddedEmailSchema = typeof verifyAddedEmailSchema;
export type VerifyAddedEmailInput = z.infer<VerifyAddedEmailSchema>["body"];
