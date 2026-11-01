import { z } from "zod";

import {
  optionalSearchSchema,
  paginationQuerySchema,
  sortOrderSchema,
} from "@/shared/http/schemas";

export const listAdminUsersSchema = z.object({
  query: paginationQuerySchema.extend({
    search: optionalSearchSchema,
    status: z.enum(["pending_verification", "active", "suspended", "disabled"]).optional(),
    sortBy: z.enum(["createdAt", "displayName", "status"]).default("createdAt"),
    sortOrder: sortOrderSchema,
  }),
});

export type ListAdminUsersSchema = typeof listAdminUsersSchema;
