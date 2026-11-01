import { z } from "zod";

export const deleteAdminUserSchema = z.object({
  params: z.object({
    userId: z.uuid({ error: "User id must be a valid UUID." }),
  }),
  query: z.object({
    hard: z.literal("true", {
      error: "Permanent delete requires hard=true.",
    }),
  }),
});

export type DeleteAdminUserSchema = typeof deleteAdminUserSchema;
