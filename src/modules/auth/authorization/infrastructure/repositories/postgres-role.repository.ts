import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { isUniqueViolation } from "@/infrastructure/database/drizzle/errors";
import { roles } from "@/infrastructure/database/drizzle/schema/authorization/roles.schema";
import { userRoles } from "@/infrastructure/database/drizzle/schema/authorization/user-roles.schema";
import { RoleAlreadyExistsError } from "@/modules/auth/authorization/application/errors/role-already-exists.error";
import type {
  CreateRoleData,
  DeleteRoleResult,
  IRoleRepository,
  ListRolesQuery,
  ListRolesResult,
  Role,
  UpdateRoleData,
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

  public async findById(roleId: string): Promise<Role | null> {
    const [row] = await db.select(roleColumns).from(roles).where(eq(roles.id, roleId)).limit(1);

    return row ? toRole(row) : null;
  }

  public async findByKey(key: string): Promise<Role | null> {
    const [row] = await db.select(roleColumns).from(roles).where(eq(roles.key, key)).limit(1);

    return row ? toRole(row) : null;
  }

  public async create(data: CreateRoleData): Promise<Role> {
    try {
      const [row] = await db.insert(roles).values(data).returning(roleColumns);

      if (!row) {
        throw new Error("Role insert did not return a row.");
      }

      return toRole(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new RoleAlreadyExistsError();
      }

      throw error;
    }
  }

  public async update(roleId: string, data: UpdateRoleData): Promise<Role | null> {
    const patch: UpdateRoleData = {};

    if (data.name !== undefined) {
      patch.name = data.name;
    }

    if (data.description !== undefined) {
      patch.description = data.description;
    }

    const [row] = await db
      .update(roles)
      .set(patch)
      .where(eq(roles.id, roleId))
      .returning(roleColumns);

    return row ? toRole(row) : null;
  }

  public async deleteById(roleId: string): Promise<DeleteRoleResult> {
    return db.transaction(async (tx) => {
      const [role] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (!role) {
        return "not_found";
      }

      const [assignment] = await tx
        .select({ value: count() })
        .from(userRoles)
        .where(eq(userRoles.roleId, roleId));

      if ((assignment?.value ?? 0) > 0) {
        return "assigned";
      }

      await tx.delete(roles).where(eq(roles.id, roleId));

      return "deleted";
    });
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
