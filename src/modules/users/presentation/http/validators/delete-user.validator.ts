import { z } from "zod";

import { createIdParamSchema } from "@/shared/http/schemas";

export const deleteUserSchema = z.object({
  params: createIdParamSchema({ message: "User id must be a valid UUID." }),
});

export type DeleteUserSchema = typeof deleteUserSchema;
export type DeleteUserInput = z.infer<DeleteUserSchema>["params"];
