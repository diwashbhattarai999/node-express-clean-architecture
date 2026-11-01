import { z } from "zod";

export const deleteRoleSchema = z.object({
  params: z.object({
    roleId: z.uuid({ error: "Role id must be a valid UUID." }),
  }),
});

export type DeleteRoleSchema = typeof deleteRoleSchema;
