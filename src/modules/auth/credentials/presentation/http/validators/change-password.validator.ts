import { z } from "zod";

import { passwordSchema } from "@/shared/http/schemas";

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({ error: "Current password is required." })
        .min(1, "Current password is required."),
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

export type ChangePasswordSchema = typeof changePasswordSchema;
export type ChangePasswordInput = z.infer<ChangePasswordSchema>["body"];
