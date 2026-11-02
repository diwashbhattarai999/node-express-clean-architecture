import type { TStepUpMethod } from "@/modules/auth/step-up/application/constants/step-up";

export type StepUpChallenge = {
  id: string;
  userId: string;
  sessionId: string;
  method: TStepUpMethod;
  mfaChallengeId: string | null;
  webauthnChallenge: string | null;
  expiresAt: Date;
  verifiedAt: Date | null;
};

export type InsertStepUpChallengeInput = {
  userId: string;
  sessionId: string;
  method: TStepUpMethod;
  mfaChallengeId?: string | null;
  webauthnChallenge?: string | null;
  expiresAt: Date;
};

export interface IStepUpRepository {
  insertChallenge(input: InsertStepUpChallengeInput): Promise<StepUpChallenge>;

  findChallengeById(id: string): Promise<StepUpChallenge | null>;

  markChallengeVerified(id: string, verifiedAt: Date): Promise<boolean>;

  consumeOpenChallenges(userId: string, sessionId: string): Promise<void>;
}
