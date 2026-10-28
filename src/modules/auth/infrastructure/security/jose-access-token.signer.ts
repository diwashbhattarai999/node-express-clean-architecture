import { randomUUID } from "node:crypto";

import { errors as JoseErrors, jwtVerify, SignJWT } from "jose";

import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import type {
  AccessTokenClaims,
  IAccessTokenSigner,
  SignedAccessToken,
  VerifiedAccessToken,
} from "@/modules/auth/application/ports/access-token.signer";

export type JoseAccessTokenSignerOptions = {
  secret: string;
  issuer: string;
  audience: string;
  expiresInSeconds: number;
};

export class JoseAccessTokenSigner implements IAccessTokenSigner {
  private readonly secretKey: Uint8Array;

  public constructor(private readonly options: JoseAccessTokenSignerOptions) {
    this.secretKey = new TextEncoder().encode(options.secret);
  }

  public async sign(claims: AccessTokenClaims): Promise<SignedAccessToken> {
    const accessToken = await new SignJWT({ sid: claims.sessionId })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(claims.userId)
      .setIssuer(this.options.issuer)
      .setAudience(this.options.audience)
      .setIssuedAt()
      .setExpirationTime(`${this.options.expiresInSeconds}s`)
      .setJti(randomUUID())
      .sign(this.secretKey);

    return {
      accessToken,
      expiresIn: this.options.expiresInSeconds,
    };
  }

  public async verify(accessToken: string): Promise<VerifiedAccessToken> {
    try {
      const { payload } = await jwtVerify(accessToken, this.secretKey, {
        issuer: this.options.issuer,
        audience: this.options.audience,
        algorithms: ["HS256"],
      });

      const userId = payload.sub;
      const sessionId = payload.sid;
      const jti = payload.jti;

      if (
        typeof userId !== "string" ||
        userId.length === 0 ||
        typeof sessionId !== "string" ||
        sessionId.length === 0 ||
        typeof jti !== "string" ||
        jti.length === 0
      ) {
        throw new TokenInvalidError("The access token is invalid.");
      }

      return { userId, sessionId, jti };
    } catch (error) {
      if (error instanceof TokenInvalidError || error instanceof TokenExpiredError) {
        throw error;
      }

      if (error instanceof JoseErrors.JWTExpired) {
        throw new TokenExpiredError("The access token has expired.");
      }

      throw new TokenInvalidError("The access token is invalid.");
    }
  }
}
