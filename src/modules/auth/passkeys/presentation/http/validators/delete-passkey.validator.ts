import { z } from "zod";

export const deletePasskeySchema = z.object({
  params: z.object({
    passkeyId: z.uuid({ error: "Passkey id must be a valid UUID." }),
  }),
});

export type DeletePasskeySchema = typeof deletePasskeySchema;
