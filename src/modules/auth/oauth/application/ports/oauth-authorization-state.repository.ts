import type {
  TOauthIntent,
  TOauthProviderName,
} from "@/modules/auth/oauth/application/constants/oauth-providers";

export type SaveOAuthAuthorizationStateInput = {
  stateHash: string;
  provider: TOauthProviderName;
  intent: TOauthIntent;
  redirectUri: string;
  clientState: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256";
  expiresAt: Date;
};

export interface IOauthAuthorizationStateRepository {
  save(input: SaveOAuthAuthorizationStateInput): Promise<void>;
}
