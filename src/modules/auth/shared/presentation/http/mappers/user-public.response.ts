import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

export type UserPublicResponse = {
  id: string;
  status: "pending_verification" | "active" | "suspended" | "disabled";
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  username: string | null;
  createdAt: string;
  updatedAt: string;
};

export const toUserPublicResponse = (account: AuthUser): UserPublicResponse => ({
  id: account.id,
  status: account.status,
  displayName: account.displayName,
  avatarUrl: account.avatarUrl,
  email: account.email,
  username: account.username,
  createdAt: account.createdAt.toISOString(),
  updatedAt: account.updatedAt.toISOString(),
});
