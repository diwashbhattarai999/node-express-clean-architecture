import { SessionNotFoundError } from "@/modules/auth/sessions/application/errors/session-not-found.error";
import type {
  AuthSessionSummary,
  ISessionRepository,
} from "@/modules/auth/sessions/application/ports/session.repository";

export type GetSessionInput = {
  userId: string;
  sessionId: string;
  currentSessionId: string;
};

export class GetSessionUseCase {
  public constructor(private readonly sessionRepository: ISessionRepository) {}

  public async execute(input: GetSessionInput): Promise<AuthSessionSummary> {
    const session = await this.sessionRepository.findSessionForUser({
      userId: input.userId,
      sessionId: input.sessionId,
      currentSessionId: input.currentSessionId,
    });

    if (!session) {
      throw new SessionNotFoundError();
    }

    return session;
  }
}
