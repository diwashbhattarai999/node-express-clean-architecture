export type AccessTokenClaims = {
  userId: string;
  sessionId: string;
};

export type SignedAccessToken = {
  accessToken: string;
  expiresIn: number;
};

export type VerifiedAccessToken = AccessTokenClaims & {
  jti: string;
};

export interface IAccessTokenSigner {
  sign(claims: AccessTokenClaims): Promise<SignedAccessToken>;
  verify(accessToken: string): Promise<VerifiedAccessToken>;
}
