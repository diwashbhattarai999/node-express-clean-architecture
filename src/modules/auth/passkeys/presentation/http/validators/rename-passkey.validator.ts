import { z } from "zod";

export const renamePasskeySchema = z.object({
  params: z.object({
    passkeyId: z.uuid({ error: "Passkey id must be a valid UUID." }),
  }),
  body: z.object({
    name: z
      .string({ error: "Name is required." })
      .trim()
      .min(1, "Name is required.")
      .max(100, "Name must be at most 100 characters."),
  }),
});

export type RenamePasskeySchema = typeof renamePasskeySchema;
