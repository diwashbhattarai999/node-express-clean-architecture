import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { roles } from "@/infrastructure/database/drizzle/schema/authorization/roles.schema";
import { userRoles } from "@/infrastructure/database/drizzle/schema/authorization/user-roles.schema";
import type {
  IRoleRepository,
  ListRolesQuery,
  ListRolesResult,
  Role,
} from "@/modules/auth/authorization/application/ports/role.repository";
import { getPaginationOffset } from "@/shared/http/pagination";

const roleColumns = {
  id: roles.id,
  key: roles.key,
  name: roles.name,
  description: roles.description,
  createdAt: roles.createdAt,
};

export class PostgresRoleRepository implements IRoleRepository {
  public async listForUser(userId: string): Promise<Role[]> {
    const rows = await db
      .select(roleColumns)
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, userId))
      .orderBy(desc(userRoles.assignedAt), asc(roles.key));

    return rows.map(toRole);
  }

  public async list(query: ListRolesQuery): Promise<ListRolesResult> {
    const conditions: SQL[] = [];
    const search = query.search?.trim();

    if (search) {
      const pattern = `%${search}%`;
      const match = or(
        ilike(roles.key, pattern),
        ilike(roles.name, pattern),
        ilike(roles.description, pattern),
      );

      if (match) {
        conditions.push(match);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = getPaginationOffset(query.page, query.limit);

    const [totalResult] = await db.select({ value: count() }).from(roles).where(whereClause);

    const rows = await db
      .select(roleColumns)
      .from(roles)
      .where(whereClause)
      .orderBy(asc(roles.key))
      .limit(query.limit)
      .offset(offset);

    return {
      total: totalResult?.value ?? 0,
      items: rows.map(toRole),
    };
  }
}

const toRole = (row: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: Date;
}): Role => ({
  id: row.id,
  key: row.key,
  name: row.name,
  description: row.description ?? null,
  createdAt: row.createdAt,
});
