import { and, asc, count, desc, eq, ilike, inArray, isNull, or, type SQL } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { isUniqueViolation } from "@/infrastructure/database/drizzle/errors";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { roles } from "@/infrastructure/database/drizzle/schema/authorization/roles.schema";
import { userRoles } from "@/infrastructure/database/drizzle/schema/authorization/user-roles.schema";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import { RoleAlreadyExistsError } from "@/modules/auth/authorization/application/errors/role-already-exists.error";
import type {
  AssignUserRoleInput,
  AssignUserRoleResult,
  CreateRoleData,
  DeleteRoleResult,
  IRoleRepository,
  ListRolesQuery,
  ListRolesResult,
  ListRoleUsersQuery,
  ListRoleUsersResult,
  RemoveUserRoleResult,
  ReplaceUserRolesInput,
  ReplaceUserRolesResult,
  Role,
  UpdateRoleData,
} from "@/modules/auth/authorization/application/ports/role.repository";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
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

  public async listUsersForRole(
    roleId: string,
    query: ListRoleUsersQuery,
  ): Promise<ListRoleUsersResult> {
    const assignedUsers = and(eq(userRoles.roleId, roleId), isNull(users.deletedAt));
    const offset = getPaginationOffset(query.page, query.limit);

    const [totalResult] = await db
      .select({ value: count() })
      .from(userRoles)
      .innerJoin(users, eq(users.id, userRoles.userId))
      .where(assignedUsers);

    const rows = await db
      .select({
        id: users.id,
        status: users.status,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(userRoles)
      .innerJoin(users, eq(users.id, userRoles.userId))
      .where(assignedUsers)
      .orderBy(desc(userRoles.assignedAt), asc(users.id))
      .limit(query.limit)
      .offset(offset);

    if (rows.length === 0) {
      return { total: totalResult?.value ?? 0, items: [] };
    }

    const identities = await db
      .select({
        userId: loginIdentities.userId,
        type: loginIdentities.type,
        identifier: loginIdentities.normalizedIdentifier,
        isPrimary: loginIdentities.isPrimary,
        verifiedAt: loginIdentities.verifiedAt,
      })
      .from(loginIdentities)
      .where(
        inArray(
          loginIdentities.userId,
          rows.map((row) => row.id),
        ),
      );

    const identitiesByUser = new Map<string, typeof identities>();

    for (const identity of identities) {
      const existing = identitiesByUser.get(identity.userId);

      if (existing) {
        existing.push(identity);
      } else {
        identitiesByUser.set(identity.userId, [identity]);
      }
    }

    return {
      total: totalResult?.value ?? 0,
      items: rows.map((row) => toAuthUser(row, identitiesByUser.get(row.id) ?? [])),
    };
  }

  public async assignToUser(input: AssignUserRoleInput): Promise<AssignUserRoleResult> {
    return db.transaction(async (tx) => {
      const [role] = await tx
        .select(roleColumns)
        .from(roles)
        .where(eq(roles.id, input.roleId))
        .limit(1);

      if (!role) {
        return { outcome: "role_not_found" };
      }

      const [existing] = await tx
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .where(and(eq(userRoles.userId, input.userId), eq(userRoles.roleId, input.roleId)))
        .limit(1);

      if (existing) {
        return { outcome: "already_assigned" };
      }

      await tx.insert(userRoles).values({
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: input.assignedBy,
      });

      return { outcome: "assigned", role: toRole(role) };
    });
  }

  public async removeFromUser(userId: string, roleId: string): Promise<RemoveUserRoleResult> {
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
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
        .returning({ userId: userRoles.userId });

      return deleted ? "removed" : "assignment_not_found";
    });
  }

  public async replaceForUser(input: ReplaceUserRolesInput): Promise<ReplaceUserRolesResult> {
    return db.transaction(async (tx) => {
      const uniqueIds = [...new Set(input.roleIds)];

      if (uniqueIds.length > 0) {
        const found = await tx
          .select({ id: roles.id })
          .from(roles)
          .where(inArray(roles.id, uniqueIds));
        const foundIds = new Set(found.map((row) => row.id));
        const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

        if (missingIds.length > 0) {
          return { outcome: "roles_not_found", missingIds };
        }
      }

      await tx.delete(userRoles).where(eq(userRoles.userId, input.userId));

      if (uniqueIds.length > 0) {
        await tx.insert(userRoles).values(
          uniqueIds.map((roleId) => ({
            userId: input.userId,
            roleId,
            assignedBy: input.assignedBy,
          })),
        );
      }

      const rows = await tx
        .select(roleColumns)
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .where(eq(userRoles.userId, input.userId))
        .orderBy(desc(userRoles.assignedAt), asc(roles.key));

      return { outcome: "replaced", roles: rows.map(toRole) };
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

const toAuthUser = (
  row: {
    id: string;
    status: AuthUser["status"];
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  identities: Array<{
    type: string;
    identifier: string;
    isPrimary: boolean;
    verifiedAt: Date | null;
  }>,
): AuthUser => {
  const email =
    identities.find(
      (identity) => identity.type === "email" && identity.isPrimary && identity.verifiedAt !== null,
    )?.identifier ??
    identities.find((identity) => identity.type === "email" && identity.verifiedAt !== null)
      ?.identifier ??
    null;

  return {
    id: row.id,
    status: row.status,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    email,
    username: identities.find((identity) => identity.type === "username")?.identifier ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};
