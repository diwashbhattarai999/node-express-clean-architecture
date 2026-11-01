import { z } from "zod";

import { emailSchema } from "@/shared/http/schemas";

export const requestMagicLinkSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export type RequestMagicLinkSchema = typeof requestMagicLinkSchema;
