import { z } from "zod";

export const getPermissionSchema = z.object({
  params: z.object({
    permissionId: z.uuid({ error: "Permission id must be a valid UUID." }),
  }),
});

export type GetPermissionSchema = typeof getPermissionSchema;
