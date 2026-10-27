import { z } from "zod";

import { emailSchema, passwordSchema } from "@/shared/http/schemas";

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export const registerSchema = z.object({
  body: z
    .object({
      email: emailSchema.optional(),
      phone: z
        .string()
        .trim()
        .regex(E164_PHONE_REGEX, "Phone must be a valid E.164 number (e.g. +9779812345678).")
        .optional(),
      password: passwordSchema,
      confirmPassword: z.string({ error: "Confirm password is required." }),
      displayName: z
        .string()
        .trim()
        .min(1, "Display name must not be empty.")
        .max(100, "Display name must be at most 100 characters.")
        .optional(),
    })
    .superRefine((data, context) => {
      if (!data.email && !data.phone) {
        context.addIssue({
          code: "custom",
          path: ["email"],
          message: "Either email or phone is required.",
        });
      }

      if (data.password !== data.confirmPassword) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Passwords do not match.",
        });
      }
    }),
});

export type RegisterSchema = typeof registerSchema;
export type RegisterInput = z.infer<RegisterSchema>["body"];
