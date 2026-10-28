import { randomUUID } from "node:crypto";

import { SignJWT } from "jose";

import type {
  AccessTokenClaims,
  IAccessTokenSigner,
  SignedAccessToken,
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
}
