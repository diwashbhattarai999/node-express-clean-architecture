import { and, eq, isNull } from "drizzle-orm";

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
  FindAuthenticatedPrincipalResult,
  FindOwnProfileResult,
  IIdentityRepository,
  RegisterAccountInput,
  UpsertUsernameInput,
} from "@/modules/auth/identity/application/ports/identity.repository";
import {
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
