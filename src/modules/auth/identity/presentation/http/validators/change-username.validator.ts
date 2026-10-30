import { z } from "zod";

import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/modules/auth/identity/application/constants/username";

export const changeUsernameSchema = z.object({
  body: z.object({
    username: z
      .string({ error: "Username is required." })
      .trim()
      .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters.`)
      .max(USERNAME_MAX_LENGTH, `Username must be at most ${USERNAME_MAX_LENGTH} characters.`)
      .regex(
        USERNAME_PATTERN,
        "Username must start with a letter and may only contain letters, numbers, `.`, `_`, or `-`.",
      ),
  }),
});

export type ChangeUsernameSchema = typeof changeUsernameSchema;
export type ChangeUsernameInput = z.infer<ChangeUsernameSchema>["body"];
