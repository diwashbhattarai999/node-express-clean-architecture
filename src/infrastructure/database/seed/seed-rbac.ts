import { sql } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { permissions } from "@/infrastructure/database/drizzle/schema/authorization/permissions.schema";
import { rolePermissions } from "@/infrastructure/database/drizzle/schema/authorization/role-permissions.schema";
import { roles } from "@/infrastructure/database/drizzle/schema/authorization/roles.schema";
import {
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLES,
} from "@/modules/auth/authorization/application/constants/rbac-catalog";
import type { TRoleKey } from "@/modules/auth/authorization/application/constants/role-keys";

export type SeedRbacResult = {
  permissionCount: number;
  roleCount: number;
  assignmentCount: number;
};

export const seedRbacCatalog = async (executor: typeof db = db): Promise<SeedRbacResult> => {
  await executor
    .insert(permissions)
    .values(
      DEFAULT_PERMISSIONS.map((permission) => ({
        key: permission.key,
        name: permission.name,
        description: permission.description,
      })),
    )
    .onConflictDoUpdate({
      target: permissions.key,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
      },
    });

  await executor
    .insert(roles)
    .values(
      DEFAULT_ROLES.map((role) => ({
        key: role.key,
        name: role.name,
        description: role.description,
      })),
    )
    .onConflictDoUpdate({
      target: roles.key,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
      },
    });

  const permissionRows = await executor
    .select({ id: permissions.id, key: permissions.key })
    .from(permissions);
  const roleRows = await executor.select({ id: roles.id, key: roles.key }).from(roles);

  const permissionIdByKey = new Map(permissionRows.map((row) => [row.key, row.id]));
  const roleIdByKey = new Map(roleRows.map((row) => [row.key, row.id]));

  const assignments = Object.entries(DEFAULT_ROLE_PERMISSIONS).flatMap(([roleKey, keys]) => {
    const roleId = roleIdByKey.get(roleKey as TRoleKey);

    if (!roleId) {
      return [];
    }

    return keys.flatMap((key) => {
      const permissionId = permissionIdByKey.get(key);

      return permissionId ? [{ roleId, permissionId }] : [];
    });
  });

  if (assignments.length > 0) {
    await executor.insert(rolePermissions).values(assignments).onConflictDoNothing();
  }

  return {
    permissionCount: DEFAULT_PERMISSIONS.length,
    roleCount: DEFAULT_ROLES.length,
    assignmentCount: assignments.length,
  };
};
