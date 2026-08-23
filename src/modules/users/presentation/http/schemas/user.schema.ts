import { z } from "zod";

import { paginationQuerySchema, sortOrderSchema } from "@/shared/http/pagination.schema";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(100, "Name must be at most 100 characters.");

const emailSchema = z.email("Email must be valid.");

const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

const userIdParamsSchema = z.object({
  id: z.uuid("User id must be a valid UUID."),
});

const listUsersQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().trim().min(1, "Search must not be empty.").optional(),
    name: z.string().trim().min(1, "Name filter must not be empty.").optional(),
    email: z.string().trim().min(1, "Email filter must not be empty.").optional(),
    createdFrom: z.coerce.date().optional(),
    createdTo: z.coerce.date().optional(),
    sortBy: z.enum(["name", "email", "createdAt", "updatedAt"]).default("createdAt"),
    sortOrder: sortOrderSchema,
  })
  .refine(
    (query) =>
      query.createdFrom === undefined ||
      query.createdTo === undefined ||
      query.createdFrom <= query.createdTo,
    {
      message: "createdFrom must be before or equal to createdTo.",
      path: ["createdTo"],
    },
  );

export const createUserSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const listUsersSchema = z.object({
  query: listUsersQuerySchema,
});

export const getUserByIdSchema = z.object({
  params: userIdParamsSchema,
});

export const updateUserSchema = z.object({
  params: userIdParamsSchema,
  body: z
    .object({
      name: nameSchema.optional(),
      email: emailSchema.optional(),
      password: passwordSchema.optional(),
    })
    .refine(
      (data) => data.name !== undefined || data.email !== undefined || data.password !== undefined,
      {
        message: "At least one field must be provided.",
      },
    ),
});

export const deleteUserSchema = z.object({
  params: userIdParamsSchema,
});

export type CreateUserSchema = typeof createUserSchema;
export type ListUsersSchema = typeof listUsersSchema;
export type GetUserByIdSchema = typeof getUserByIdSchema;
export type UpdateUserSchema = typeof updateUserSchema;
export type DeleteUserSchema = typeof deleteUserSchema;
