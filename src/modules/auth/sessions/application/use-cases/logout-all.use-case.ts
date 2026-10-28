import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";

export type LogoutAllResult = {
  revokedCount: number;
};

export class LogoutAllUseCase {
  public constructor(private readonly sessionRepository: ISessionRepository) {}

  public async execute(userId: string): Promise<LogoutAllResult> {
    const revokedCount = await this.sessionRepository.revokeAllSessionsForUser(userId);
    return { revokedCount };
  }
}
