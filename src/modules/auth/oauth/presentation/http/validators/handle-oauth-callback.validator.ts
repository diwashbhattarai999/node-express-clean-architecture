import { z } from "zod";

import { OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";

export const handleOAuthCallbackSchema = z.object({
  params: z.object({
    provider: z.enum(
      [
        OAuthProviderName.GOOGLE,
        OAuthProviderName.GITHUB,
        OAuthProviderName.APPLE,
        OAuthProviderName.MICROSOFT,
        OAuthProviderName.OIDC,
      ],
      { error: "Provider must be one of: google, github, apple, microsoft, oidc." },
    ),
  }),
  query: z.object({
    code: z
      .string({ error: "Authorization code must be a string." })
      .trim()
      .min(1, "Authorization code is required.")
      .max(4096, "Authorization code must be at most 4096 characters.")
      .optional(),
    state: z
      .string({ error: "State must be a string." })
      .trim()
      .min(8, "State must be at least 8 characters.")
      .max(512, "State must be at most 512 characters.")
      .optional(),
    error: z.string({ error: "Error must be a string." }).trim().min(1).max(128).optional(),
    error_description: z
      .string({ error: "Error description must be a string." })
      .trim()
      .min(1)
      .max(512)
      .optional(),
  }),
});

export type HandleOAuthCallbackSchema = typeof handleOAuthCallbackSchema;
