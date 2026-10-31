import { z } from "zod";

export const removeEmailSchema = z.object({
  params: z.object({
    identityId: z.uuid({ error: "Identity id must be a valid UUID." }),
  }),
});

export type RemoveEmailSchema = typeof removeEmailSchema;
export type RemoveEmailParams = z.infer<RemoveEmailSchema>["params"];
