import { z } from "zod";

export const getSessionSchema = z.object({
  params: z.object({
    sessionId: z.uuid({ error: "Session id must be a valid UUID." }),
  }),
});

export type GetSessionSchema = typeof getSessionSchema;
export type GetSessionParams = z.infer<GetSessionSchema>["params"];
