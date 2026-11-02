import { z } from "zod";

export const beginPasskeyLoginSchema = z.object({
  body: z
    .object({
      identifier: z.string().trim().min(1).max(255).optional(),
    })
    .default({}),
});

export type BeginPasskeyLoginSchema = typeof beginPasskeyLoginSchema;
