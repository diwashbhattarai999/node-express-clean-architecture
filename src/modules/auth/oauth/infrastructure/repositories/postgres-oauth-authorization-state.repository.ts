import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { oauthAuthorizationStates } from "@/infrastructure/database/drizzle/schema/auth/oauth-authorization-states.schema";
import {
  OAuthIntent,
  type TOauthIntent,
} from "@/modules/auth/oauth/application/constants/oauth-providers";
import type {
  ConsumedOAuthAuthorizationState,
  ConsumeOAuthAuthorizationStateForExchangeInput,
  ConsumeOAuthAuthorizationStateInput,
  IOauthAuthorizationStateRepository,
  SaveOAuthAuthorizationStateInput,
} from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";

const isOauthIntent = (value: string): value is TOauthIntent =>
  value === OAuthIntent.LOGIN || value === OAuthIntent.LINK;

type StateRow = {
  provider: string;
  intent: string;
  redirectUri: string;
  clientState: string;
  userId: string | null;
};

const toConsumed = (
  provider: ConsumeOAuthAuthorizationStateInput["provider"],
  row: StateRow,
): ConsumedOAuthAuthorizationState | null => {
  if (!isOauthIntent(row.intent)) {
    return null;
  }

  return {
    provider,
    intent: row.intent,
    redirectUri: row.redirectUri,
    clientState: row.clientState,
    userId: row.userId,
  };
};

const selectedStateColumns = {
  provider: oauthAuthorizationStates.provider,
  intent: oauthAuthorizationStates.intent,
  redirectUri: oauthAuthorizationStates.redirectUri,
  clientState: oauthAuthorizationStates.clientState,
  userId: oauthAuthorizationStates.userId,
};

export class PostgresOAuthAuthorizationStateRepository
  implements IOauthAuthorizationStateRepository
{
  public async save(input: SaveOAuthAuthorizationStateInput): Promise<void> {
    await db.insert(oauthAuthorizationStates).values({
      stateHash: input.stateHash,
      provider: input.provider,
      intent: input.intent,
      redirectUri: input.redirectUri,
      clientState: input.clientState,
      expiresAt: input.expiresAt,
      ...(input.codeChallenge !== undefined ? { codeChallenge: input.codeChallenge } : {}),
      ...(input.codeChallengeMethod !== undefined
        ? { codeChallengeMethod: input.codeChallengeMethod }
        : {}),
    });
  }

  public async findActive(
    input: ConsumeOAuthAuthorizationStateInput,
  ): Promise<ConsumedOAuthAuthorizationState | null> {
    const now = new Date();
    const [row] = await db
      .select(selectedStateColumns)
      .from(oauthAuthorizationStates)
      .where(
        and(
          eq(oauthAuthorizationStates.stateHash, input.stateHash),
          eq(oauthAuthorizationStates.provider, input.provider),
          isNull(oauthAuthorizationStates.consumedAt),
          gt(oauthAuthorizationStates.expiresAt, now),
        ),
      )
      .limit(1);

    return row ? toConsumed(input.provider, row) : null;
  }

  public async consume(
    input: ConsumeOAuthAuthorizationStateInput,
  ): Promise<ConsumedOAuthAuthorizationState | null> {
    const now = new Date();
    const [row] = await db
      .update(oauthAuthorizationStates)
      .set({ consumedAt: now })
      .where(
        and(
          eq(oauthAuthorizationStates.stateHash, input.stateHash),
          eq(oauthAuthorizationStates.provider, input.provider),
          isNull(oauthAuthorizationStates.consumedAt),
          gt(oauthAuthorizationStates.expiresAt, now),
        ),
      )
      .returning(selectedStateColumns);

    return row ? toConsumed(input.provider, row) : null;
  }

  public async consumeForExchange(
    input: ConsumeOAuthAuthorizationStateForExchangeInput,
  ): Promise<ConsumedOAuthAuthorizationState | null> {
    const now = new Date();

    return db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          id: oauthAuthorizationStates.id,
          ...selectedStateColumns,
        })
        .from(oauthAuthorizationStates)
        .where(
          and(
            eq(oauthAuthorizationStates.provider, input.provider),
            eq(oauthAuthorizationStates.clientState, input.clientState),
            eq(oauthAuthorizationStates.redirectUri, input.redirectUri),
            isNull(oauthAuthorizationStates.consumedAt),
            gt(oauthAuthorizationStates.expiresAt, now),
          ),
        )
        .orderBy(desc(oauthAuthorizationStates.createdAt))
        .limit(1)
        .for("update");

      if (!row) {
        return null;
      }

      await tx
        .update(oauthAuthorizationStates)
        .set({ consumedAt: now })
        .where(eq(oauthAuthorizationStates.id, row.id));

      return toConsumed(input.provider, row);
    });
  }
}
