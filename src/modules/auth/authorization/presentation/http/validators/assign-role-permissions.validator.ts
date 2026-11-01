import { z } from "zod";

export const assignRolePermissionsSchema = z.object({
  params: z.object({
    roleId: z.uuid({ error: "Role id must be a valid UUID." }),
  }),
  body: z.object({
    permissionIds: z
      .array(z.uuid({ error: "Permission id must be a valid UUID." }), {
        error: "Permission ids are required.",
      })
      .max(100, "Permission ids must contain at most 100 items."),
  }),
});

export type AssignRolePermissionsSchema = typeof assignRolePermissionsSchema;
