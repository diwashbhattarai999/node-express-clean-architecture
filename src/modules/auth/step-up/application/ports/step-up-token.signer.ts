export type StepUpTokenClaims = {
  userId: string;
  sessionId: string;
};

export type SignedStepUpToken = {
  stepUpToken: string;
  expiresIn: number;
};

export type VerifiedStepUpToken = StepUpTokenClaims & {
  jti: string;
};

export interface IStepUpTokenSigner {
  sign(claims: StepUpTokenClaims): Promise<SignedStepUpToken>;
  verify(stepUpToken: string): Promise<VerifiedStepUpToken>;
}
