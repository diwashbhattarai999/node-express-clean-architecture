import type { TPasskeyChallengeType } from "@/modules/auth/passkeys/application/constants/passkeys";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

export type Passkey = {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: Buffer;
  signCount: number;
  transports: string[] | null;
  aaguid: string | null;
  backedUp: boolean | null;
  name: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export type InsertPasskeyInput = {
  userId: string;
  credentialId: string;
  publicKey: Buffer;
  signCount: number;
  transports: string[] | null;
  aaguid: string | null;
  backedUp: boolean | null;
  name: string | null;
};

export type PasskeyChallenge = {
  id: string;
  userId: string | null;
  type: TPasskeyChallengeType;
  challenge: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export type InsertPasskeyChallengeInput = {
  userId?: string | null;
  type: TPasskeyChallengeType;
  challenge: string;
  expiresAt: Date;
};

export interface IPasskeyRepository {
  findAuthUserById(userId: string): Promise<AuthUser | null>;

  listPasskeysForUser(userId: string): Promise<Passkey[]>;

  findPasskeyForUser(userId: string, passkeyId: string): Promise<Passkey | null>;

  findPasskeyByCredentialId(credentialId: string): Promise<Passkey | null>;

  insertPasskey(input: InsertPasskeyInput): Promise<Passkey>;

  updatePasskeyName(userId: string, passkeyId: string, name: string): Promise<Passkey | null>;

  markPasskeyUsed(passkeyId: string, signCount: number, usedAt: Date): Promise<void>;

  revokePasskey(userId: string, passkeyId: string): Promise<Passkey | null>;

  countViableAuthMethods(userId: string, excludingPasskeyId?: string): Promise<number>;

  insertChallenge(input: InsertPasskeyChallengeInput): Promise<PasskeyChallenge>;

  consumeOpenChallenges(userId: string, type: TPasskeyChallengeType): Promise<void>;

  findUsableChallenge(
    challenge: string,
    type: TPasskeyChallengeType,
  ): Promise<PasskeyChallenge | null>;

  consumeChallenge(id: string): Promise<boolean>;
}
