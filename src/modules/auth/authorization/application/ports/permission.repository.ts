export type Permission = {
  id: string;
  key: string;
  name: string;
  description: string | null;
};

export interface IPermissionRepository {
  listKeysForUser(userId: string): Promise<string[]>;
  hasKeyForUser(userId: string, key: string): Promise<boolean>;
  listForRole(roleId: string): Promise<Permission[]>;
}
