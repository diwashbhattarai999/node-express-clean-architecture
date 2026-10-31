import type { TOauthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";

export type HandleOAuthCallbackDto = {
  provider: TOauthProviderName;
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
  codeVerifier?: string;
};
