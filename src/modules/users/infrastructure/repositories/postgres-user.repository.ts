import { and, asc, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { isUniqueViolation } from "@/infrastructure/database/drizzle/errors";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import { UserEmailAlreadyExistsError } from "@/modules/users/application/errors/user-email-already-exists.error";
import type { User } from "@/modules/users/domain/entities/user.entity";
import type {
  FindUsersCriteria,
  IUserRepository,
  UpdateUserData,
} from "@/modules/users/domain/repositories/user.repository";
import type { Email } from "@/modules/users/domain/value-objects/email.vo";
import {
  toDomainUser,
  toPersistenceUser,
  toPersistenceUserUpdate,
} from "@/modules/users/infrastructure/mappers/user.mapper";
import { getPaginationOffset } from "@/shared/http/pagination";

const sortColumnMap = {
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

export class PostgresUserRepository implements IUserRepository {
  async findById(id: string) {
    const [record] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    return record ? toDomainUser(record) : null;
  }

  async findByEmail(email: Email) {
    const [record] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.getValue()))
      .limit(1);

    return record ? toDomainUser(record) : null;
  }

  async findMany(criteria: FindUsersCriteria) {
    const conditions = [];

    if (criteria.search) {
      const searchTerm = `%${criteria.search}%`;

      conditions.push(or(ilike(users.name, searchTerm), ilike(users.email, searchTerm)));
    }

    if (criteria.name) {
      conditions.push(ilike(users.name, `%${criteria.name}%`));
    }

    if (criteria.email) {
      conditions.push(ilike(users.email, `%${criteria.email}%`));
    }

    if (criteria.createdFrom) {
      conditions.push(gte(users.createdAt, criteria.createdFrom));
    }

    if (criteria.createdTo) {
      conditions.push(lte(users.createdAt, criteria.createdTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = sortColumnMap[criteria.sort.field];
    const orderByClause = criteria.sort.order === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = getPaginationOffset(criteria.pagination.page, criteria.pagination.limit);

    const [totalResult] = await db.select({ value: count() }).from(users).where(whereClause);

    const records = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(criteria.pagination.limit)
      .offset(offset);

    return {
      items: records.map(toDomainUser),
      total: totalResult?.value ?? 0,
    };
  }

  async create(user: User) {
    try {
      const [record] = await db.insert(users).values(toPersistenceUser(user)).returning();

      if (!record) {
        throw new Error("Failed to create user.");
      }

      return toDomainUser(record);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UserEmailAlreadyExistsError();
      }

      throw error;
    }
  }

  async update(id: string, data: UpdateUserData) {
    const updateData = toPersistenceUserUpdate(data);

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    try {
      const [record] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      return record ? toDomainUser(record) : null;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UserEmailAlreadyExistsError();
      }

      throw error;
    }
  }

  async delete(id: string) {
    const result = await db.delete(users).where(eq(users.id, id)).returning({
      id: users.id,
    });

    return result.length > 0;
  }
}
