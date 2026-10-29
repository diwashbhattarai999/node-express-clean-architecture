import { z } from "zod";

export const validatePasswordResetSchema = z.object({
  body: z.object({
    token: z
      .string({ error: "Token is required." })
      .trim()
      .min(1, "Token is required.")
      .max(512, "Token must be at most 512 characters."),
  }),
});

export type ValidatePasswordResetSchema = typeof validatePasswordResetSchema;
export type ValidatePasswordResetInput = z.infer<ValidatePasswordResetSchema>["body"];
