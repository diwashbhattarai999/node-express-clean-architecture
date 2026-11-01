import { z } from "zod";

export const removeRolePermissionSchema = z.object({
  params: z.object({
    roleId: z.uuid({ error: "Role id must be a valid UUID." }),
    permissionId: z.uuid({ error: "Permission id must be a valid UUID." }),
  }),
});

export type RemoveRolePermissionSchema = typeof removeRolePermissionSchema;
