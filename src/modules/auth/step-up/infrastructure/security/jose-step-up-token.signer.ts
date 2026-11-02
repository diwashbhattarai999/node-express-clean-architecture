import { randomUUID } from "node:crypto";

import { errors as JoseErrors, jwtVerify, SignJWT } from "jose";

import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { STEP_UP_TOKEN_PURPOSE } from "@/modules/auth/step-up/application/constants/step-up";
import type {
  IStepUpTokenSigner,
  SignedStepUpToken,
  StepUpTokenClaims,
  VerifiedStepUpToken,
} from "@/modules/auth/step-up/application/ports/step-up-token.signer";

export type JoseStepUpTokenSignerOptions = {
  secret: string;
  issuer: string;
  audience: string;
  expiresInSeconds: number;
};

export class JoseStepUpTokenSigner implements IStepUpTokenSigner {
  private readonly secretKey: Uint8Array;

  public constructor(private readonly options: JoseStepUpTokenSignerOptions) {
    this.secretKey = new TextEncoder().encode(options.secret);
  }

  public async sign(claims: StepUpTokenClaims): Promise<SignedStepUpToken> {
    const stepUpToken = await new SignJWT({
      sid: claims.sessionId,
      purpose: STEP_UP_TOKEN_PURPOSE,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(claims.userId)
      .setIssuer(this.options.issuer)
      .setAudience(this.options.audience)
      .setIssuedAt()
      .setExpirationTime(`${this.options.expiresInSeconds}s`)
      .setJti(randomUUID())
      .sign(this.secretKey);

    return {
      stepUpToken,
      expiresIn: this.options.expiresInSeconds,
    };
  }

  public async verify(stepUpToken: string): Promise<VerifiedStepUpToken> {
    try {
      const { payload } = await jwtVerify(stepUpToken, this.secretKey, {
        issuer: this.options.issuer,
        audience: this.options.audience,
        algorithms: ["HS256"],
      });

      const userId = payload.sub;
      const sessionId = payload.sid;
      const jti = payload.jti;
      const purpose = payload.purpose;

      if (
        purpose !== STEP_UP_TOKEN_PURPOSE ||
        typeof userId !== "string" ||
        userId.length === 0 ||
        typeof sessionId !== "string" ||
        sessionId.length === 0 ||
        typeof jti !== "string" ||
        jti.length === 0
      ) {
        throw new TokenInvalidError("The step-up token is invalid.");
      }

      return { userId, sessionId, jti };
    } catch (error) {
      if (error instanceof TokenInvalidError || error instanceof TokenExpiredError) {
        throw error;
      }

      if (error instanceof JoseErrors.JWTExpired) {
        throw new TokenExpiredError("The step-up token has expired.");
      }

      throw new TokenInvalidError("The step-up token is invalid.");
    }
  }
}
