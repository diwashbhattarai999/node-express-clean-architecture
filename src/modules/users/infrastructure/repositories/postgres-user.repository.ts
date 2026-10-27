import { and, asc, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { isUniqueViolation } from "@/infrastructure/database/drizzle/errors";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { passwordCredentials } from "@/infrastructure/database/drizzle/schema/auth/password-credentials.schema";
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
  type UserAccountRow,
} from "@/modules/users/infrastructure/mappers/user.mapper";
import { getPaginationOffset } from "@/shared/http/pagination";

const accountSelect = {
  id: users.id,
  displayName: users.displayName,
  email: loginIdentities.normalizedIdentifier,
  passwordHash: passwordCredentials.passwordHash,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

const emailIdentityJoin = and(
  eq(loginIdentities.userId, users.id),
  eq(loginIdentities.type, "email"),
  eq(loginIdentities.isPrimary, true),
);

const sortColumnMap = {
  name: users.displayName,
  email: loginIdentities.normalizedIdentifier,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

const accountFrom = () =>
  db
    .select(accountSelect)
    .from(users)
    .innerJoin(loginIdentities, emailIdentityJoin)
    .innerJoin(passwordCredentials, eq(passwordCredentials.userId, users.id));

export class PostgresUserRepository implements IUserRepository {
  async findById(id: string) {
    const [record] = await accountFrom().where(eq(users.id, id)).limit(1);

    return record ? toDomainUser(record as UserAccountRow) : null;
  }

  async findByEmail(email: Email) {
    const [record] = await accountFrom()
      .where(eq(loginIdentities.normalizedIdentifier, email.getValue()))
      .limit(1);

    return record ? toDomainUser(record as UserAccountRow) : null;
  }

  async findMany(criteria: FindUsersCriteria) {
    const conditions: SQL[] = [];

    if (criteria.search) {
      const searchTerm = `%${criteria.search}%`;
      const searchCondition = or(
        ilike(users.displayName, searchTerm),
        ilike(loginIdentities.normalizedIdentifier, searchTerm),
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (criteria.name) {
      conditions.push(ilike(users.displayName, `%${criteria.name}%`));
    }

    if (criteria.email) {
      conditions.push(ilike(loginIdentities.normalizedIdentifier, `%${criteria.email}%`));
    }

    if (criteria.createdFrom) {
      conditions.push(gte(users.createdAt, criteria.createdFrom));
    }

    if (criteria.createdTo) {
      conditions.push(lte(users.createdAt, criteria.createdTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = sortColumnMap[criteria.sortBy];
    const orderByClause = criteria.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = getPaginationOffset(criteria.page, criteria.limit);

    const [totalResult] = await db
      .select({ value: count() })
      .from(users)
      .innerJoin(loginIdentities, emailIdentityJoin)
      .innerJoin(passwordCredentials, eq(passwordCredentials.userId, users.id))
      .where(whereClause);

    const records = await accountFrom()
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(criteria.limit)
      .offset(offset);

    return {
      items: records.map((record) => toDomainUser(record as UserAccountRow)),
      total: totalResult?.value ?? 0,
    };
  }

  async create(user: User) {
    const persistence = toPersistenceUser(user);
    const now = new Date();

    try {
      const record = await db.transaction(async (tx) => {
        const [createdUser] = await tx
          .insert(users)
          .values({
            id: persistence.id,
            displayName: persistence.displayName,
            status: "active",
            activatedAt: now,
            createdAt: persistence.createdAt,
            updatedAt: persistence.updatedAt,
          })
          .returning();

        if (!createdUser) {
          throw new Error("Failed to create user.");
        }

        await tx.insert(loginIdentities).values({
          userId: createdUser.id,
          type: "email",
          identifier: persistence.email,
          normalizedIdentifier: persistence.email,
          verifiedAt: now,
          isPrimary: true,
        });

        await tx.insert(passwordCredentials).values({
          userId: createdUser.id,
          passwordHash: persistence.passwordHash,
          passwordChangedAt: now,
        });

        return {
          id: createdUser.id,
          displayName: createdUser.displayName,
          email: persistence.email,
          passwordHash: persistence.passwordHash,
          createdAt: createdUser.createdAt,
          updatedAt: createdUser.updatedAt,
        } satisfies UserAccountRow;
      });

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
      await db.transaction(async (tx) => {
        const userPatch: {
          displayName?: string;
          updatedAt: Date;
        } = {
          updatedAt: new Date(),
        };

        if (updateData.displayName !== undefined) {
          userPatch.displayName = updateData.displayName;
        }

        const [updatedUser] = await tx
          .update(users)
          .set(userPatch)
          .where(eq(users.id, id))
          .returning({ id: users.id });

        if (!updatedUser) {
          return;
        }

        if (updateData.email !== undefined) {
          await tx
            .update(loginIdentities)
            .set({
              identifier: updateData.email,
              normalizedIdentifier: updateData.email,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(loginIdentities.userId, id),
                eq(loginIdentities.type, "email"),
                eq(loginIdentities.isPrimary, true),
              ),
            );
        }

        if (updateData.passwordHash !== undefined) {
          await tx
            .update(passwordCredentials)
            .set({
              passwordHash: updateData.passwordHash,
              passwordChangedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(passwordCredentials.userId, id));
        }
      });

      return this.findById(id);
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
