import { z } from "zod";

export const removeUserRoleSchema = z.object({
  params: z.object({
    userId: z.uuid({ error: "User id must be a valid UUID." }),
    roleId: z.uuid({ error: "Role id must be a valid UUID." }),
  }),
});

export type RemoveUserRoleSchema = typeof removeUserRoleSchema;
