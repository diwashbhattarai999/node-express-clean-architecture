import { z } from "zod";

import { MFA_ENROLL_TYPES } from "@/modules/auth/mfa/application/constants/mfa";
import { emailSchema } from "@/shared/http/schemas";
import { phoneSchema } from "@/shared/http/schemas/phone.schema";

export const beginMfaEnrollSchema = z.object({
  body: z
    .object({
      type: z.enum(MFA_ENROLL_TYPES, { error: "MFA type must be totp, sms, or email." }),
      destination: z.string().trim().min(1).optional(),
    })
    .superRefine((value, ctx) => {
      if (value.destination === undefined) {
        return;
      }

      if (value.type === "email") {
        const parsed = emailSchema.safeParse(value.destination);

        if (!parsed.success) {
          ctx.addIssue({
            code: "custom",
            path: ["destination"],
            message: "Email must be valid.",
          });
        }
      }

      if (value.type === "sms") {
        const parsed = phoneSchema.safeParse(value.destination);

        if (!parsed.success) {
          ctx.addIssue({
            code: "custom",
            path: ["destination"],
            message: "Phone must be a valid E.164 number (e.g. +9779812345678).",
          });
        }
      }
    }),
});

export type BeginMfaEnrollSchema = typeof beginMfaEnrollSchema;
