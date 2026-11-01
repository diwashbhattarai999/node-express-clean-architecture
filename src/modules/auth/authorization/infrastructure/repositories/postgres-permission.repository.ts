import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { permissions } from "@/infrastructure/database/drizzle/schema/authorization/permissions.schema";
import { rolePermissions } from "@/infrastructure/database/drizzle/schema/authorization/role-permissions.schema";
import { userRoles } from "@/infrastructure/database/drizzle/schema/authorization/user-roles.schema";
import type {
  IPermissionRepository,
  ListPermissionsQuery,
  ListPermissionsResult,
  Permission,
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
