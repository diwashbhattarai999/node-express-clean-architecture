import { z } from "zod";

export const removePhoneSchema = z.object({
  params: z.object({
    identityId: z.uuid({ error: "Identity id must be a valid UUID." }),
  }),
});

export type RemovePhoneSchema = typeof removePhoneSchema;
