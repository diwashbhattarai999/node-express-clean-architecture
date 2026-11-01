import { z } from "zod";

export const adminUserIdSchema = z.object({
  params: z.object({
    userId: z.uuid({ error: "User id must be a valid UUID." }),
  }),
});

export type AdminUserIdSchema = typeof adminUserIdSchema;
