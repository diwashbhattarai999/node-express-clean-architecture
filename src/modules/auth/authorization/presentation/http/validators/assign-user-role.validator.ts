import { z } from "zod";

export const assignUserRoleSchema = z.object({
  params: z.object({
    userId: z.uuid({ error: "User id must be a valid UUID." }),
  }),
  body: z.object({
    roleId: z.uuid({ error: "Role id must be a valid UUID." }),
  }),
});

export type AssignUserRoleSchema = typeof assignUserRoleSchema;
