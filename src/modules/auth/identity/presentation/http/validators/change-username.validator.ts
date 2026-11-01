import { z } from "zod";

import { usernameSchema } from "@/modules/auth/identity/presentation/http/validators/username.schema";

export const changeUsernameSchema = z.object({
  body: z.object({
    username: usernameSchema,
  }),
});

export type ChangeUsernameSchema = typeof changeUsernameSchema;
export type ChangeUsernameInput = z.infer<ChangeUsernameSchema>["body"];
