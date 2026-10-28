import { z } from "zod";

import { paginationQuerySchema } from "@/shared/http/schemas";

export const listSessionsSchema = z.object({
  query: paginationQuerySchema.extend({
    includeRevoked: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  }),
});

export type ListSessionsSchema = typeof listSessionsSchema;
export type ListSessionsInput = z.infer<ListSessionsSchema>["query"];
