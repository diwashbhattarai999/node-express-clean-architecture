import { db } from "@/infrastructure/database/drizzle";
import { oauthAuthorizationStates } from "@/infrastructure/database/drizzle/schema/auth/oauth-authorization-states.schema";
import type {
  IOauthAuthorizationStateRepository,
  SaveOAuthAuthorizationStateInput,
} from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";

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
}
