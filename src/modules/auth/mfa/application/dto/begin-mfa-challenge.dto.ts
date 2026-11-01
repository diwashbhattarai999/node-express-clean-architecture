export type BeginMfaChallengeDto = {
  mfaToken: string;
  factorId?: string | undefined;
};
