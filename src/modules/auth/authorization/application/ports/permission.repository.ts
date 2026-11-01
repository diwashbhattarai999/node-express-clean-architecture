export interface IPermissionRepository {
  listKeysForUser(userId: string): Promise<string[]>;
  hasKeyForUser(userId: string, key: string): Promise<boolean>;
}
