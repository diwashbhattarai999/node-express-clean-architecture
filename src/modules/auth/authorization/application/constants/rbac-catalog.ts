import {
  PERMISSION_KEYS,
  PermissionKey,
  type TPermissionKey,
} from "@/modules/auth/authorization/application/constants/permission-keys";
import {
  RoleKey,
  type TRoleKey,
} from "@/modules/auth/authorization/application/constants/role-keys";

export type RbacCatalogPermission = {
  key: TPermissionKey;
  name: string;
  description: string;
};

export type RbacCatalogRole = {
  key: TRoleKey;
  name: string;
  description: string;
};

export const DEFAULT_PERMISSIONS: RbacCatalogPermission[] = [
  {
    key: PermissionKey.USERS_READ,
    name: "Read users",
    description: "List and view user accounts.",
  },
  {
    key: PermissionKey.USERS_UPDATE,
    name: "Update users",
    description: "Update user profiles and trigger password resets.",
  },
  {
    key: PermissionKey.USERS_SUSPEND,
    name: "Suspend users",
    description: "Suspend, reactivate, enable, or disable accounts.",
  },
  {
    key: PermissionKey.USERS_DELETE,
    name: "Delete users",
    description: "Permanently delete user accounts.",
  },
  { key: PermissionKey.ROLES_READ, name: "Read roles", description: "List and view roles." },
  { key: PermissionKey.ROLES_CREATE, name: "Create roles", description: "Create roles." },
  {
    key: PermissionKey.ROLES_UPDATE,
    name: "Update roles",
    description: "Update role names and descriptions.",
  },
  { key: PermissionKey.ROLES_DELETE, name: "Delete roles", description: "Delete roles." },
  {
    key: PermissionKey.ROLES_ASSIGN,
    name: "Assign roles",
    description: "Assign or remove roles on users.",
  },
  {
    key: PermissionKey.PERMISSIONS_READ,
    name: "Read permissions",
    description: "List and view permissions.",
  },
  {
    key: PermissionKey.PERMISSIONS_ASSIGN,
    name: "Assign permissions",
    description: "Assign permissions to roles.",
  },
  { key: PermissionKey.SESSIONS_READ, name: "Read sessions", description: "View user sessions." },
  {
    key: PermissionKey.SESSIONS_REVOKE,
    name: "Revoke sessions",
    description: "Revoke user sessions.",
  },
  {
    key: PermissionKey.AUDIT_LOGS_READ,
    name: "Read audit logs",
    description: "View security audit logs.",
  },
  {
    key: PermissionKey.AUDIT_LOGS_EXPORT,
    name: "Export audit logs",
    description: "Export security audit logs.",
  },
];

export const DEFAULT_ROLES: RbacCatalogRole[] = [
  {
    key: RoleKey.MEMBER,
    name: "Member",
    description: "Default account role. Self-service only; no admin permissions.",
  },
  {
    key: RoleKey.ADMIN,
    name: "Administrator",
    description: "Platform administrator with the full permission catalog.",
  },
  {
    key: RoleKey.SUPERADMIN,
    name: "Super administrator",
    description: "Bootstrap operator role with the full permission catalog.",
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<TRoleKey, readonly TPermissionKey[]> = {
  [RoleKey.MEMBER]: [],
  [RoleKey.ADMIN]: PERMISSION_KEYS,
  [RoleKey.SUPERADMIN]: PERMISSION_KEYS,
};
