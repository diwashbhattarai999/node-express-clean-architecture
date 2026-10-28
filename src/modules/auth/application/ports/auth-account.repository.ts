export type TLoginIdentityType = "email" | "phone" | "username";

export type TUserStatus = "pending_verification" | "active" | "suspended" | "disabled";

export type RegisterEmailIdentity = {
  identifier: string;
  normalizedIdentifier: string;
};

export type RegisterPhoneIdentity = {
  identifier: string;
  normalizedIdentifier: string;
};

export type RegisterVerificationToken = {
  purpose: "email_verification" | "phone_verification";
  tokenHash: string;
  expiresAt: Date;
};

export type RegisterAccountInput = {
  id: string;
  displayName: string | null;
  passwordHash: string;
  email?: RegisterEmailIdentity;
  phone?: RegisterPhoneIdentity;
  verificationToken: RegisterVerificationToken;
};

export type AuthUser = {
  id: string;
  status: TUserStatus;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  username: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSessionInput = {
  id: string;
  familyId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

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

export type PasswordLoginCandidate = {
  userId: string;
  status: TUserStatus;
  passwordHash: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  username: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface IAuthAccountRepository {
  findIdentityByNormalized(
    type: TLoginIdentityType,
    normalizedIdentifier: string,
  ): Promise<{ userId: string } | null>;

  register(input: RegisterAccountInput): Promise<AuthUser>;

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

  findPasswordLoginCandidate(
    type: TLoginIdentityType,
    normalizedIdentifier: string,
  ): Promise<PasswordLoginCandidate | null>;

  createSession(userId: string, session: CreateSessionInput): Promise<void>;
}
