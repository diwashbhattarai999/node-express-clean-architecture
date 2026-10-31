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

  /** Creates or replaces the user's username login identity. */
  upsertUsername(input: UpsertUsernameInput): Promise<AuthUser>;
}
