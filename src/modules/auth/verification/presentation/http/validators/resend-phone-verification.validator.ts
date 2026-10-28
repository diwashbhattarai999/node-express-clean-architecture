import { z } from "zod";

import { phoneSchema } from "@/shared/http/schemas";

export const resendPhoneVerificationSchema = z.object({
  body: z.object({
    phone: phoneSchema,
  }),
});

export type ResendPhoneVerificationSchema = typeof resendPhoneVerificationSchema;
export type ResendPhoneVerificationInput = z.infer<ResendPhoneVerificationSchema>["body"];
