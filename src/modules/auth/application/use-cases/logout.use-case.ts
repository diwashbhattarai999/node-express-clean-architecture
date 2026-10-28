import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { hashToken } from "@/modules/auth/application/utils/hash-token";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";

export type LogoutInput = {
  refreshToken?: string | null;
  sessionId?: string | null;
};

export class LogoutUseCase {
  public constructor(private readonly authAccountRepository: IAuthAccountRepository) {}

  public async execute(input: LogoutInput): Promise<void> {
    const refreshToken = input.refreshToken?.trim() || null;
    const sessionId = input.sessionId?.trim() || null;

    if (!refreshToken && !sessionId) {
      throw new UnauthorizedError("Refresh or access token is required to sign out.");
    }

    if (refreshToken) {
      await this.authAccountRepository.revokeSessionByRefreshTokenHash(hashToken(refreshToken));
    }

    if (sessionId) {
      await this.authAccountRepository.revokeSessionById(sessionId);
    }
  }
}
