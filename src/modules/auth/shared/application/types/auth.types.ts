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

export type CreateSessionInput = {
  id: string;
  familyId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};
