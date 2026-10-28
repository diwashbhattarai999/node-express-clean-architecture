import { z } from "zod";

import { phoneSchema } from "@/shared/http/schemas";

export const verifyPhoneSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    code: z
      .string({ error: "Verification code is required." })
      .trim()
      .regex(/^\d{6}$/, "Verification code must be a 6-digit number."),
  }),
});

export type VerifyPhoneSchema = typeof verifyPhoneSchema;
export type VerifyPhoneInput = z.infer<VerifyPhoneSchema>["body"];
