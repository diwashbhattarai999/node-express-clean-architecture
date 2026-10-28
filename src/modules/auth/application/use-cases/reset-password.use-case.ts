import type { ResetPasswordDto } from "@/modules/auth/application/dto/reset-password.dto";
import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/application/errors/token-revoked.error";
import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import type { IPasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";
import { hashToken } from "@/modules/auth/application/utils/hash-token";

export class ResetPasswordUseCase {
  public constructor(
    private readonly authAccountRepository: IAuthAccountRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  public async execute(dto: ResetPasswordDto): Promise<void> {
    const token = dto.token.trim();
    if (token.length === 0) {
      throw new TokenInvalidError("The password reset token is invalid.");
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const result = await this.authAccountRepository.resetPasswordByTokenHash(
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
