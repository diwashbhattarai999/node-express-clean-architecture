import { z } from "zod";

export const replaceUserRolesSchema = z.object({
  params: z.object({
    userId: z.uuid({ error: "User id must be a valid UUID." }),
  }),
  body: z.object({
    roleIds: z
      .array(z.uuid({ error: "Role id must be a valid UUID." }), {
        error: "Role ids are required.",
      })
      .max(100, "Role ids must contain at most 100 items."),
  }),
});

export type ReplaceUserRolesSchema = typeof replaceUserRolesSchema;
