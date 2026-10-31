import type { TOauthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";

export type ExchangeOAuthCodeDto = {
  provider: TOauthProviderName;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  state: string;
};
