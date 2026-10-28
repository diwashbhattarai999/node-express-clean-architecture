import { z } from "zod";

export const refreshSchema = z.object({
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

export type RefreshSchema = typeof refreshSchema;
export type RefreshInput = z.infer<RefreshSchema>["body"];
