import { z } from "zod";

import { emailSchema } from "@/shared/http/schemas";

export const resendEmailVerificationSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export type ResendEmailVerificationSchema = typeof resendEmailVerificationSchema;
export type ResendEmailVerificationInput = z.infer<ResendEmailVerificationSchema>["body"];
