import { randomUUID } from "node:crypto";

import { AuthForbiddenError } from "@/modules/auth/credentials/application/errors/auth-forbidden.error";
import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { WebAuthnAssertionResponseDto } from "@/modules/auth/passkeys/application/dto/webauthn-json.dto";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { IWebAuthnService } from "@/modules/auth/passkeys/application/ports/webauthn.service";
import { readWebAuthnClientChallenge } from "@/modules/auth/passkeys/application/utils/read-webauthn-challenge";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
import { generateRefreshToken } from "@/modules/auth/shared/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { ErrorCode } from "@/shared/errors/error-code";

export type VerifyPasskeyLoginUseCaseOptions = {
  refreshTokenTtlSeconds: number;
};

export type VerifyPasskeyLoginResult = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export type VerifyPasskeyLoginMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class VerifyPasskeyLoginUseCase {
  public constructor(
    private readonly passkeyRepository: IPasskeyRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly accessTokenSigner: IAccessTokenSigner,
    private readonly webAuthnService: IWebAuthnService,
    private readonly options: VerifyPasskeyLoginUseCaseOptions,
  ) {}

  public async execute(
    dto: WebAuthnAssertionResponseDto,
    meta: VerifyPasskeyLoginMeta = {},
  ): Promise<VerifyPasskeyLoginResult> {
    const challengeValue = readWebAuthnClientChallenge(dto.response.clientDataJSON);

    if (!challengeValue) {
      throw new TokenInvalidError("The passkey assertion is invalid.");
    }

    const challenge = await this.passkeyRepository.findUsableChallenge(challengeValue, "login");

    if (!challenge) {
      throw new TokenInvalidError("The passkey login challenge is invalid.");
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new TokenExpiredError("The passkey login challenge has expired.");
    }

    const passkey = await this.passkeyRepository.findPasskeyByCredentialId(dto.id);

    if (!passkey || passkey.revokedAt) {
      throw new InvalidCredentialsError();
    }

    if (challenge.userId && challenge.userId !== passkey.userId) {
      throw new InvalidCredentialsError();
    }

    const verified = await this.webAuthnService.verifyAuthentication({
      response: dto,
      expectedChallenge: challenge.challenge,
      credential: {
        id: passkey.credentialId,
        publicKey: passkey.publicKey,
        signCount: passkey.signCount,
        transports: passkey.transports,
      },
    });

    if (!verified) {
      throw new InvalidCredentialsError();
    }

    const user = await this.passkeyRepository.findAuthUserById(passkey.userId);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (user.status === "pending_verification") {
      throw new AuthForbiddenError(
        ErrorCode.ACCOUNT_NOT_VERIFIED,
        "Please verify your account before signing in.",
      );
    }

    if (user.status === "suspended") {
      throw new AuthForbiddenError(ErrorCode.ACCOUNT_SUSPENDED, "This account is suspended.");
    }

    if (user.status === "disabled") {
      throw new AuthForbiddenError(ErrorCode.ACCOUNT_DISABLED, "This account is disabled.");
    }

    const consumed = await this.passkeyRepository.consumeChallenge(challenge.id);

    if (!consumed) {
      throw new TokenInvalidError("The passkey login challenge is invalid.");
    }

    const now = new Date();
    await this.passkeyRepository.markPasskeyUsed(passkey.id, verified.newSignCount, now);

    const sessionId = randomUUID();
    const familyId = randomUUID();
    const refreshToken = generateRefreshToken();

    await this.sessionRepository.createSession(user.id, {
      id: sessionId,
      familyId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(now.getTime() + this.options.refreshTokenTtlSeconds * 1000),
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
