import { z } from "zod";

export const listUserPermissionsSchema = z.object({
  params: z.object({
    userId: z.uuid({ error: "User id must be a valid UUID." }),
  }),
});

export type ListUserPermissionsSchema = typeof listUserPermissionsSchema;
