import type { ResetPasswordDto } from "@/modules/auth/credentials/application/dto/reset-password.dto";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export class ResetPasswordUseCase {
  public constructor(
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  public async execute(dto: ResetPasswordDto): Promise<void> {
    const token = dto.token.trim();
    if (token.length === 0) {
      throw new TokenInvalidError("The password reset token is invalid.");
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const result = await this.credentialsRepository.resetPasswordByTokenHash(
      hashToken(token),
      passwordHash,
    );

    switch (result.outcome) {
      case "invalid":
        throw new TokenInvalidError("The password reset token is invalid.");
      case "expired":
        throw new TokenExpiredError("The password reset token has expired.");
      case "revoked":
        throw new TokenRevokedError("The password reset token has been revoked.");
      case "reset":
        return;
    }
  }
}
