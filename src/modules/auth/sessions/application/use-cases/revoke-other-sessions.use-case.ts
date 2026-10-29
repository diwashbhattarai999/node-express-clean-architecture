import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";

export type RevokeOtherSessionsInput = {
  userId: string;
  currentSessionId: string;
};

export type RevokeOtherSessionsResult = {
  revokedCount: number;
};

export class RevokeOtherSessionsUseCase {
  public constructor(private readonly sessionRepository: ISessionRepository) {}

  public async execute(input: RevokeOtherSessionsInput): Promise<RevokeOtherSessionsResult> {
    const revokedCount = await this.sessionRepository.revokeOtherSessionsForUser(
      input.userId,
      input.currentSessionId,
    );

    return { revokedCount };
  }
}
