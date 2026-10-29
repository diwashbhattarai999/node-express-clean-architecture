import { z } from "zod";

export const revokeSessionSchema = z.object({
  params: z.object({
    sessionId: z.uuid({ error: "Session id must be a valid UUID." }),
  }),
});

export type RevokeSessionSchema = typeof revokeSessionSchema;
export type RevokeSessionParams = z.infer<RevokeSessionSchema>["params"];
