import { z } from "zod";

import {
  ROLE_DESCRIPTION_MAX_LENGTH,
  ROLE_KEY_MAX_LENGTH,
  ROLE_KEY_MIN_LENGTH,
  ROLE_KEY_PATTERN,
  ROLE_NAME_MAX_LENGTH,
} from "@/modules/auth/authorization/application/constants/role-keys";

export const createRoleSchema = z.object({
  body: z.object({
    key: z
      .string({ error: "Role key is required." })
      .trim()
      .min(ROLE_KEY_MIN_LENGTH, `Role key must be at least ${ROLE_KEY_MIN_LENGTH} characters.`)
      .max(ROLE_KEY_MAX_LENGTH, `Role key must be at most ${ROLE_KEY_MAX_LENGTH} characters.`)
      .regex(
        ROLE_KEY_PATTERN,
        "Role key must start with a letter and may only contain letters, numbers, `.`, `_`, or `-`.",
      ),
    name: z
      .string({ error: "Role name is required." })
      .trim()
      .min(1, "Role name is required.")
      .max(ROLE_NAME_MAX_LENGTH, `Role name must be at most ${ROLE_NAME_MAX_LENGTH} characters.`),
    description: z
      .string({ error: "Description must be a string." })
      .trim()
      .max(
        ROLE_DESCRIPTION_MAX_LENGTH,
        `Description must be at most ${ROLE_DESCRIPTION_MAX_LENGTH} characters.`,
      )
      .optional()
      .transform((value) => (value === undefined || value.length === 0 ? null : value)),
  }),
});

export type CreateRoleSchema = typeof createRoleSchema;
