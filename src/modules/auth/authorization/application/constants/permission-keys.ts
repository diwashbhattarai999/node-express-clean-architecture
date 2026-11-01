export const PermissionKey = {
  USERS_READ: "users.read",
  USERS_UPDATE: "users.update",
  USERS_SUSPEND: "users.suspend",
  USERS_DELETE: "users.delete",
  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",
  ROLES_ASSIGN: "roles.assign",
  PERMISSIONS_READ: "permissions.read",
  PERMISSIONS_ASSIGN: "permissions.assign",
  SESSIONS_READ: "sessions.read",
  SESSIONS_REVOKE: "sessions.revoke",
  AUDIT_LOGS_READ: "audit_logs.read",
  AUDIT_LOGS_EXPORT: "audit_logs.export",
} as const;

export type TPermissionKey = (typeof PermissionKey)[keyof typeof PermissionKey];

export const PERMISSION_KEYS = Object.values(PermissionKey);
