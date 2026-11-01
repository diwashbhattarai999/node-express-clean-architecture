import { z } from "zod";

export const getRoleSchema = z.object({
  params: z.object({
    roleId: z.uuid({ error: "Role id must be a valid UUID." }),
  }),
});

export type GetRoleSchema = typeof getRoleSchema;
