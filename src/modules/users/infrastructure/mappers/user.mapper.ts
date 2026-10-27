import { User } from "@/modules/users/domain/entities/user.entity";
import type { UpdateUserData } from "@/modules/users/domain/repositories/user.repository";
import { Email } from "@/modules/users/domain/value-objects/email.vo";

/** Joined account row used by the sample users repository (user + email identity + password). */
export type UserAccountRow = {
  id: string;
  displayName: string | null;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toDomainUser(record: UserAccountRow): User {
  return User.create({
    id: record.id,
    name: record.displayName ?? "",
    email: Email.create(record.email),
    passwordHash: record.passwordHash,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toPersistenceUser(user: User): {
  id: string;
  displayName: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: user.getId(),
    displayName: user.getName(),
    email: user.getEmail().getValue(),
    passwordHash: user.getPasswordHash(),
    createdAt: user.getCreatedAt(),
    updatedAt: user.getUpdatedAt(),
  };
}

export function toPersistenceUserUpdate(data: UpdateUserData): Partial<{
  displayName: string;
  email: string;
  passwordHash: string;
}> {
  return {
    ...(data.name !== undefined && { displayName: data.name }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.passwordHash !== undefined && {
      passwordHash: data.passwordHash,
    }),
  };
}
