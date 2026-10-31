import { and, asc, desc, eq, isNull, ne } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { isUniqueViolation } from "@/infrastructure/database/drizzle/errors";
import { authTokens } from "@/infrastructure/database/drizzle/schema/auth/auth-tokens.schema";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { passwordCredentials } from "@/infrastructure/database/drizzle/schema/auth/password-credentials.schema";
import { sessions } from "@/infrastructure/database/drizzle/schema/auth/sessions.schema";
import { roles } from "@/infrastructure/database/drizzle/schema/authorization/roles.schema";
import { userRoles } from "@/infrastructure/database/drizzle/schema/authorization/user-roles.schema";
import { userProfiles } from "@/infrastructure/database/drizzle/schema/user-profiles.schema";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import { IdentityAlreadyExistsError } from "@/modules/auth/identity/application/errors/identity-already-exists.error";
import type {
  AddEmailIdentityInput,
  FindAuthenticatedPrincipalResult,
  FindOwnProfileResult,
  IIdentityRepository,
  RegisterAccountInput,
  RemoveEmailIdentityInput,
  RemoveEmailIdentityResult,
  UpdateOwnProfileInput,
  UpdateOwnProfileResult,
  UpsertUsernameInput,
  VerifyAddedEmailByTokenHashResult,
} from "@/modules/auth/identity/application/ports/identity.repository";
import {
  type AuthLoginIdentity,
  type AuthUser,
  EMPTY_AUTH_USER_PROFILE,
  type TLoginIdentityType,
} from "@/modules/auth/shared/application/types/auth.types";

