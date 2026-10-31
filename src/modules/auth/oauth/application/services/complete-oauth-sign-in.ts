import { randomUUID } from "node:crypto";

import type { TOauthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { OAuthAccountBlockedError } from "@/modules/auth/oauth/application/errors/oauth-account-blocked.error";
import type { IOauthAccountRepository } from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import type { OAuthProviderProfile } from "@/modules/auth/oauth/application/ports/oauth-provider-client.port";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
import { generateRefreshToken } from "@/modules/auth/shared/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { ErrorCode } from "@/shared/errors/error-code";

export type CompleteOAuthSignInOptions = {
  refreshTokenTtlSeconds: number;
};

export type CompleteOAuthSignInResult = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export type CompleteOAuthSignInMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

const DISPLAY_NAME_MAX = 100;
const AVATAR_URL_MAX = 2048;

const clampText = (value: string | null, max: number): string | null => {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed.slice(0, max);
};

const normalizeEmail = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length > 0 && normalized.includes("@") ? normalized : null;
};

export class CompleteOAuthSignIn {
  public constructor(
    private readonly accountRepository: IOauthAccountRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly accessTokenSigner: IAccessTokenSigner,
    private readonly options: CompleteOAuthSignInOptions,
  ) {}

  public async execute(
    provider: TOauthProviderName,
    profile: OAuthProviderProfile,
    meta: CompleteOAuthSignInMeta = {},
  ): Promise<CompleteOAuthSignInResult> {
    const linked = await this.accountRepository.findByProviderUser(
      provider,
      profile.providerUserId,
    );

    const user = linked
      ? await this.loginExistingAccount(linked.externalIdentityId, linked.user)
      : await this.createAccount(provider, profile);

    return this.issueSession(user, meta);
  }

  private async loginExistingAccount(
    externalIdentityId: string,
    user: AuthUser,
  ): Promise<AuthUser> {
    if (user.status === "suspended") {
      throw new OAuthAccountBlockedError(ErrorCode.ACCOUNT_SUSPENDED, "This account is suspended.");
    }

    if (user.status === "disabled") {
      throw new OAuthAccountBlockedError(ErrorCode.ACCOUNT_DISABLED, "This account is disabled.");
    }

    return this.accountRepository.recordSuccessfulLogin(externalIdentityId);
  }

  private async createAccount(
    provider: TOauthProviderName,
    profile: OAuthProviderProfile,
  ): Promise<AuthUser> {
    const email = normalizeEmail(profile.email);
    const userId = randomUUID();
    let attachEmail:
      | { identifier: string; normalizedIdentifier: string; verifiedAt: Date }
      | undefined;

    if (email !== null && profile.emailVerified) {
      const existingEmail = await this.accountRepository.findEmailOwner(email);

      if (!existingEmail) {
        attachEmail = {
          identifier: email,
          normalizedIdentifier: email,
          verifiedAt: new Date(),
        };
      }
    }

    return this.accountRepository.createAccount({
      id: userId,
      displayName: clampText(profile.displayName, DISPLAY_NAME_MAX),
      avatarUrl: clampText(profile.avatarUrl, AVATAR_URL_MAX),
      ...(attachEmail !== undefined ? { email: attachEmail } : {}),
      externalIdentity: {
        provider,
        providerUserId: profile.providerUserId,
        providerEmailVerified: profile.emailVerified,
        ...(profile.issuer !== null ? { issuer: profile.issuer } : {}),
        ...(email !== null ? { providerEmail: email } : {}),
      },
    });
  }

  private async issueSession(
    user: AuthUser,
    meta: CompleteOAuthSignInMeta,
  ): Promise<CompleteOAuthSignInResult> {
    const sessionId = randomUUID();
    const familyId = randomUUID();
    const refreshToken = generateRefreshToken();
    const now = Date.now();

    await this.sessionRepository.createSession(user.id, {
      id: sessionId,
      familyId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(now + this.options.refreshTokenTtlSeconds * 1000),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    });

    const signed = await this.accessTokenSigner.sign({
      userId: user.id,
      sessionId,
    });

    return {
      user,
      accessToken: signed.accessToken,
      tokenType: "Bearer",
      expiresIn: signed.expiresIn,
      refreshToken,
    };
  }
}
