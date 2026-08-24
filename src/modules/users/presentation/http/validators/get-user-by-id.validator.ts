import { z } from "zod";

import { createIdParamSchema } from "@/shared/http/schemas";

export const getUserByIdSchema = z.object({
  params: createIdParamSchema({ message: "User id must be a valid UUID." }),
});

export type GetUserByIdSchema = typeof getUserByIdSchema;
export type GetUserByIdInput = z.infer<GetUserByIdSchema>["params"];
