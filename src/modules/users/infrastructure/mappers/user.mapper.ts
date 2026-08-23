import type { UserRecord } from "@/infrastructure/database/schema/users.schema";
import type { UpdateUserData } from "@/modules/users/application/repositories/user.repository";
import { User } from "@/modules/users/domain/entities/user.entity";
import { Email } from "@/modules/users/domain/value-objects/email.vo";

export function toDomainUser(record: UserRecord): User {
  return User.create({
    id: record.id,
    name: record.name,
    email: Email.create(record.email),
    passwordHash: record.passwordHash,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toPersistenceUser(user: User): {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: user.getId(),
    name: user.getName(),
    email: user.getEmail().getValue(),
    passwordHash: user.getPasswordHash(),
    createdAt: user.getCreatedAt(),
    updatedAt: user.getUpdatedAt(),
  };
}

export function toPersistenceUserUpdate(data: UpdateUserData): Partial<{
  name: string;
  email: string;
  passwordHash: string;
}> {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.passwordHash !== undefined && {
      passwordHash: data.passwordHash,
    }),
  };
}
