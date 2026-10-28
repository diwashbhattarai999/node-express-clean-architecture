export type AccessTokenClaims = {
  userId: string;
  sessionId: string;
};

export type SignedAccessToken = {
  accessToken: string;
  expiresIn: number;
};

export interface IAccessTokenSigner {
  sign(claims: AccessTokenClaims): Promise<SignedAccessToken>;
}
