import { z } from "zod";

import { emailSchema } from "@/shared/http/schemas";

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export type ForgotPasswordSchema = typeof forgotPasswordSchema;
export type ForgotPasswordInput = z.infer<ForgotPasswordSchema>["body"];
