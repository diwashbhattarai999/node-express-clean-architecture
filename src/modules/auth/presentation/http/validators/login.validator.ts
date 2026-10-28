import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string({ error: "Identifier is required." })
      .trim()
      .min(1, "Identifier is required.")
      .max(255, "Identifier must be at most 255 characters."),
    password: z
      .string({ error: "Password is required." })
      .min(1, "Password is required.")
      .max(128, "Password must be at most 128 characters."),
  }),
});

export type LoginSchema = typeof loginSchema;
export type LoginInput = z.infer<LoginSchema>["body"];
