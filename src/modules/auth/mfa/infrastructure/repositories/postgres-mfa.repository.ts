import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { mfaChallenges } from "@/infrastructure/database/drizzle/schema/auth/mfa-challenges.schema";
import { mfaFactors } from "@/infrastructure/database/drizzle/schema/auth/mfa-factors.schema";
import { mfaRecoveryCodes } from "@/infrastructure/database/drizzle/schema/auth/mfa-recovery-codes.schema";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import type { TMfaEnrollType } from "@/modules/auth/mfa/application/constants/mfa";
import type {
  IMfaRepository,
  InsertMfaChallengeInput,
  InsertMfaFactorInput,
  MfaChallenge,
  MfaFactor,
  MfaRecoveryCode,
  UpdateMfaChallengeInput,
  UpdateMfaFactorInput,
} from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

const toFactor = (row: typeof mfaFactors.$inferSelect): MfaFactor | null => {
  if (row.type === "webauthn") {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    label: row.label,
    secretEncrypted: row.secretEncrypted,
    destination: row.destination,
    isVerified: row.isVerified,
    verifiedAt: row.verifiedAt,
    lastUsedAt: row.lastUsedAt,
    disabledAt: row.disabledAt,
  };
};

const toChallenge = (row: typeof mfaChallenges.$inferSelect): MfaChallenge => ({
  id: row.id,
  userId: row.userId,
  factorId: row.factorId,
  challengeHash: row.challengeHash,
  expiresAt: row.expiresAt,
  verifiedAt: row.verifiedAt,
  attemptCount: row.attemptCount,
});

