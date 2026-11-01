import { and, asc, eq } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { permissions } from "@/infrastructure/database/drizzle/schema/authorization/permissions.schema";
import { rolePermissions } from "@/infrastructure/database/drizzle/schema/authorization/role-permissions.schema";
import { userRoles } from "@/infrastructure/database/drizzle/schema/authorization/user-roles.schema";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";

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
}
