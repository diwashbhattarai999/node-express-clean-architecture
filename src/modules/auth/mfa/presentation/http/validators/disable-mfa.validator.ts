import { z } from "zod";

export const disableMfaSchema = z.object({
  body: z
    .object({
      code: z.string().trim().min(6).max(20).optional(),
      password: z.string().min(1).optional(),
    })
    .refine((value) => Boolean(value.code) || Boolean(value.password), {
      message: "A verification code or password is required.",
      path: ["code"],
    }),
});

export type DisableMfaSchema = typeof disableMfaSchema;
