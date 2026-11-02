import { randomUUID } from "node:crypto";

import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
import { generateRefreshToken } from "@/modules/auth/shared/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export type IssueAuthSessionMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type IssuedAuthSession = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export type IssueAuthSessionDeps = {
  sessionRepository: ISessionRepository;
  accessTokenSigner: IAccessTokenSigner;
  refreshTokenTtlSeconds: number;
};

/**
 * Creates a refresh session and signs an access token.
 * Used by password, magic-link, MFA, passkey, and OAuth sign-in success paths.
 * Do not use for refresh rotation or flows that create the session inside a DB transaction.
 */
export async function issueAuthSession(
  deps: IssueAuthSessionDeps,
  user: AuthUser,
  meta: IssueAuthSessionMeta = {},
): Promise<IssuedAuthSession> {
  const sessionId = randomUUID();
  const familyId = randomUUID();
  const refreshToken = generateRefreshToken();
  const now = Date.now();

  await deps.sessionRepository.createSession(user.id, {
    id: sessionId,
    familyId,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: new Date(now + deps.refreshTokenTtlSeconds * 1000),
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null,
  });

  const signed = await deps.accessTokenSigner.sign({
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
