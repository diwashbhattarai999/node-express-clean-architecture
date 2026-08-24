import { sql } from "@/infrastructure/database/drizzle/client";

/**
 * Verifies that the database accepts queries.
 *
 * @returns `true` when the database responds successfully.
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await sql`SELECT 1`;

    return true;
  } catch {
    return false;
  }
};
