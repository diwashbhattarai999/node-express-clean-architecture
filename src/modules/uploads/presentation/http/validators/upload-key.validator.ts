import { z } from "zod";

import { normalizeStorageKey } from "@/shared/storage/normalize-storage-key";

export const uploadKeySchema = z.object({
  params: z.object({
    key: z
      .string()
      .trim()
      .min(1, "Storage key is required.")
      .transform((value, context) => {
        try {
          return normalizeStorageKey(value);
        } catch {
          context.addIssue({
            code: "custom",
            message: "Storage key contains invalid path segments.",
          });

          return z.NEVER;
        }
      }),
  }),
});

export type UploadKeySchema = typeof uploadKeySchema;
export type UploadKeyInput = z.infer<UploadKeySchema>["params"];
