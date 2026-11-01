import { SessionNotFoundError } from "@/modules/auth/sessions/application/errors/session-not-found.error";
import type {
  AuthSessionSummary,
  ISessionRepository,
} from "@/modules/auth/sessions/application/ports/session.repository";

export type UpdateSessionLabelInput = {
  userId: string;
  sessionId: string;
  currentSessionId: string;
  deviceName: string;
};

export class UpdateSessionLabelUseCase {
  public constructor(private readonly sessionRepository: ISessionRepository) {}

  public async execute(input: UpdateSessionLabelInput): Promise<AuthSessionSummary> {
    const session = await this.sessionRepository.updateSessionLabelForUser({
      userId: input.userId,
      sessionId: input.sessionId,
      currentSessionId: input.currentSessionId,
      deviceName: input.deviceName,
    });

    if (!session) {
      throw new SessionNotFoundError();
    }

    return session;
  }
}
