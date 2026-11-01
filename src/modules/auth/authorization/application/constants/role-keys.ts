export const RoleKey = {
  MEMBER: "member",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
} as const;

export type TRoleKey = (typeof RoleKey)[keyof typeof RoleKey];

export const ROLE_KEYS = Object.values(RoleKey);
