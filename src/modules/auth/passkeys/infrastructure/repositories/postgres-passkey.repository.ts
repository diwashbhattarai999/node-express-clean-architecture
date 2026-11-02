import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { isUniqueViolation } from "@/infrastructure/database/drizzle/errors";
import { externalIdentities } from "@/infrastructure/database/drizzle/schema/auth/external-identities.schema";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { passkeyChallenges } from "@/infrastructure/database/drizzle/schema/auth/passkey-challenges.schema";
import { passkeys } from "@/infrastructure/database/drizzle/schema/auth/passkeys.schema";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import type { TPasskeyChallengeType } from "@/modules/auth/passkeys/application/constants/passkeys";
import type {
  InsertPasskeyChallengeInput,
  InsertPasskeyInput,
  IPasskeyRepository,
  Passkey,
  PasskeyChallenge,
} from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
import { ConflictError } from "@/shared/errors/conflict-error";

const toPasskey = (row: typeof passkeys.$inferSelect): Passkey => ({
  id: row.id,
  userId: row.userId,
  credentialId: row.credentialId,
  publicKey: row.publicKey,
  signCount: row.signCount,
  transports: row.transports,
  aaguid: row.aaguid,
  backedUp: row.backedUp,
  name: row.name,
  createdAt: row.createdAt,
  lastUsedAt: row.lastUsedAt,
  revokedAt: row.revokedAt,
});

const toChallenge = (row: typeof passkeyChallenges.$inferSelect): PasskeyChallenge => ({
  id: row.id,
  userId: row.userId,
  type: row.type === "login" ? "login" : "register",
  challenge: row.challenge,
  expiresAt: row.expiresAt,
  consumedAt: row.consumedAt,
});

export class PostgresPasskeyRepository implements IPasskeyRepository {
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

  public async listPasskeysForUser(userId: string): Promise<Passkey[]> {
    const rows = await db
      .select()
      .from(passkeys)
      .where(and(eq(passkeys.userId, userId), isNull(passkeys.revokedAt)))
      .orderBy(desc(passkeys.createdAt));

    return rows.map(toPasskey);
  }

  public async findPasskeyForUser(userId: string, passkeyId: string): Promise<Passkey | null> {
    const [row] = await db
      .select()
      .from(passkeys)
      .where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId)))
      .limit(1);

    return row ? toPasskey(row) : null;
  }

  public async findPasskeyByCredentialId(credentialId: string): Promise<Passkey | null> {
    const [row] = await db
      .select()
      .from(passkeys)
      .where(and(eq(passkeys.credentialId, credentialId), isNull(passkeys.revokedAt)))
      .limit(1);

    return row ? toPasskey(row) : null;
  }

  public async insertPasskey(input: InsertPasskeyInput): Promise<Passkey> {
    try {
      const [row] = await db
        .insert(passkeys)
        .values({
          userId: input.userId,
          credentialId: input.credentialId,
          publicKey: input.publicKey,
          signCount: input.signCount,
          transports: input.transports,
          aaguid: input.aaguid,
          backedUp: input.backedUp,
          name: input.name,
        })
        .returning();

      if (!row) {
        throw new Error("Failed to insert passkey.");
      }

      return toPasskey(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("This passkey is already registered.");
      }

      throw error;
    }
  }

  public async updatePasskeyName(
    userId: string,
    passkeyId: string,
    name: string,
  ): Promise<Passkey | null> {
    const [row] = await db
      .update(passkeys)
      .set({ name })
      .where(
        and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId), isNull(passkeys.revokedAt)),
      )
      .returning();

    return row ? toPasskey(row) : null;
  }

  public async markPasskeyUsed(passkeyId: string, signCount: number, usedAt: Date): Promise<void> {
    await db
      .update(passkeys)
      .set({ signCount, lastUsedAt: usedAt })
      .where(eq(passkeys.id, passkeyId));
  }

  public async revokePasskey(userId: string, passkeyId: string): Promise<Passkey | null> {
    const now = new Date();
    const [row] = await db
      .update(passkeys)
      .set({ revokedAt: now })
      .where(
        and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId), isNull(passkeys.revokedAt)),
      )
      .returning();

    return row ? toPasskey(row) : null;
  }

  public async countViableAuthMethods(
    userId: string,
    excludingPasskeyId?: string,
  ): Promise<number> {
    const passkeyFilter = excludingPasskeyId
      ? and(
          eq(passkeys.userId, userId),
          isNull(passkeys.revokedAt),
          ne(passkeys.id, excludingPasskeyId),
        )
      : and(eq(passkeys.userId, userId), isNull(passkeys.revokedAt));

    const [passkeyCount] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(passkeys)
      .where(passkeyFilter);

    const [identityCount] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(loginIdentities)
      .where(eq(loginIdentities.userId, userId));

    const [oauthCount] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(externalIdentities)
      .where(eq(externalIdentities.userId, userId));

    return (passkeyCount?.value ?? 0) + (identityCount?.value ?? 0) + (oauthCount?.value ?? 0);
  }

  public async insertChallenge(input: InsertPasskeyChallengeInput): Promise<PasskeyChallenge> {
    const [row] = await db
      .insert(passkeyChallenges)
      .values({
        userId: input.userId ?? null,
        type: input.type,
        challenge: input.challenge,
        expiresAt: input.expiresAt,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to insert passkey challenge.");
    }

    return toChallenge(row);
  }

  public async consumeOpenChallenges(userId: string, type: TPasskeyChallengeType): Promise<void> {
    const now = new Date();

    await db
      .update(passkeyChallenges)
      .set({ consumedAt: now })
      .where(
        and(
          eq(passkeyChallenges.userId, userId),
          eq(passkeyChallenges.type, type),
          isNull(passkeyChallenges.consumedAt),
        ),
      );
  }

  public async findUsableChallenge(
    challenge: string,
    type: TPasskeyChallengeType,
  ): Promise<PasskeyChallenge | null> {
    const [row] = await db
      .select()
      .from(passkeyChallenges)
      .where(
        and(
          eq(passkeyChallenges.challenge, challenge),
          eq(passkeyChallenges.type, type),
          isNull(passkeyChallenges.consumedAt),
        ),
      )
      .limit(1);

    return row ? toChallenge(row) : null;
  }

  public async consumeChallenge(id: string): Promise<boolean> {
    const [row] = await db
      .update(passkeyChallenges)
      .set({ consumedAt: new Date() })
      .where(and(eq(passkeyChallenges.id, id), isNull(passkeyChallenges.consumedAt)))
      .returning({ id: passkeyChallenges.id });

    return Boolean(row);
  }
}
