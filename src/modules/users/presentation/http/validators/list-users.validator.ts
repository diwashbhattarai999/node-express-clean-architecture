import { z } from "zod";

import {
  optionalSearchSchema,
  paginationQuerySchema,
  sortOrderSchema,
  withCreatedDateRange,
} from "@/shared/http/schemas";

export const listUsersSchema = z.object({
  query: withCreatedDateRange(
    paginationQuerySchema.extend({
      search: optionalSearchSchema,
      name: z.string().trim().min(1, "Name filter must not be empty.").optional(),
      email: z.string().trim().min(1, "Email filter must not be empty.").optional(),
      sortBy: z.enum(["name", "email", "createdAt", "updatedAt"]).default("createdAt"),
      sortOrder: sortOrderSchema,
    }),
  ),
});

export type ListUsersSchema = typeof listUsersSchema;
export type ListUsersInput = z.infer<ListUsersSchema>["query"];
