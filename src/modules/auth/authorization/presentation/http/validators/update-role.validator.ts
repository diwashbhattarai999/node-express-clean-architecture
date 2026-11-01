import { z } from "zod";

import {
  ROLE_DESCRIPTION_MAX_LENGTH,
  ROLE_NAME_MAX_LENGTH,
} from "@/modules/auth/authorization/application/constants/role-keys";

const optionalName = z
  .string({ error: "Role name must be a string." })
  .trim()
  .min(1, "Role name is required.")
  .max(ROLE_NAME_MAX_LENGTH, `Role name must be at most ${ROLE_NAME_MAX_LENGTH} characters.`)
  .optional();

const optionalDescription = z
  .union([
    z
      .string({ error: "Description must be a string." })
      .trim()
      .max(
        ROLE_DESCRIPTION_MAX_LENGTH,
        `Description must be at most ${ROLE_DESCRIPTION_MAX_LENGTH} characters.`,
      ),
    z.null(),
  ])
  .transform((value) => {
    if (value === null || value.length === 0) {
      return null;
    }

    return value;
  })
  .optional();

export const updateRoleSchema = z.object({
  params: z.object({
    roleId: z.uuid({ error: "Role id must be a valid UUID." }),
  }),
  body: z
    .object({
      name: optionalName,
      description: optionalDescription,
    })
    .strict()
    .superRefine((data, context) => {
      if (data.name === undefined && data.description === undefined) {
        context.addIssue({
          code: "custom",
          path: ["name"],
          message: "At least one of name or description is required.",
        });
      }
    }),
});

export type UpdateRoleSchema = typeof updateRoleSchema;
