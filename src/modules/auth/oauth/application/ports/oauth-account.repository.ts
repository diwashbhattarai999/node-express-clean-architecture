import type { TOauthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

export type OAuthAccount = {
  id: string;
  provider: string;
  providerEmail: string | null;
  linkedAt: Date;
  lastUsedAt: Date | null;
};

export type OAuthLinkedAccount = {
  externalIdentityId: string;
  user: AuthUser;
};

export type CreateOAuthAccountEmail = {
  identifier: string;
  normalizedIdentifier: string;
  verifiedAt: Date;
};

export type UnlinkOAuthAccountResult =
  | { outcome: "removed" }
  | { outcome: "not_found" }
  | { outcome: "last_auth_method" };

export type LinkOAuthAccountInput = {
  userId: string;
  provider: TOauthProviderName;
  providerUserId: string;
  issuer?: string;
  providerEmail?: string;
  providerEmailVerified: boolean;
};

export type CreateOAuthAccountInput = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email?: CreateOAuthAccountEmail;
  externalIdentity: {
    provider: TOauthProviderName;
    providerUserId: string;
    issuer?: string;
    providerEmail?: string;
    providerEmailVerified: boolean;
  };
};

export interface IOauthAccountRepository {
  findByProviderUser(
    provider: TOauthProviderName,
    providerUserId: string,
  ): Promise<OAuthLinkedAccount | null>;

  findEmailOwner(normalizedEmail: string): Promise<{ userId: string } | null>;

  listForUser(userId: string): Promise<OAuthAccount[]>;

  createAccount(input: CreateOAuthAccountInput): Promise<AuthUser>;

  recordSuccessfulLogin(externalIdentityId: string): Promise<AuthUser>;

  linkToUser(input: LinkOAuthAccountInput): Promise<OAuthAccount>;

  unlinkFromUser(userId: string, provider: TOauthProviderName): Promise<UnlinkOAuthAccountResult>;
}
