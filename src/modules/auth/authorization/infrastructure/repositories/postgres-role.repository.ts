import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { roles } from "@/infrastructure/database/drizzle/schema/authorization/roles.schema";
import { userRoles } from "@/infrastructure/database/drizzle/schema/authorization/user-roles.schema";
import type {
  IRoleRepository,
  Role,
} from "@/modules/auth/authorization/application/ports/role.repository";

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

    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description ?? null,
      createdAt: row.createdAt,
    }));
  }
}
