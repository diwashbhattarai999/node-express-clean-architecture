import { z } from "zod";

import {
  OAuthIntent,
  OAuthProviderName,
  OAuthResponseMode,
} from "@/modules/auth/oauth/application/constants/oauth-providers";

const PKCE_CHALLENGE = /^[A-Za-z0-9\-._~]{43,128}$/;

export const startOAuthAuthorizationSchema = z.object({
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
  query: z
    .object({
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
      intent: z.enum([OAuthIntent.LOGIN, OAuthIntent.LINK]).default(OAuthIntent.LOGIN),
      response: z.enum([OAuthResponseMode.JSON]).optional(),
      codeChallenge: z
        .string({ error: "Code challenge must be a string." })
        .trim()
        .regex(PKCE_CHALLENGE, "Code challenge must be a base64url S256 challenge (43–128 chars).")
        .optional(),
      codeChallengeMethod: z.enum(["S256"]).optional(),
    })
    .superRefine((query, context) => {
      if (query.codeChallenge !== undefined && query.codeChallengeMethod === undefined) {
        context.addIssue({
          code: "custom",
          path: ["codeChallengeMethod"],
          message: "Code challenge method is required when a code challenge is sent.",
        });
      }

      if (query.codeChallengeMethod !== undefined && query.codeChallenge === undefined) {
        context.addIssue({
          code: "custom",
          path: ["codeChallenge"],
          message: "Code challenge is required when a code challenge method is sent.",
        });
      }
    }),
});

export type StartOAuthAuthorizationSchema = typeof startOAuthAuthorizationSchema;
