import { z } from "zod";

const optionalNullableText = (max: number, message: string) =>
  z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value === null) {
        return null;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .refine((value) => value === null || value.length <= max, { message });

export const updateOwnProfileSchema = z.object({
  body: z
    .object({
      displayName: optionalNullableText(
        100,
        "Display name must be at most 100 characters.",
      ).optional(),
      avatarUrl: z
        .union([z.url("Avatar URL must be a valid URL."), z.literal(""), z.null()])
        .transform((value) => (value === "" ? null : value))
        .refine((value) => value === null || value.length <= 2048, {
          message: "Avatar URL must be at most 2048 characters.",
        })
        .optional(),
      firstName: optionalNullableText(100, "First name must be at most 100 characters.").optional(),
      lastName: optionalNullableText(100, "Last name must be at most 100 characters.").optional(),
      locale: optionalNullableText(35, "Locale must be at most 35 characters.").optional(),
      timezone: optionalNullableText(64, "Timezone must be at most 64 characters.").optional(),
      bio: optionalNullableText(2000, "Bio must be at most 2000 characters.").optional(),
    })
    .superRefine((data, context) => {
      if (
        data.displayName === undefined &&
        data.avatarUrl === undefined &&
        data.firstName === undefined &&
        data.lastName === undefined &&
        data.locale === undefined &&
        data.timezone === undefined &&
        data.bio === undefined
      ) {
        context.addIssue({
          code: "custom",
          path: ["displayName"],
          message: "At least one profile field is required.",
        });
      }
    }),
});

export type UpdateOwnProfileSchema = typeof updateOwnProfileSchema;
export type UpdateOwnProfileInput = z.infer<UpdateOwnProfileSchema>["body"];
