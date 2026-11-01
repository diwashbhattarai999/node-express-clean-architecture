import { z } from "zod";

import { paginationQuerySchema } from "@/shared/http/schemas";

export const listRoleUsersSchema = z.object({
  params: z.object({
    roleId: z.uuid({ error: "Role id must be a valid UUID." }),
  }),
  query: paginationQuerySchema,
});

export type ListRoleUsersSchema = typeof listRoleUsersSchema;
