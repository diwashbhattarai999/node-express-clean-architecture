import { z } from "zod";

export const listUserRolesSchema = z.object({
  params: z.object({
    userId: z.uuid({ error: "User id must be a valid UUID." }),
  }),
});

export type ListUserRolesSchema = typeof listUserRolesSchema;
