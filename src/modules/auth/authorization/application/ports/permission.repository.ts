export type Permission = {
  id: string;
  key: string;
  name: string;
  description: string | null;
};

export type ListPermissionsQuery = {
  page: number;
  limit: number;
  search?: string;
};

export type ListPermissionsResult = {
  items: Permission[];
  total: number;
};

export type ReplaceRolePermissionsInput = {
  roleId: string;
  permissionIds: string[];
  assignedBy: string;
};

export type ReplaceRolePermissionsResult =
  | { outcome: "replaced"; permissions: Permission[] }
  | { outcome: "role_not_found" }
  | { outcome: "permissions_not_found"; missingIds: string[] };

export interface IPermissionRepository {
  listKeysForUser(userId: string): Promise<string[]>;
  hasKeyForUser(userId: string, key: string): Promise<boolean>;
  listForRole(roleId: string): Promise<Permission[]>;
  list(query: ListPermissionsQuery): Promise<ListPermissionsResult>;
  findById(permissionId: string): Promise<Permission | null>;
  replaceForRole(input: ReplaceRolePermissionsInput): Promise<ReplaceRolePermissionsResult>;
}
