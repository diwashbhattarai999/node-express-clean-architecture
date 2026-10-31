import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { isUniqueViolation } from "@/infrastructure/database/drizzle/errors";
import { externalIdentities } from "@/infrastructure/database/drizzle/schema/auth/external-identities.schema";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import type { TOauthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { OAuthIdentityLinkedError } from "@/modules/auth/oauth/application/errors/oauth-identity-linked.error";
import type {
  CreateOAuthAccountInput,
  IOauthAccountRepository,
  OAuthLinkedAccount,
} from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

type UserRow = typeof users.$inferSelect;

type IdentityRow = {
  type: "email" | "phone" | "username";
  identifier: string;
  isPrimary: boolean;
  verifiedAt: Date | null;
};

const uniqueConstraintName = (error: unknown): string | undefined => {
  let current: unknown = error;

  for (let depth = 0; depth < 4 && current !== undefined && current !== null; depth += 1) {
    if (typeof current === "object" && "constraint" in current) {
      const constraint = current.constraint;

      if (typeof constraint === "string") {
        return constraint;
      }
    }

    if (typeof current === "object" && "cause" in current) {
      current = current.cause;
      continue;
    }

    break;
  }

  return undefined;
};

const toAuthUser = (user: UserRow, identities: IdentityRow[]): AuthUser => {
  const primaryVerifiedEmail =
    identities.find((row) => row.type === "email" && row.isPrimary && row.verifiedAt !== null)
      ?.identifier ??
    identities.find((row) => row.type === "email" && row.verifiedAt !== null)?.identifier ??
    null;

  const username = identities.find((row) => row.type === "username")?.identifier ?? null;

  return {
    id: user.id,
    status: user.status,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    email: primaryVerifiedEmail,
    username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export class PostgresOAuthAccountRepository implements IOauthAccountRepository {
  public async findByProviderUser(
    provider: TOauthProviderName,
    providerUserId: string,
  ): Promise<OAuthLinkedAccount | null> {
    const [row] = await db
      .select({
        externalIdentityId: externalIdentities.id,
        user: users,
      })
      .from(externalIdentities)
      .innerJoin(users, eq(users.id, externalIdentities.userId))
      .where(
        and(
          eq(externalIdentities.provider, provider),
          eq(externalIdentities.providerUserId, providerUserId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const identities = await this.listIdentities(row.user.id);

    return {
      externalIdentityId: row.externalIdentityId,
      user: toAuthUser(row.user, identities),
    };
  }

  public async findEmailOwner(normalizedEmail: string): Promise<{ userId: string } | null> {
    const [row] = await db
      .select({ userId: loginIdentities.userId })
      .from(loginIdentities)
      .where(
        and(
          eq(loginIdentities.type, "email"),
          eq(loginIdentities.normalizedIdentifier, normalizedEmail),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  public async createAccount(input: CreateOAuthAccountInput): Promise<AuthUser> {
    try {
      return await this.insertAccount(input, input.email !== undefined);
    } catch (error) {
      if (isUniqueViolation(error)) {
        const constraint = uniqueConstraintName(error);

        if (constraint === "external_identities_provider_user_unique_idx") {
          throw new OAuthIdentityLinkedError();
        }

        if (constraint === "login_identities_type_normalized_unique_idx" && input.email) {
          return this.insertAccount(input, false);
        }

        throw new OAuthIdentityLinkedError();
      }

      throw error;
    }
  }

  public async recordSuccessfulLogin(externalIdentityId: string): Promise<AuthUser> {
    const now = new Date();

    return db.transaction(async (tx) => {
      const [identity] = await tx
        .update(externalIdentities)
        .set({ lastUsedAt: now })
        .where(eq(externalIdentities.id, externalIdentityId))
        .returning({ userId: externalIdentities.userId });

      if (!identity) {
        throw new OAuthIdentityLinkedError();
      }

      const [pending] = await tx
        .update(users)
        .set({
          status: "active",
          activatedAt: now,
        })
        .where(and(eq(users.id, identity.userId), eq(users.status, "pending_verification")))
        .returning();

      const [user] = pending
        ? [pending]
        : await tx.select().from(users).where(eq(users.id, identity.userId)).limit(1);

      if (!user) {
        throw new OAuthIdentityLinkedError();
      }

      const identities = await tx
        .select({
          type: loginIdentities.type,
          identifier: loginIdentities.normalizedIdentifier,
          isPrimary: loginIdentities.isPrimary,
          verifiedAt: loginIdentities.verifiedAt,
        })
        .from(loginIdentities)
        .where(eq(loginIdentities.userId, user.id));

      return toAuthUser(user, identities);
    });
  }

  private async insertAccount(
    input: CreateOAuthAccountInput,
    attachEmail: boolean,
  ): Promise<AuthUser> {
    const now = new Date();

    return db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          id: input.id,
          status: "active",
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          activatedAt: now,
        })
        .returning();

      if (!createdUser) {
        throw new Error("Failed to create OAuth user account.");
      }

      const identities: IdentityRow[] = [];

      if (attachEmail && input.email) {
        await tx.insert(loginIdentities).values({
          userId: createdUser.id,
          type: "email",
          identifier: input.email.identifier,
          normalizedIdentifier: input.email.normalizedIdentifier,
          isPrimary: true,
          verifiedAt: input.email.verifiedAt,
        });

        identities.push({
          type: "email",
          identifier: input.email.normalizedIdentifier,
          isPrimary: true,
          verifiedAt: input.email.verifiedAt,
        });
      }

      await tx.insert(externalIdentities).values({
        userId: createdUser.id,
        provider: input.externalIdentity.provider,
        providerUserId: input.externalIdentity.providerUserId,
        providerEmailVerified: input.externalIdentity.providerEmailVerified,
        lastUsedAt: now,
        ...(input.externalIdentity.issuer !== undefined
          ? { issuer: input.externalIdentity.issuer }
          : {}),
        ...(input.externalIdentity.providerEmail !== undefined
          ? { providerEmail: input.externalIdentity.providerEmail }
          : {}),
      });

      return toAuthUser(createdUser, identities);
    });
  }

  private async listIdentities(userId: string): Promise<IdentityRow[]> {
    return db
      .select({
        type: loginIdentities.type,
        identifier: loginIdentities.normalizedIdentifier,
        isPrimary: loginIdentities.isPrimary,
        verifiedAt: loginIdentities.verifiedAt,
      })
      .from(loginIdentities)
      .where(eq(loginIdentities.userId, userId));
  }
}
