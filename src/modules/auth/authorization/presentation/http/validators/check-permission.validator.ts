import { z } from "zod";

export const checkPermissionSchema = z.object({
  body: z.object({
    permission: z
      .string({ error: "Permission is required." })
      .trim()
      .min(1, "Permission is required.")
      .max(64, "Permission must be at most 64 characters."),
    resourceId: z
      .string({ error: "Resource id must be a string." })
      .trim()
      .min(1, "Resource id must be at least 1 character.")
      .max(128, "Resource id must be at most 128 characters.")
      .optional(),
  }),
});

export type CheckPermissionSchema = typeof checkPermissionSchema;
