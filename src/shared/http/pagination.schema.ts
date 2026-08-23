import { z } from "zod";

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1.").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit must be at most 100.")
    .default(10),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
