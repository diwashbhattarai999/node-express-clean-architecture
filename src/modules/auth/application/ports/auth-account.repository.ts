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
  maxAttempts?: number;
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

export type UnverifiedEmailIdentity = {
  userId: string;
  identityId: string;
  email: string;
};

export type ReplaceEmailVerificationTokenInput = {
  userId: string;
  identityId: string;
  tokenHash: string;
  expiresAt: Date;
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
}
