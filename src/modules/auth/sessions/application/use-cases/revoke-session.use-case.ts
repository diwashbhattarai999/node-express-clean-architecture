import { SessionNotFoundError } from "@/modules/auth/sessions/application/errors/session-not-found.error";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";

export type RevokeSessionInput = {
  userId: string;
  sessionId: string;
};

export type RevokeSessionResult = {
  /** True when the revoked session is (or was) the caller's current session. */
  wasCurrent: boolean;
};

export class RevokeSessionUseCase {
  public constructor(private readonly sessionRepository: ISessionRepository) {}

  public async execute(
    input: RevokeSessionInput & { currentSessionId: string },
  ): Promise<RevokeSessionResult> {
    const outcome = await this.sessionRepository.revokeSessionForUser({
      userId: input.userId,
      sessionId: input.sessionId,
    });

    if (outcome === "not_found") {
      throw new SessionNotFoundError();
    }

    return {
      wasCurrent: input.sessionId === input.currentSessionId,
    };
  }
}
