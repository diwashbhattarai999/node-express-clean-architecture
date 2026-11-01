import { z } from "zod";

import { optionalSearchSchema, paginationQuerySchema } from "@/shared/http/schemas";

export const listRolesSchema = z.object({
  query: paginationQuerySchema.extend({
    search: optionalSearchSchema,
  }),
});

export type ListRolesSchema = typeof listRolesSchema;
