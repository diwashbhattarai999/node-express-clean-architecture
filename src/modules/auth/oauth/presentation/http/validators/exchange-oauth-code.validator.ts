import { z } from "zod";

import { OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";

const PKCE_VERIFIER = /^[A-Za-z0-9\-._~]{43,128}$/;

export const exchangeOAuthCodeSchema = z.object({
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
  body: z.object({
    code: z
      .string({ error: "Authorization code is required." })
      .trim()
      .min(1, "Authorization code is required.")
      .max(4096, "Authorization code must be at most 4096 characters."),
    codeVerifier: z
      .string({ error: "Code verifier is required." })
      .trim()
      .regex(PKCE_VERIFIER, "Code verifier must be a base64url PKCE verifier (43–128 chars)."),
    redirectUri: z
      .string({ error: "Redirect URI is required." })
      .trim()
      .min(1, "Redirect URI is required.")
      .max(2048, "Redirect URI must be at most 2048 characters."),
    state: z
      .string({ error: "State is required." })
      .trim()
      .min(8, "State must be at least 8 characters.")
      .max(512, "State must be at most 512 characters."),
  }),
});

export type ExchangeOAuthCodeSchema = typeof exchangeOAuthCodeSchema;
