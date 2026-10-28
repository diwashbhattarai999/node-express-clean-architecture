import type {
  AuthUser,
  CreateSessionInput,
} from "@/modules/auth/shared/application/types/auth.types";

export type VerifyEmailByTokenHashResult =
  | { outcome: "invalid" }
  | { outcome: "expired" }
  | { outcome: "verified"; user: AuthUser; sessionId: string };

export type VerifyPhoneByCodeHashResult =
  | { outcome: "invalid" }
  | { outcome: "expired" }
  | { outcome: "too_many_attempts" }
  | { outcome: "verified"; user: AuthUser; sessionId: string };

export type UnverifiedEmailIdentity = {
  userId: string;
  identityId: string;
  email: string;
};

export type UnverifiedPhoneIdentity = {
  userId: string;
  identityId: string;
  phone: string;
};

export type ReplaceEmailVerificationTokenInput = {
  userId: string;
  identityId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type ReplacePhoneVerificationTokenInput = {
  userId: string;
  identityId: string;
  tokenHash: string;
  expiresAt: Date;
};

export interface IVerificationRepository {
  verifyEmailByTokenHash(
    tokenHash: string,
    session: CreateSessionInput,
  ): Promise<VerifyEmailByTokenHashResult>;

  findUnverifiedEmailIdentity(normalizedEmail: string): Promise<UnverifiedEmailIdentity | null>;

  replaceEmailVerificationToken(input: ReplaceEmailVerificationTokenInput): Promise<void>;

  verifyPhoneByCodeHash(
    normalizedPhone: string,
    codeHash: string,
    session: CreateSessionInput,
    maxAttempts: number,
  ): Promise<VerifyPhoneByCodeHashResult>;

  findUnverifiedPhoneIdentity(normalizedPhone: string): Promise<UnverifiedPhoneIdentity | null>;

  replacePhoneVerificationToken(input: ReplacePhoneVerificationTokenInput): Promise<void>;
}