export class PostgresMfaRepository implements IMfaRepository {
  public async findAuthUserById(userId: string): Promise<AuthUser | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return null;
    }

    const identities = await db
      .select({
        type: loginIdentities.type,
        identifier: loginIdentities.normalizedIdentifier,
        isPrimary: loginIdentities.isPrimary,
        verifiedAt: loginIdentities.verifiedAt,
      })
      .from(loginIdentities)
      .where(eq(loginIdentities.userId, user.id));

    const email =
      identities.find(
        (identity) => identity.type === "email" && identity.isPrimary && identity.verifiedAt,
      )?.identifier ??
      identities.find((identity) => identity.type === "email" && identity.verifiedAt)?.identifier ??
      null;

    const username =
      identities.find((identity) => identity.type === "username")?.identifier ?? null;

    return {
      id: user.id,
      status: user.status,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      email,
      username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public async hasVerifiedFactor(userId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: mfaFactors.id })
      .from(mfaFactors)
      .where(
        and(
          eq(mfaFactors.userId, userId),
          eq(mfaFactors.isVerified, true),
          isNull(mfaFactors.disabledAt),
        ),
      )
      .limit(1);

    return Boolean(row);
  }

  public async listVerifiedFactors(userId: string): Promise<MfaFactor[]> {
    const rows = await db
      .select()
      .from(mfaFactors)
      .where(
        and(
          eq(mfaFactors.userId, userId),
          eq(mfaFactors.isVerified, true),
          isNull(mfaFactors.disabledAt),
        ),
      );

    return rows.flatMap((row) => {
      const factor = toFactor(row);
      return factor ? [factor] : [];
    });
  }

  public async findFactorForUser(userId: string, factorId: string): Promise<MfaFactor | null> {
    const [row] = await db
      .select()
      .from(mfaFactors)
      .where(and(eq(mfaFactors.id, factorId), eq(mfaFactors.userId, userId)))
      .limit(1);

    return row ? toFactor(row) : null;
  }

  public async findFactorByType(
    userId: string,
    type: TMfaEnrollType,
    verified: boolean,
  ): Promise<MfaFactor | null> {
    const [row] = await db
      .select()
      .from(mfaFactors)
      .where(
        and(
          eq(mfaFactors.userId, userId),
          eq(mfaFactors.type, type),
          eq(mfaFactors.isVerified, verified),
          isNull(mfaFactors.disabledAt),
        ),
      )
      .limit(1);

    return row ? toFactor(row) : null;
  }

  public async insertFactor(input: InsertMfaFactorInput): Promise<MfaFactor> {
    const [row] = await db
      .insert(mfaFactors)
      .values({
        userId: input.userId,
        type: input.type,
        label: input.label,
        secretEncrypted: input.secretEncrypted,
        destination: input.destination,
      })
      .returning();

    const factor = row ? toFactor(row) : null;

    if (!factor) {
      throw new Error("Failed to insert MFA factor.");
    }

    return factor;
  }

  public async updateFactor(
    factorId: string,
    patch: UpdateMfaFactorInput,
  ): Promise<MfaFactor | null> {
    const [row] = await db
      .update(mfaFactors)
      .set({
        ...(patch.label !== undefined ? { label: patch.label } : {}),
        ...(patch.secretEncrypted !== undefined ? { secretEncrypted: patch.secretEncrypted } : {}),
        ...(patch.destination !== undefined ? { destination: patch.destination } : {}),
        ...(patch.isVerified !== undefined ? { isVerified: patch.isVerified } : {}),
        ...(patch.verifiedAt !== undefined ? { verifiedAt: patch.verifiedAt } : {}),
        ...(patch.lastUsedAt !== undefined ? { lastUsedAt: patch.lastUsedAt } : {}),
        updatedAt: new Date(),
      })
      .where(eq(mfaFactors.id, factorId))
      .returning();

    return row ? toFactor(row) : null;
  }

  public async markFactorVerified(factorId: string, verifiedAt: Date): Promise<MfaFactor | null> {
    const [row] = await db
      .update(mfaFactors)
      .set({
        isVerified: true,
        verifiedAt,
        updatedAt: verifiedAt,
      })
      .where(
        and(
          eq(mfaFactors.id, factorId),
          eq(mfaFactors.isVerified, false),
          isNull(mfaFactors.disabledAt),
        ),
      )
      .returning();

    return row ? toFactor(row) : null;
  }

  public async disableFactorsForUser(userId: string): Promise<number> {
    const now = new Date();
    const rows = await db
      .update(mfaFactors)
      .set({ disabledAt: now, updatedAt: now })
      .where(and(eq(mfaFactors.userId, userId), isNull(mfaFactors.disabledAt)))
      .returning({ id: mfaFactors.id });

    return rows.length;
  }

  public async insertChallenge(input: InsertMfaChallengeInput): Promise<MfaChallenge> {
    const [row] = await db
      .insert(mfaChallenges)
      .values({
        userId: input.userId,
        factorId: input.factorId ?? null,
        challengeHash: input.challengeHash ?? null,
        expiresAt: input.expiresAt,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to insert MFA challenge.");
    }

    return toChallenge(row);
  }

  public async findChallengeById(id: string): Promise<MfaChallenge | null> {
    const [row] = await db.select().from(mfaChallenges).where(eq(mfaChallenges.id, id)).limit(1);

    return row ? toChallenge(row) : null;
  }

  public async findLatestChallengeForFactor(factorId: string): Promise<MfaChallenge | null> {
    const [row] = await db
      .select()
      .from(mfaChallenges)
      .where(and(eq(mfaChallenges.factorId, factorId), isNull(mfaChallenges.verifiedAt)))
      .orderBy(desc(mfaChallenges.createdAt))
      .limit(1);

    return row ? toChallenge(row) : null;
  }

  public async findPendingLoginByTokenHash(tokenHash: string): Promise<MfaChallenge | null> {
    const [row] = await db
      .select()
      .from(mfaChallenges)
      .where(
        and(
          eq(mfaChallenges.challengeHash, tokenHash),
          isNull(mfaChallenges.factorId),
          isNull(mfaChallenges.verifiedAt),
          gt(mfaChallenges.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return row ? toChallenge(row) : null;
  }

  public async updateChallenge(
    challengeId: string,
    patch: UpdateMfaChallengeInput,
  ): Promise<MfaChallenge | null> {
    const [row] = await db
      .update(mfaChallenges)
      .set({
        ...(patch.factorId !== undefined ? { factorId: patch.factorId } : {}),
        ...(patch.challengeHash !== undefined ? { challengeHash: patch.challengeHash } : {}),
        ...(patch.verifiedAt !== undefined ? { verifiedAt: patch.verifiedAt } : {}),
        ...(patch.attemptCount !== undefined ? { attemptCount: patch.attemptCount } : {}),
      })
      .where(eq(mfaChallenges.id, challengeId))
      .returning();

    return row ? toChallenge(row) : null;
  }

  public async incrementChallengeAttempts(challengeId: string): Promise<MfaChallenge | null> {
    const [row] = await db
      .update(mfaChallenges)
      .set({
        attemptCount: sql`${mfaChallenges.attemptCount} + 1`,
      })
      .where(eq(mfaChallenges.id, challengeId))
      .returning();

    return row ? toChallenge(row) : null;
  }

  public async consumePendingLoginsForUser(userId: string): Promise<void> {
    const now = new Date();

    await db
      .update(mfaChallenges)
      .set({ verifiedAt: now })
      .where(
        and(
          eq(mfaChallenges.userId, userId),
          isNull(mfaChallenges.factorId),
          isNull(mfaChallenges.verifiedAt),
        ),
      );
  }

  public async replaceRecoveryCodes(userId: string, codeHashes: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      const now = new Date();

      await tx
        .update(mfaRecoveryCodes)
        .set({ revokedAt: now })
        .where(
          and(
            eq(mfaRecoveryCodes.userId, userId),
            isNull(mfaRecoveryCodes.usedAt),
            isNull(mfaRecoveryCodes.revokedAt),
          ),
        );

      if (codeHashes.length === 0) {
        return;
      }

      await tx.insert(mfaRecoveryCodes).values(
        codeHashes.map((codeHash) => ({
          userId,
          codeHash,
        })),
      );
    });
  }

  public async findUnusedRecoveryCodes(userId: string): Promise<MfaRecoveryCode[]> {
    const rows = await db
      .select({
        id: mfaRecoveryCodes.id,
        codeHash: mfaRecoveryCodes.codeHash,
      })
      .from(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.userId, userId),
          isNull(mfaRecoveryCodes.usedAt),
          isNull(mfaRecoveryCodes.revokedAt),
        ),
      );

    return rows;
  }

  public async markRecoveryCodeUsed(id: string): Promise<boolean> {
    const [row] = await db
      .update(mfaRecoveryCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(mfaRecoveryCodes.id, id),
          isNull(mfaRecoveryCodes.usedAt),
          isNull(mfaRecoveryCodes.revokedAt),
        ),
      )
      .returning({ id: mfaRecoveryCodes.id });

    return Boolean(row);
  }

  public async revokeUnusedRecoveryCodes(userId: string): Promise<void> {
    await db
      .update(mfaRecoveryCodes)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(mfaRecoveryCodes.userId, userId),
          isNull(mfaRecoveryCodes.usedAt),
          isNull(mfaRecoveryCodes.revokedAt),
        ),
      );
  }
}
