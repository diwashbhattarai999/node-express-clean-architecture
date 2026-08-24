import { z } from "zod";

import { createIdParamSchema, emailSchema, passwordSchema } from "@/shared/http/schemas";

const UPDATE_USER_LIMITS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
};

export const updateUserSchema = z.object({
  params: createIdParamSchema({ message: "User id must be a valid UUID." }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(
          UPDATE_USER_LIMITS.MIN_NAME_LENGTH,
          `Name must be at least ${UPDATE_USER_LIMITS.MIN_NAME_LENGTH} characters.`,
        )
        .max(
          UPDATE_USER_LIMITS.MAX_NAME_LENGTH,
          `Name must be at most ${UPDATE_USER_LIMITS.MAX_NAME_LENGTH} characters.`,
        )
        .optional(),
      email: emailSchema.optional(),
      password: passwordSchema.optional(),
    })
    .refine(
      (data) => data.name !== undefined || data.email !== undefined || data.password !== undefined,
      {
        message: "At least one field must be provided.",
      },
    ),
});

export type UpdateUserSchema = typeof updateUserSchema;
export type UpdateUserInput = z.infer<UpdateUserSchema>["body"];
