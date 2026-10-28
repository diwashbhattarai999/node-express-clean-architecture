import { z } from "zod";

import { passwordSchema } from "@/shared/http/schemas";

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z
        .string({ error: "Token is required." })
        .trim()
        .min(1, "Token is required.")
        .max(512, "Token must be at most 512 characters."),
      password: passwordSchema,
      confirmPassword: z.string({ error: "Confirm password is required." }),
    })
    .superRefine((data, context) => {
      if (data.password !== data.confirmPassword) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Passwords do not match.",
        });
      }
    }),
});

export type ResetPasswordSchema = typeof resetPasswordSchema;
export type ResetPasswordInput = z.infer<ResetPasswordSchema>["body"];
