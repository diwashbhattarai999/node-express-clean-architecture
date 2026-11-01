import type { Permission } from "@/modules/auth/authorization/application/ports/permission.repository";

export type PermissionResponse = {
  id: string;
  key: string;
  name: string;
  description: string | null;
};

export const toPermissionResponse = (permission: Permission): PermissionResponse => ({
  id: permission.id,
  key: permission.key,
  name: permission.name,
  description: permission.description,
});

export const toPermissionResponseList = (permissions: Permission[]): PermissionResponse[] =>
  permissions.map(toPermissionResponse);
