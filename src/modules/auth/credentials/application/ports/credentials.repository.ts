import type {
  AuthUser,
  TLoginIdentityType,
  TUserStatus,
} from "@/modules/auth/shared/application/types/auth.types";

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

export type PasswordResetTarget = {
  userId: string;
  identityId: string;
  email: string;
};

export type ReplacePasswordResetTokenInput = {
  userId: string;
  identityId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type ResetPasswordByTokenHashResult =
  | { outcome: "invalid" }
  | { outcome: "expired" }
  | { outcome: "revoked" }
  | { outcome: "reset" };

export type ValidatePasswordResetTokenResult = { valid: true; expiresAt: Date } | { valid: false };

export type MagicLinkTarget = {
  userId: string;
  identityId: string;
  email: string;
};

export type ReplaceMagicLinkTokenInput = {
  userId: string;
  identityId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type ConsumeMagicLinkByTokenHashResult =
  | { outcome: "invalid" }
  | { outcome: "expired" }
  | { outcome: "suspended" }
  | { outcome: "disabled" }
  | { outcome: "consumed"; user: AuthUser };

export interface ICredentialsRepository {
  findPasswordLoginCandidate(
    type: TLoginIdentityType,
    normalizedIdentifier: string,
  ): Promise<PasswordLoginCandidate | null>;

  findPasswordResetTarget(normalizedEmail: string): Promise<PasswordResetTarget | null>;

  findPasswordResetTargetByUserId(userId: string): Promise<PasswordResetTarget | null>;

  replacePasswordResetToken(input: ReplacePasswordResetTokenInput): Promise<void>;

  validatePasswordResetTokenHash(tokenHash: string): Promise<ValidatePasswordResetTokenResult>;

  resetPasswordByTokenHash(
    tokenHash: string,
    passwordHash: string,
  ): Promise<ResetPasswordByTokenHashResult>;

  findPasswordHashForUser(userId: string): Promise<string | null>;

  /** Updates password and revokes all other active sessions for the user. */
  changePasswordForUser(
    userId: string,
    passwordHash: string,
    currentSessionId: string,
  ): Promise<boolean>;

  findMagicLinkTarget(normalizedEmail: string): Promise<MagicLinkTarget | null>;

  replaceMagicLinkToken(input: ReplaceMagicLinkTokenInput): Promise<void>;

  consumeMagicLinkByTokenHash(tokenHash: string): Promise<ConsumeMagicLinkByTokenHashResult>;
}

export type { AuthUser };
