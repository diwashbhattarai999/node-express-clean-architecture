import type { TMfaEnrollType } from "@/modules/auth/mfa/application/constants/mfa";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

export type MfaFactor = {
  id: string;
  userId: string;
  type: TMfaEnrollType;
  label: string | null;
  secretEncrypted: string | null;
  destination: string | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  lastUsedAt: Date | null;
  disabledAt: Date | null;
};

export type InsertMfaFactorInput = {
  userId: string;
  type: TMfaEnrollType;
  label: string | null;
  secretEncrypted: string | null;
  destination: string | null;
};

export type UpdateMfaFactorInput = {
  label?: string | null;
  secretEncrypted?: string | null;
  destination?: string | null;
  isVerified?: boolean;
  verifiedAt?: Date | null;
  lastUsedAt?: Date | null;
};

export type MfaChallenge = {
  id: string;
  userId: string;
  factorId: string | null;
  challengeHash: string | null;
  expiresAt: Date;
  verifiedAt: Date | null;
  attemptCount: number;
};

export type InsertMfaChallengeInput = {
  userId: string;
  factorId?: string | null;
  challengeHash?: string | null;
  expiresAt: Date;
};

export type UpdateMfaChallengeInput = {
  factorId?: string | null;
  challengeHash?: string | null;
  verifiedAt?: Date | null;
  attemptCount?: number;
};

export type MfaRecoveryCode = {
  id: string;
  codeHash: string;
};

export interface IMfaRepository {
  findAuthUserById(userId: string): Promise<AuthUser | null>;

  hasVerifiedFactor(userId: string): Promise<boolean>;

  listVerifiedFactors(userId: string): Promise<MfaFactor[]>;

  findFactorForUser(userId: string, factorId: string): Promise<MfaFactor | null>;

  findFactorByType(
    userId: string,
    type: TMfaEnrollType,
    verified: boolean,
  ): Promise<MfaFactor | null>;

  insertFactor(input: InsertMfaFactorInput): Promise<MfaFactor>;

  updateFactor(factorId: string, patch: UpdateMfaFactorInput): Promise<MfaFactor | null>;

  markFactorVerified(factorId: string, verifiedAt: Date): Promise<MfaFactor | null>;

  disableFactorsForUser(userId: string): Promise<number>;

  insertChallenge(input: InsertMfaChallengeInput): Promise<MfaChallenge>;

  findChallengeById(id: string): Promise<MfaChallenge | null>;

  findLatestChallengeForFactor(factorId: string): Promise<MfaChallenge | null>;

  findPendingLoginByTokenHash(tokenHash: string): Promise<MfaChallenge | null>;

  updateChallenge(
    challengeId: string,
    patch: UpdateMfaChallengeInput,
  ): Promise<MfaChallenge | null>;

  incrementChallengeAttempts(challengeId: string): Promise<MfaChallenge | null>;

  consumePendingLoginsForUser(userId: string): Promise<void>;

  replaceRecoveryCodes(userId: string, codeHashes: string[]): Promise<void>;

  findUnusedRecoveryCodes(userId: string): Promise<MfaRecoveryCode[]>;

  markRecoveryCodeUsed(id: string): Promise<boolean>;

  revokeUnusedRecoveryCodes(userId: string): Promise<void>;
}
