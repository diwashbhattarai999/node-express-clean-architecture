import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { stepUpChallenges } from "@/infrastructure/database/drizzle/schema/auth/step-up-challenges.schema";
import type { TStepUpMethod } from "@/modules/auth/step-up/application/constants/step-up";
import type {
  InsertStepUpChallengeInput,
  IStepUpRepository,
  StepUpChallenge,
} from "@/modules/auth/step-up/application/ports/step-up.repository";

const toMethod = (value: string): TStepUpMethod => {
  if (value === "password" || value === "mfa" || value === "passkey") {
    return value;
  }

  return "password";
};

const toChallenge = (row: typeof stepUpChallenges.$inferSelect): StepUpChallenge => ({
  id: row.id,
  userId: row.userId,
  sessionId: row.sessionId,
  method: toMethod(row.method),
  mfaChallengeId: row.mfaChallengeId,
  webauthnChallenge: row.webauthnChallenge,
  expiresAt: row.expiresAt,
  verifiedAt: row.verifiedAt,
});

export class PostgresStepUpRepository implements IStepUpRepository {
  public async insertChallenge(input: InsertStepUpChallengeInput): Promise<StepUpChallenge> {
    const [row] = await db
      .insert(stepUpChallenges)
      .values({
        userId: input.userId,
        sessionId: input.sessionId,
        method: input.method,
        mfaChallengeId: input.mfaChallengeId ?? null,
        webauthnChallenge: input.webauthnChallenge ?? null,
        expiresAt: input.expiresAt,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to insert step-up challenge.");
    }

    return toChallenge(row);
  }

  public async findChallengeById(id: string): Promise<StepUpChallenge | null> {
    const [row] = await db
      .select()
      .from(stepUpChallenges)
      .where(eq(stepUpChallenges.id, id))
      .limit(1);

    return row ? toChallenge(row) : null;
  }

  public async markChallengeVerified(id: string, verifiedAt: Date): Promise<boolean> {
    const [row] = await db
      .update(stepUpChallenges)
      .set({ verifiedAt })
      .where(and(eq(stepUpChallenges.id, id), isNull(stepUpChallenges.verifiedAt)))
      .returning({ id: stepUpChallenges.id });

    return Boolean(row);
  }

  public async consumeOpenChallenges(userId: string, sessionId: string): Promise<void> {
    const now = new Date();

    await db
      .update(stepUpChallenges)
      .set({ verifiedAt: now })
      .where(
        and(
          eq(stepUpChallenges.userId, userId),
          eq(stepUpChallenges.sessionId, sessionId),
          isNull(stepUpChallenges.verifiedAt),
        ),
      );
  }
}
