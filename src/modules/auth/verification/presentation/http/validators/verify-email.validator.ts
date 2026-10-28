import { z } from "zod";

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z
      .string({ error: "Verification token is required." })
      .trim()
      .min(1, "Verification token is required."),
  }),
});

export type VerifyEmailSchema = typeof verifyEmailSchema;
export type VerifyEmailInput = z.infer<VerifyEmailSchema>["body"];
