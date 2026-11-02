import { z } from "zod";

const passkeyAssertionSchema = z.object({
  id: z.string().trim().min(1, "Credential id is required."),
  rawId: z.string().trim().min(1, "rawId is required."),
  type: z.literal("public-key", { error: "type must be public-key." }),
  response: z.object({
    clientDataJSON: z.string().trim().min(1, "clientDataJSON is required."),
    authenticatorData: z.string().trim().min(1, "authenticatorData is required."),
    signature: z.string().trim().min(1, "signature is required."),
    userHandle: z.string().trim().min(1).optional(),
  }),
  clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
  authenticatorAttachment: z.string().trim().min(1).optional(),
});

export const verifyStepUpSchema = z.object({
  body: z.object({
    stepUpId: z.uuid({ error: "Step-up id must be a valid UUID." }),
    password: z.string().min(1).optional(),
    code: z.string().trim().min(6).max(20).optional(),
    assertion: passkeyAssertionSchema.optional(),
  }),
});

export type VerifyStepUpSchema = typeof verifyStepUpSchema;
