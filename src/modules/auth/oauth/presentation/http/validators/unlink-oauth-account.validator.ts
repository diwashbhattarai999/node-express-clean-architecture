import { z } from "zod";

import { OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";

export const unlinkOAuthAccountSchema = z.object({
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
});

export type UnlinkOAuthAccountSchema = typeof unlinkOAuthAccountSchema;
