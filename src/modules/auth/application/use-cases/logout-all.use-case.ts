import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";

export type LogoutAllResult = {
  revokedCount: number;
};

export class LogoutAllUseCase {
  public constructor(private readonly authAccountRepository: IAuthAccountRepository) {}

  public async execute(userId: string): Promise<LogoutAllResult> {
    const revokedCount = await this.authAccountRepository.revokeAllSessionsForUser(userId);
    return { revokedCount };
  }
}
