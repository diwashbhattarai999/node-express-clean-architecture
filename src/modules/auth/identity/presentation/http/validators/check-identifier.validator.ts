import { z } from "zod";

import { usernameSchema } from "@/modules/auth/identity/presentation/http/validators/username.schema";
import { emailSchema, phoneSchema } from "@/shared/http/schemas";

export const checkIdentifierSchema = z.object({
  body: z.discriminatedUnion(
    "type",
    [
      z.object({
        type: z.literal("email"),
        identifier: emailSchema,
      }),
      z.object({
        type: z.literal("phone"),
        identifier: phoneSchema,
      }),
      z.object({
        type: z.literal("username"),
        identifier: usernameSchema,
      }),
    ],
    { error: "Type must be email, phone, or username." },
  ),
});

export type CheckIdentifierSchema = typeof checkIdentifierSchema;
