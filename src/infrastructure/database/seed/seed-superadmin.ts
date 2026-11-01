import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { passwordCredentials } from "@/infrastructure/database/drizzle/schema/auth/password-credentials.schema";
import { roles } from "@/infrastructure/database/drizzle/schema/authorization/roles.schema";
import { userRoles } from "@/infrastructure/database/drizzle/schema/authorization/user-roles.schema";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import { RoleKey } from "@/modules/auth/authorization/application/constants/role-keys";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import { passwordSchema } from "@/shared/http/schemas";

export type SeedSuperadminInput = {
  email: string;
  password: string;
  displayName?: string;
};

export type SeedSuperadminResult =
  | { outcome: "skipped" }
  | { outcome: "created"; userId: string; email: string }
  | { outcome: "already_exists"; userId: string; email: string };

export const seedSuperadmin = async (
  input: SeedSuperadminInput | null,
  passwordHasher: IPasswordHasher,
  executor: typeof db = db,
): Promise<SeedSuperadminResult> => {
  if (input === null) {
    return { outcome: "skipped" };
  }

  const email = input.email.trim().toLowerCase();
  const password = passwordSchema.parse(input.password);
  const displayName = input.displayName?.trim() || "Superadmin";

  const [role] = await executor
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.key, RoleKey.SUPERADMIN))
    .limit(1);

  if (!role) {
    throw new Error("superadmin role is missing; seed the RBAC catalog first.");
  }

  const [existing] = await executor
    .select({ userId: loginIdentities.userId, deletedAt: users.deletedAt })
    .from(loginIdentities)
    .innerJoin(users, eq(users.id, loginIdentities.userId))
    .where(and(eq(loginIdentities.type, "email"), eq(loginIdentities.normalizedIdentifier, email)))
    .limit(1);

  if (existing) {
    if (existing.deletedAt !== null) {
      throw new Error(`A deleted account already uses ${email}; restore or pick another email.`);
    }

    await executor
      .insert(userRoles)
      .values({ userId: existing.userId, roleId: role.id })
      .onConflictDoNothing();

    return { outcome: "already_exists", userId: existing.userId, email };
  }

  const userId = randomUUID();
  const now = new Date();
  const passwordHash = await passwordHasher.hash(password);

  const [createdUser] = await executor
    .insert(users)
    .values({
      id: userId,
      status: "active",
      displayName,
      activatedAt: now,
    })
    .returning({ id: users.id });

  if (!createdUser) {
    throw new Error("Failed to create the superadmin user.");
  }

  await executor.insert(loginIdentities).values({
    userId,
    type: "email",
    identifier: email,
    normalizedIdentifier: email,
    isPrimary: true,
    verifiedAt: now,
  });

  await executor.insert(passwordCredentials).values({
    userId,
    passwordHash,
  });

  await executor.insert(userRoles).values({
    userId,
    roleId: role.id,
  });

  return { outcome: "created", userId, email };
};

export const toSeedSuperadminInput = (options: {
  email?: string;
  password?: string;
  displayName?: string;
}): SeedSuperadminInput | null => {
  const email = options.email?.trim();
  const password = options.password;

  if (!email && password === undefined) {
    return null;
  }

  if (!email || password === undefined) {
    throw new Error("SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD must be set together.");
  }

  return {
    email,
    password,
    ...(options.displayName !== undefined ? { displayName: options.displayName } : {}),
  };
};
