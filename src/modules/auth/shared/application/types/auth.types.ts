export type TLoginIdentityType = "email" | "phone" | "username";

export type TUserStatus = "pending_verification" | "active" | "suspended" | "disabled";

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

export type AuthUserProfile = {
  firstName: string | null;
  lastName: string | null;
  locale: string | null;
  timezone: string | null;
  bio: string | null;
};

export const EMPTY_AUTH_USER_PROFILE: AuthUserProfile = {
  firstName: null,
  lastName: null,
  locale: null,
  timezone: null,
  bio: null,
};

export type AuthLoginIdentity = {
  id: string;
  type: TLoginIdentityType;
  identifier: string;
  verifiedAt: Date | null;
  isPrimary: boolean;
  createdAt: Date;
};

export type CreateSessionInput = {
  id: string;
  familyId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};
