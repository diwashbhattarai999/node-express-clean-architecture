import type {
  AuthLoginIdentity,
  AuthUser,
  AuthUserProfile,
  TLoginIdentityType,
} from "@/modules/auth/shared/application/types/auth.types";

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

export type FindAuthenticatedPrincipalResult =
  | { outcome: "invalid_session" }
  | { outcome: "expired_session" }
  | { outcome: "revoked_session" }
  | { outcome: "user_not_found" }
  | { outcome: "ok"; user: AuthUser; roles: string[] };

export type FindOwnProfileResult =
  | { outcome: "invalid_session" }
  | { outcome: "expired_session" }
  | { outcome: "revoked_session" }
  | { outcome: "user_not_found" }
  | { outcome: "ok"; user: AuthUser; profile: AuthUserProfile };

export type UpsertUsernameInput = {
  userId: string;
  identifier: string;
  normalizedIdentifier: string;
};

export type UpdateOwnProfileInput = {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  locale?: string | null;
  timezone?: string | null;
  bio?: string | null;
};

export type UpdateOwnProfileResult = {
  user: AuthUser;
  profile: AuthUserProfile;
};

export type AddEmailIdentityInput = {
  userId: string;
  identifier: string;
  normalizedIdentifier: string;
  tokenHash: string;
  expiresAt: Date;
};

export type VerifyAddedEmailByTokenHashResult =
  | { outcome: "invalid" }
  | { outcome: "expired" }
  | { outcome: "verified"; userId: string; identity: AuthLoginIdentity };

export type RemoveEmailIdentityInput = {
  userId: string;
  identityId: string;
};

export type RemoveEmailIdentityResult =
  | { outcome: "removed" }
  | { outcome: "not_found" }
  | { outcome: "last_auth_method" };

export type ScheduleAccountDeletionInput = {
  userId: string;
  scheduledFor: Date;
  reason?: string;
};

export type ScheduleAccountDeletionResult =
  | { outcome: "not_found" }
  | { outcome: "scheduled"; scheduledFor: Date };

export interface IIdentityRepository {
  findIdentityByNormalized(
    type: TLoginIdentityType,
    normalizedIdentifier: string,
  ): Promise<{ userId: string } | null>;

  register(input: RegisterAccountInput): Promise<AuthUser>;

  findAuthenticatedPrincipal(
    userId: string,
    sessionId: string,
  ): Promise<FindAuthenticatedPrincipalResult>;

  findOwnProfile(userId: string, sessionId: string): Promise<FindOwnProfileResult>;

  updateOwnProfile(input: UpdateOwnProfileInput): Promise<UpdateOwnProfileResult>;

  listIdentitiesForUser(userId: string): Promise<AuthLoginIdentity[]>;

  addEmailIdentity(input: AddEmailIdentityInput): Promise<AuthLoginIdentity>;

  verifyAddedEmailByTokenHash(tokenHash: string): Promise<VerifyAddedEmailByTokenHashResult>;

  removeEmailIdentity(input: RemoveEmailIdentityInput): Promise<RemoveEmailIdentityResult>;

  scheduleAccountDeletion(
    input: ScheduleAccountDeletionInput,
  ): Promise<ScheduleAccountDeletionResult>;

  /** Creates or replaces the user's username login identity. */
  upsertUsername(input: UpsertUsernameInput): Promise<AuthUser>;
}
