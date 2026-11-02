import { z } from "zod";

export const verifyPasskeyLoginSchema = z.object({
  body: z.object({
    id: z
      .string({ error: "Credential id is required." })
      .trim()
      .min(1, "Credential id is required."),
    rawId: z.string({ error: "rawId is required." }).trim().min(1, "rawId is required."),
    type: z.literal("public-key", { error: "type must be public-key." }),
    response: z.object({
      clientDataJSON: z.string().trim().min(1, "clientDataJSON is required."),
      authenticatorData: z.string().trim().min(1, "authenticatorData is required."),
      signature: z.string().trim().min(1, "signature is required."),
      userHandle: z.string().trim().min(1).optional(),
    }),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    authenticatorAttachment: z.string().trim().min(1).optional(),
  }),
});

export type VerifyPasskeyLoginSchema = typeof verifyPasskeyLoginSchema;
