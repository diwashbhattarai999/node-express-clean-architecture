import { and, asc, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { permissions } from "@/infrastructure/database/drizzle/schema/authorization/permissions.schema";
import { rolePermissions } from "@/infrastructure/database/drizzle/schema/authorization/role-permissions.schema";
import { roles } from "@/infrastructure/database/drizzle/schema/authorization/roles.schema";
import { userRoles } from "@/infrastructure/database/drizzle/schema/authorization/user-roles.schema";
import type {
  IPermissionRepository,
  ListPermissionsQuery,
  ListPermissionsResult,
  Permission,
  RemoveRolePermissionResult,
  ReplaceRolePermissionsInput,
  ReplaceRolePermissionsResult,
} from "@/modules/auth/authorization/application/ports/permission.repository";
import { getPaginationOffset } from "@/shared/http/pagination";

const permissionColumns = {
  id: permissions.id,
  key: permissions.key,
  name: permissions.name,
  description: permissions.description,
};

export class PostgresPermissionRepository implements IPermissionRepository {
  public async listKeysForUser(userId: string): Promise<string[]> {
    const rows = await db
      .selectDistinct({ key: permissions.key })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(userRoles.userId, userId))
      .orderBy(asc(permissions.key));

    return rows.map((row) => row.key);
  }

  public async hasKeyForUser(userId: string, key: string): Promise<boolean> {
    const [row] = await db
      .select({ key: permissions.key })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(eq(userRoles.userId, userId), eq(permissions.key, key)))
      .limit(1);

    return row !== undefined;
  }

  public async listForRole(roleId: string): Promise<Permission[]> {
    const rows = await db
      .select(permissionColumns)
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, roleId))
      .orderBy(asc(permissions.key));

    return rows.map(toPermission);
  }

  public async list(query: ListPermissionsQuery): Promise<ListPermissionsResult> {
    const conditions: SQL[] = [];
    const search = query.search?.trim();

    if (search) {
      const pattern = `%${search}%`;
      const match = or(
        ilike(permissions.key, pattern),
        ilike(permissions.name, pattern),
        ilike(permissions.description, pattern),
      );

      if (match) {
        conditions.push(match);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = getPaginationOffset(query.page, query.limit);

    const [totalResult] = await db.select({ value: count() }).from(permissions).where(whereClause);

    const rows = await db
      .select(permissionColumns)
      .from(permissions)
      .where(whereClause)
      .orderBy(asc(permissions.key))
      .limit(query.limit)
      .offset(offset);

    return {
      total: totalResult?.value ?? 0,
      items: rows.map(toPermission),
    };
  }

  public async findById(permissionId: string): Promise<Permission | null> {
    const [row] = await db
      .select(permissionColumns)
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    return row ? toPermission(row) : null;
  }

  public async replaceForRole(
    input: ReplaceRolePermissionsInput,
  ): Promise<ReplaceRolePermissionsResult> {
    return db.transaction(async (tx) => {
      const [role] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.id, input.roleId))
        .limit(1);

      if (!role) {
        return { outcome: "role_not_found" };
      }

      const uniqueIds = [...new Set(input.permissionIds)];

      if (uniqueIds.length > 0) {
        const found = await tx
          .select({ id: permissions.id })
          .from(permissions)
          .where(inArray(permissions.id, uniqueIds));
        const foundIds = new Set(found.map((row) => row.id));
        const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

        if (missingIds.length > 0) {
          return { outcome: "permissions_not_found", missingIds };
        }
      }

      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, input.roleId));

      if (uniqueIds.length > 0) {
        await tx.insert(rolePermissions).values(
          uniqueIds.map((permissionId) => ({
            roleId: input.roleId,
            permissionId,
            assignedBy: input.assignedBy,
          })),
        );
      }

      const rows = await tx
        .select(permissionColumns)
        .from(rolePermissions)
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, input.roleId))
        .orderBy(asc(permissions.key));

      return { outcome: "replaced", permissions: rows.map(toPermission) };
    });
  }

  public async removeFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<RemoveRolePermissionResult> {
    return db.transaction(async (tx) => {
      const [role] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (!role) {
        return "role_not_found";
      }

      const [deleted] = await tx
        .delete(rolePermissions)
        .where(
          and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)),
        )
        .returning({ permissionId: rolePermissions.permissionId });

      return deleted ? "removed" : "assignment_not_found";
    });
  }
}

const toPermission = (row: {
  id: string;
  key: string;
  name: string;
  description: string | null;
}): Permission => ({
  id: row.id,
  key: row.key,
  name: row.name,
  description: row.description ?? null,
});
