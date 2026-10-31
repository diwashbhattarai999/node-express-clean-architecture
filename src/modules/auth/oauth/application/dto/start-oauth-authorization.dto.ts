import type {
  TOauthIntent,
  TOauthProviderName,
  TOauthResponseMode,
} from "@/modules/auth/oauth/application/constants/oauth-providers";

export type StartOAuthAuthorizationDto = {
  provider: TOauthProviderName;
  redirectUri: string;
  state: string;
  intent: TOauthIntent;
  responseMode: TOauthResponseMode;
  codeChallenge?: string;
  codeChallengeMethod?: "S256";
};