export class PostgresIdentityRepository implements IIdentityRepository {
  public async findIdentityByNormalized(
    type: TLoginIdentityType,
    normalizedIdentifier: string,
  ): Promise<{ userId: string } | null> {
    const [row] = await db
      .select({ userId: loginIdentities.userId })
      .from(loginIdentities)
      .where(
        and(
          eq(loginIdentities.type, type),
          eq(loginIdentities.normalizedIdentifier, normalizedIdentifier),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  public async register(input: RegisterAccountInput): Promise<AuthUser> {
    try {
      return await db.transaction(async (tx) => {
        const [createdUser] = await tx
          .insert(users)
          .values({
            id: input.id,
            displayName: input.displayName,
            status: "pending_verification",
          })
          .returning();

        if (!createdUser) {
          throw new Error("Failed to create user account.");
        }

        let emailIdentityId: string | undefined;
        let phoneIdentityId: string | undefined;
        let primaryEmail: string | null = null;

        if (input.email) {
          const [emailIdentity] = await tx
            .insert(loginIdentities)
            .values({
              userId: createdUser.id,
              type: "email",
              identifier: input.email.identifier,
              normalizedIdentifier: input.email.normalizedIdentifier,
              isPrimary: true,
              verifiedAt: null,
            })
            .returning({ id: loginIdentities.id });

          emailIdentityId = emailIdentity?.id;
          primaryEmail = input.email.normalizedIdentifier;
        }

        if (input.phone) {
          const [phoneIdentity] = await tx
            .insert(loginIdentities)
            .values({
              userId: createdUser.id,
              type: "phone",
              identifier: input.phone.identifier,
              normalizedIdentifier: input.phone.normalizedIdentifier,
              isPrimary: true,
              verifiedAt: null,
            })
            .returning({ id: loginIdentities.id });

          phoneIdentityId = phoneIdentity?.id;
        }

        await tx.insert(passwordCredentials).values({
          userId: createdUser.id,
          passwordHash: input.passwordHash,
        });

        const identityIdForToken =
          input.verificationToken.purpose === "email_verification"
            ? (emailIdentityId ?? null)
            : (phoneIdentityId ?? null);

        await tx.insert(authTokens).values({
          userId: createdUser.id,
          identityId: identityIdForToken,
          type: input.verificationToken.purpose,
          tokenHash: input.verificationToken.tokenHash,
          expiresAt: input.verificationToken.expiresAt,
        });

        return {
          id: createdUser.id,
          status: "pending_verification",
          displayName: createdUser.displayName,
          avatarUrl: createdUser.avatarUrl,
          email: primaryEmail,
          username: null,
          createdAt: createdUser.createdAt,
          updatedAt: createdUser.updatedAt,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new IdentityAlreadyExistsError();
      }

      throw error;
    }
  }

  public async findAuthenticatedPrincipal(
    userId: string,
    sessionId: string,
  ): Promise<FindAuthenticatedPrincipalResult> {
    const [session] = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        revokedAt: sessions.revokedAt,
      })
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .limit(1);

    if (!session) {
      return { outcome: "invalid_session" };
    }

    if (session.revokedAt) {
      return { outcome: "revoked_session" };
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return { outcome: "expired_session" };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return { outcome: "user_not_found" };
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

    const primaryEmail =
      identities.find(
        (identity) =>
          identity.type === "email" && identity.isPrimary && identity.verifiedAt !== null,
      )?.identifier ??
      identities.find((identity) => identity.type === "email" && identity.verifiedAt !== null)
        ?.identifier ??
      null;

    const username =
      identities.find((identity) => identity.type === "username")?.identifier ?? null;

    const roleRows = await db
      .select({ key: roles.key })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, user.id));

    return {
      outcome: "ok",
      roles: roleRows.map((row) => row.key),
      user: {
        id: user.id,
        status: user.status,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        email: primaryEmail,
        username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  public async findOwnProfile(userId: string, sessionId: string): Promise<FindOwnProfileResult> {
    const principal = await this.findAuthenticatedPrincipal(userId, sessionId);

    if (principal.outcome !== "ok") {
      return principal;
    }

    const [profile] = await db
      .select({
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        locale: userProfiles.locale,
        timezone: userProfiles.timezone,
        bio: userProfiles.bio,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, principal.user.id))
      .limit(1);

    return {
      outcome: "ok",
      user: principal.user,
      profile: profile
        ? {
            firstName: profile.firstName ?? null,
            lastName: profile.lastName ?? null,
            locale: profile.locale ?? null,
            timezone: profile.timezone ?? null,
            bio: profile.bio ?? null,
          }
        : EMPTY_AUTH_USER_PROFILE,
    };
  }

  public async updateOwnProfile(input: UpdateOwnProfileInput): Promise<UpdateOwnProfileResult> {
    return db.transaction(async (tx) => {
      const now = new Date();
      const userPatch: {
        displayName?: string | null;
        avatarUrl?: string | null;
        updatedAt: Date;
      } = { updatedAt: now };

      if (input.displayName !== undefined) {
        userPatch.displayName = input.displayName;
      }

      if (input.avatarUrl !== undefined) {
        userPatch.avatarUrl = input.avatarUrl;
      }

      if (input.displayName !== undefined || input.avatarUrl !== undefined) {
        await tx.update(users).set(userPatch).where(eq(users.id, input.userId));
      }

      const profilePatch: {
        firstName?: string | null;
        lastName?: string | null;
        locale?: string | null;
        timezone?: string | null;
        bio?: string | null;
      } = {};

      if (input.firstName !== undefined) {
        profilePatch.firstName = input.firstName;
      }

      if (input.lastName !== undefined) {
        profilePatch.lastName = input.lastName;
      }

      if (input.locale !== undefined) {
        profilePatch.locale = input.locale;
      }

      if (input.timezone !== undefined) {
        profilePatch.timezone = input.timezone;
      }

      if (input.bio !== undefined) {
        profilePatch.bio = input.bio;
      }

      if (Object.keys(profilePatch).length > 0) {
        await tx
          .insert(userProfiles)
          .values({
            userId: input.userId,
            ...profilePatch,
          })
          .onConflictDoUpdate({
            target: userProfiles.userId,
            set: {
              ...profilePatch,
              updatedAt: now,
            },
          });
      }

      const [user] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, input.userId), isNull(users.deletedAt)))
        .limit(1);

      if (!user) {
        throw new Error("User not found.");
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

      const primaryEmail =
        identities.find(
          (identity) =>
            identity.type === "email" && identity.isPrimary && identity.verifiedAt !== null,
        )?.identifier ??
        identities.find((identity) => identity.type === "email" && identity.verifiedAt !== null)
          ?.identifier ??
        null;

      const username =
        identities.find((identity) => identity.type === "username")?.identifier ?? null;

      const [profile] = await tx
        .select({
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          locale: userProfiles.locale,
          timezone: userProfiles.timezone,
          bio: userProfiles.bio,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id))
        .limit(1);

      return {
        user: {
          id: user.id,
          status: user.status,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          email: primaryEmail,
          username,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        profile: profile
          ? {
              firstName: profile.firstName ?? null,
              lastName: profile.lastName ?? null,
              locale: profile.locale ?? null,
              timezone: profile.timezone ?? null,
              bio: profile.bio ?? null,
            }
          : EMPTY_AUTH_USER_PROFILE,
      };
    });
  }

  public async listIdentitiesForUser(userId: string): Promise<AuthLoginIdentity[]> {
    const rows = await db
      .select({
        id: loginIdentities.id,
        type: loginIdentities.type,
        identifier: loginIdentities.identifier,
        verifiedAt: loginIdentities.verifiedAt,
        isPrimary: loginIdentities.isPrimary,
        createdAt: loginIdentities.createdAt,
      })
      .from(loginIdentities)
      .where(eq(loginIdentities.userId, userId))
      .orderBy(desc(loginIdentities.isPrimary), asc(loginIdentities.createdAt));

    return rows;
  }

  public async addEmailIdentity(input: AddEmailIdentityInput): Promise<AuthLoginIdentity> {
    try {
      return await db.transaction(async (tx) => {
        const [primaryEmail] = await tx
          .select({ id: loginIdentities.id })
          .from(loginIdentities)
          .where(
            and(
              eq(loginIdentities.userId, input.userId),
              eq(loginIdentities.type, "email"),
              eq(loginIdentities.isPrimary, true),
            ),
          )
          .limit(1);

        const [created] = await tx
          .insert(loginIdentities)
          .values({
            userId: input.userId,
            type: "email",
            identifier: input.identifier,
            normalizedIdentifier: input.normalizedIdentifier,
            isPrimary: !primaryEmail,
            verifiedAt: null,
          })
          .returning();

        if (!created) {
          throw new Error("Failed to add email identity.");
        }

        await tx.insert(authTokens).values({
          userId: input.userId,
          identityId: created.id,
          type: "email_verification",
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        });

        return {
          id: created.id,
          type: created.type,
          identifier: created.identifier,
          verifiedAt: created.verifiedAt,
          isPrimary: created.isPrimary,
          createdAt: created.createdAt,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new IdentityAlreadyExistsError();
      }

      throw error;
    }
  }

  public async verifyAddedEmailByTokenHash(
    tokenHash: string,
  ): Promise<VerifyAddedEmailByTokenHashResult> {
    const [token] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.type, "email_verification"),
          isNull(authTokens.consumedAt),
          isNull(authTokens.revokedAt),
        ),
      )
      .limit(1);

    if (!token?.identityId) {
      return { outcome: "invalid" };
    }

    if (token.expiresAt.getTime() <= Date.now()) {
      return { outcome: "expired" };
    }

    const identityId = token.identityId;

    return db.transaction(async (tx) => {
      const now = new Date();

      const [consumed] = await tx
        .update(authTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(authTokens.id, token.id),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
          ),
        )
        .returning({ id: authTokens.id });

      if (!consumed) {
        return { outcome: "invalid" as const };
      }

      await tx
        .update(authTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authTokens.identityId, identityId),
            eq(authTokens.type, "email_verification"),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
            ne(authTokens.id, token.id),
          ),
        );

      const [identity] = await tx
        .update(loginIdentities)
        .set({ verifiedAt: now, updatedAt: now })
        .where(and(eq(loginIdentities.id, identityId), eq(loginIdentities.type, "email")))
        .returning();

      if (!identity) {
        return { outcome: "invalid" as const };
      }

      const [user] = await tx
        .select({ id: users.id, deletedAt: users.deletedAt })
        .from(users)
        .where(eq(users.id, token.userId))
        .limit(1);

      if (!user || user.deletedAt) {
        return { outcome: "invalid" as const };
      }

      return {
        outcome: "verified" as const,
        userId: token.userId,
        identity: {
          id: identity.id,
          type: identity.type,
          identifier: identity.identifier,
          verifiedAt: identity.verifiedAt,
          isPrimary: identity.isPrimary,
          createdAt: identity.createdAt,
        },
      };
    });
  }

