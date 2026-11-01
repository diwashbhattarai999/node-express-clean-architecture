import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

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

export type CreateRoleData = {
  key: string;
  name: string;
  description: string | null;
};

export type UpdateRoleData = {
  name?: string;
  description?: string | null;
};

export type DeleteRoleResult = "deleted" | "not_found" | "assigned";

export type ListRoleUsersQuery = {
  page: number;
  limit: number;
};

export type ListRoleUsersResult = {
  items: AuthUser[];
  total: number;
};

export interface IRoleRepository {
  listForUser(userId: string): Promise<Role[]>;
  list(query: ListRolesQuery): Promise<ListRolesResult>;
  findById(roleId: string): Promise<Role | null>;
  findByKey(key: string): Promise<Role | null>;
  create(data: CreateRoleData): Promise<Role>;
  update(roleId: string, data: UpdateRoleData): Promise<Role | null>;
  deleteById(roleId: string): Promise<DeleteRoleResult>;
  listUsersForRole(roleId: string, query: ListRoleUsersQuery): Promise<ListRoleUsersResult>;
}
