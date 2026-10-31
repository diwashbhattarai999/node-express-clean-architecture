import type { OAuthAccount } from "@/modules/auth/oauth/application/ports/oauth-account.repository";

export type OAuthAccountResponse = {
  id: string;
  provider: string;
  providerEmail: string | null;
  linkedAt: string;
  lastUsedAt: string | null;
};

export const toOAuthAccountResponse = (account: OAuthAccount): OAuthAccountResponse => ({
  id: account.id,
  provider: account.provider,
  providerEmail: account.providerEmail,
  linkedAt: account.linkedAt.toISOString(),
  lastUsedAt: account.lastUsedAt?.toISOString() ?? null,
});

export const toOAuthAccountResponseList = (accounts: OAuthAccount[]): OAuthAccountResponse[] =>
  accounts.map(toOAuthAccountResponse);
