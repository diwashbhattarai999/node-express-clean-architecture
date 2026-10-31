import { z } from "zod";

import { emailSchema } from "@/shared/http/schemas";

export const addEmailSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export type AddEmailSchema = typeof addEmailSchema;
export type AddEmailInput = z.infer<AddEmailSchema>["body"];
