import { z } from "zod";

/** Body is optional when `X-Step-Up-Token` already re-authenticated the session. */
export const disableMfaSchema = z.object({
  body: z
    .object({
      code: z.string().trim().min(6).max(20).optional(),
      password: z.string().min(1).optional(),
    })
    .default({}),
});

export type DisableMfaSchema = typeof disableMfaSchema;
