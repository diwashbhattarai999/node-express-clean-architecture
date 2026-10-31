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

export type ConsumeOAuthAuthorizationStateInput = {
  stateHash: string;
  provider: TOauthProviderName;
};

export type ConsumeOAuthAuthorizationStateForExchangeInput = {
  provider: TOauthProviderName;
  clientState: string;
  redirectUri: string;
};

export type ConsumedOAuthAuthorizationState = {
  provider: TOauthProviderName;
  intent: TOauthIntent;
  redirectUri: string;
  clientState: string;
  userId: string | null;
};

export interface IOauthAuthorizationStateRepository {
  save(input: SaveOAuthAuthorizationStateInput): Promise<void>;
  findActive(
    input: ConsumeOAuthAuthorizationStateInput,
  ): Promise<ConsumedOAuthAuthorizationState | null>;
  consume(
    input: ConsumeOAuthAuthorizationStateInput,
  ): Promise<ConsumedOAuthAuthorizationState | null>;
  consumeForExchange(
    input: ConsumeOAuthAuthorizationStateForExchangeInput,
  ): Promise<ConsumedOAuthAuthorizationState | null>;
}
