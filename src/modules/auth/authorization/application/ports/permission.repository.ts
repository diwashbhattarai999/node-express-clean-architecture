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

export interface IPermissionRepository {
  listKeysForUser(userId: string): Promise<string[]>;
  hasKeyForUser(userId: string, key: string): Promise<boolean>;
  listForRole(roleId: string): Promise<Permission[]>;
  list(query: ListPermissionsQuery): Promise<ListPermissionsResult>;
  findById(permissionId: string): Promise<Permission | null>;
}
