import type { Role } from "@/modules/auth/authorization/application/ports/role.repository";

export type RoleResponse = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export const toRoleResponse = (role: Role): RoleResponse => ({
  id: role.id,
  key: role.key,
  name: role.name,
  description: role.description,
  createdAt: role.createdAt.toISOString(),
});

export const toRoleResponseList = (roles: Role[]): RoleResponse[] => roles.map(toRoleResponse);
