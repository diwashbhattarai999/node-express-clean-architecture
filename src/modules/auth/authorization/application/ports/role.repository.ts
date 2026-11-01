export type Role = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export type ListRolesQuery = {
  page: number;
  limit: number;
  search?: string;
};

export type ListRolesResult = {
  items: Role[];
  total: number;
};

export interface IRoleRepository {
  listForUser(userId: string): Promise<Role[]>;
  list(query: ListRolesQuery): Promise<ListRolesResult>;
  findById(roleId: string): Promise<Role | null>;
}
