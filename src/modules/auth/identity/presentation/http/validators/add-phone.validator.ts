import { z } from "zod";

import { phoneSchema } from "@/shared/http/schemas";

export const addPhoneSchema = z.object({
  body: z.object({
    phone: phoneSchema,
  }),
});

export type AddPhoneSchema = typeof addPhoneSchema;
