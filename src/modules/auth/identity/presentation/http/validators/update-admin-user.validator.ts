import { z } from "zod";

import { updateOwnProfileSchema } from "@/modules/auth/identity/presentation/http/validators/update-own-profile.validator";

export const updateAdminUserSchema = z.object({
  params: z.object({
    userId: z.uuid({ error: "User id must be a valid UUID." }),
  }),
  body: updateOwnProfileSchema.shape.body,
});

export type UpdateAdminUserSchema = typeof updateAdminUserSchema;
