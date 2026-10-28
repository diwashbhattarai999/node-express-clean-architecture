import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";

export type LogoutInput = {
  refreshToken?: string | null;
  sessionId?: string | null;
};

export class LogoutUseCase {
  public constructor(private readonly sessionRepository: ISessionRepository) {}

  public async execute(input: LogoutInput): Promise<void> {
    const refreshToken = input.refreshToken?.trim() || null;
    const sessionId = input.sessionId?.trim() || null;

    if (!refreshToken && !sessionId) {
      throw new UnauthorizedError("Refresh or access token is required to sign out.");
    }

    if (refreshToken) {
      await this.sessionRepository.revokeSessionByRefreshTokenHash(hashToken(refreshToken));
    }

    if (sessionId) {
      await this.sessionRepository.revokeSessionById(sessionId);
    }
  }
}
