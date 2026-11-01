export const PermissionKey = {
  ROLES_READ: "roles.read",
} as const;

export type TPermissionKey = (typeof PermissionKey)[keyof typeof PermissionKey];
