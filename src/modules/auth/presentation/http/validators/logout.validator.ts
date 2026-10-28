import { z } from "zod";

export const logoutSchema = z.object({
  body: z
    .object({
      refreshToken: z
        .string()
        .trim()
        .min(1, "Refresh token must not be empty.")
        .max(512, "Refresh token must be at most 512 characters.")
        .optional(),
    })
    .default({}),
});

export type LogoutSchema = typeof logoutSchema;
export type LogoutInput = z.infer<LogoutSchema>["body"];