  public async removeEmailIdentity(
    input: RemoveEmailIdentityInput,
  ): Promise<RemoveEmailIdentityResult> {
    return db.transaction(async (tx) => {
      const [identity] = await tx
        .select({
          id: loginIdentities.id,
          isPrimary: loginIdentities.isPrimary,
        })
        .from(loginIdentities)
        .where(
          and(
            eq(loginIdentities.id, input.identityId),
            eq(loginIdentities.userId, input.userId),
            eq(loginIdentities.type, "email"),
          ),
        )
        .limit(1);

      if (!identity) {
        return { outcome: "not_found" as const };
      }

      const [other] = await tx
        .select({ id: loginIdentities.id })
        .from(loginIdentities)
        .where(and(eq(loginIdentities.userId, input.userId), ne(loginIdentities.id, identity.id)))
        .limit(1);

      if (!other) {
        return { outcome: "last_auth_method" as const };
      }

      const now = new Date();

      await tx
        .update(authTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authTokens.identityId, identity.id),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
          ),
        );

      await tx.delete(loginIdentities).where(eq(loginIdentities.id, identity.id));

      if (identity.isPrimary) {
        const [nextEmail] = await tx
          .select({ id: loginIdentities.id })
          .from(loginIdentities)
          .where(and(eq(loginIdentities.userId, input.userId), eq(loginIdentities.type, "email")))
          .orderBy(asc(loginIdentities.createdAt))
          .limit(1);

        if (nextEmail) {
          await tx
            .update(loginIdentities)
            .set({ isPrimary: true, updatedAt: now })
            .where(eq(loginIdentities.id, nextEmail.id));
        }
      }

      return { outcome: "removed" as const };
    });
  }

  public async upsertUsername(input: UpsertUsernameInput): Promise<AuthUser> {
    try {
      return await db.transaction(async (tx) => {
        const [user] = await tx
          .select()
          .from(users)
          .where(and(eq(users.id, input.userId), isNull(users.deletedAt)))
          .limit(1);

        if (!user) {
          throw new Error("User not found.");
        }

        const [existingUsername] = await tx
          .select({ id: loginIdentities.id })
          .from(loginIdentities)
          .where(and(eq(loginIdentities.userId, user.id), eq(loginIdentities.type, "username")))
          .limit(1);

        const now = new Date();

        if (existingUsername) {
          await tx
            .update(loginIdentities)
            .set({
              identifier: input.identifier,
              normalizedIdentifier: input.normalizedIdentifier,
              verifiedAt: now,
              updatedAt: now,
            })
            .where(eq(loginIdentities.id, existingUsername.id));
        } else {
          await tx.insert(loginIdentities).values({
            userId: user.id,
            type: "username",
            identifier: input.identifier,
            normalizedIdentifier: input.normalizedIdentifier,
            isPrimary: true,
            verifiedAt: now,
          });
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

        const primaryEmail =
          identities.find(
            (identity) =>
              identity.type === "email" && identity.isPrimary && identity.verifiedAt !== null,
          )?.identifier ??
          identities.find((identity) => identity.type === "email" && identity.verifiedAt !== null)
            ?.identifier ??
          null;

        const username =
          identities.find((identity) => identity.type === "username")?.identifier ?? null;

        return {
          id: user.id,
          status: user.status,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          email: primaryEmail,
          username,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new IdentityAlreadyExistsError();
      }

      throw error;
    }
  }
}
