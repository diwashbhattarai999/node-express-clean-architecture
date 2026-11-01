import type { TOauthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";

export type LinkOAuthAccountDto = {
  userId: string;
  sessionId: string;
  provider: TOauthProviderName;
  code: string;
  redirectUri: string;
  state: string;
  codeVerifier?: string;
};
