import type { ChangePasswordDto } from "@/modules/auth/credentials/application/dto/change-password.dto";
import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";

export type ChangePasswordInput = ChangePasswordDto & {
  userId: string;
  currentSessionId: string;
};

export class ChangePasswordUseCase {
  public constructor(
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  public async execute(input: ChangePasswordInput): Promise<void> {
    const passwordHash = await this.credentialsRepository.findPasswordHashForUser(input.userId);

    if (!passwordHash) {
      throw new InvalidCredentialsError("Current password is incorrect.");
    }

    const currentMatches = await this.passwordHasher.compare(input.currentPassword, passwordHash);

    if (!currentMatches) {
      throw new InvalidCredentialsError("Current password is incorrect.");
    }

    const newPasswordHash = await this.passwordHasher.hash(input.password);
    const updated = await this.credentialsRepository.changePasswordForUser(
      input.userId,
      newPasswordHash,
      input.currentSessionId,
    );

    if (!updated) {
      throw new InvalidCredentialsError("Current password is incorrect.");
    }
  }
}
