import { z } from "zod";

import { optionalSearchSchema, paginationQuerySchema } from "@/shared/http/schemas";

export const listPermissionsSchema = z.object({
  query: paginationQuerySchema.extend({
    search: optionalSearchSchema,
  }),
});

export type ListPermissionsSchema = typeof listPermissionsSchema;
