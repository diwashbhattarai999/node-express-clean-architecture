import { z } from "zod";

export const consumeMagicLinkSchema = z.object({
  body: z.object({
    token: z
      .string({ error: "Magic-link token is required." })
      .trim()
      .min(1, "Magic-link token is required."),
  }),
});

export type ConsumeMagicLinkSchema = typeof consumeMagicLinkSchema;
