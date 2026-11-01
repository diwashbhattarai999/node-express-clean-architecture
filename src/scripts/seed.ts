import { env } from "@/config/env";
import { db } from "@/infrastructure/database/drizzle";
import { closeDatabase } from "@/infrastructure/database/drizzle/lifecycle";
import { seedRbacCatalog } from "@/infrastructure/database/seed/seed-rbac";
import {
  seedSuperadmin,
  toSeedSuperadminInput,
} from "@/infrastructure/database/seed/seed-superadmin";
import { Argon2PasswordHasher } from "@/modules/auth/shared/infrastructure/security/argon2-password-hasher";
import { logger } from "@/shared/logger/logger";

const run = async (): Promise<void> => {
  const catalog = await seedRbacCatalog(db);
  logger.info(
    {
      permissions: catalog.permissionCount,
      roles: catalog.roleCount,
      rolePermissions: catalog.assignmentCount,
    },
    "Seeded RBAC catalog.",
  );

  const superadmin = await seedSuperadmin(
    toSeedSuperadminInput({
      ...(env.SEED_SUPERADMIN_EMAIL !== undefined ? { email: env.SEED_SUPERADMIN_EMAIL } : {}),
      ...(env.SEED_SUPERADMIN_PASSWORD !== undefined
        ? { password: env.SEED_SUPERADMIN_PASSWORD }
        : {}),
      ...(env.SEED_SUPERADMIN_DISPLAY_NAME !== undefined
        ? { displayName: env.SEED_SUPERADMIN_DISPLAY_NAME }
        : {}),
    }),
    new Argon2PasswordHasher(),
    db,
  );

  if (superadmin.outcome === "skipped") {
    logger.info("Skipped superadmin seed (SEED_SUPERADMIN_EMAIL is not set).");
    return;
  }

  logger.info(
    { userId: superadmin.userId, email: superadmin.email, outcome: superadmin.outcome },
    superadmin.outcome === "created"
      ? "Created superadmin user."
      : "Superadmin already exists; ensured superadmin role.",
  );
};

try {
  await run();
} finally {
  await closeDatabase();
}
