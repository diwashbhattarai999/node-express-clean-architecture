import { z } from "zod";

export const verifyPasskeyRegisterSchema = z.object({
  body: z.object({
    id: z
      .string({ error: "Credential id is required." })
      .trim()
      .min(1, "Credential id is required."),
    rawId: z.string({ error: "rawId is required." }).trim().min(1, "rawId is required."),
    type: z.literal("public-key", { error: "type must be public-key." }),
    response: z.object({
      clientDataJSON: z.string().trim().min(1, "clientDataJSON is required."),
      attestationObject: z.string().trim().min(1, "attestationObject is required."),
      transports: z.array(z.string().trim().min(1)).optional(),
      authenticatorData: z.string().trim().min(1).optional(),
      publicKeyAlgorithm: z.number().optional(),
      publicKey: z.string().trim().min(1).optional(),
    }),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    authenticatorAttachment: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).max(100).optional(),
  }),
});

export type VerifyPasskeyRegisterSchema = typeof verifyPasskeyRegisterSchema;
