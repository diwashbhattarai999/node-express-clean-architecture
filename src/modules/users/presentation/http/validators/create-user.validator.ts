import { z } from "zod";

import { emailSchema, passwordSchema } from "@/shared/http/schemas";

const CREATE_USER_LIMITS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
};

export const createUserSchema = z.object({
  body: z
    .object({
      name: z
        .string({ error: "Name is required." })
        .trim()
        .min(
          CREATE_USER_LIMITS.MIN_NAME_LENGTH,
          `Name must be at least ${CREATE_USER_LIMITS.MIN_NAME_LENGTH} characters.`,
        )
        .max(
          CREATE_USER_LIMITS.MAX_NAME_LENGTH,
          `Name must be at most ${CREATE_USER_LIMITS.MAX_NAME_LENGTH} characters.`,
        ),
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: z.string({ error: "Confirm password is required." }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }),
});

export type CreateUserSchema = typeof createUserSchema;
export type CreateUserInput = z.infer<CreateUserSchema>["body"];
