import type { ValidatePasswordResetDto } from "@/modules/auth/credentials/application/dto/validate-password-reset.dto";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export type ValidatePasswordResetResult = { valid: true; expiresAt: string } | { valid: false };

export class ValidatePasswordResetUseCase {
  public constructor(private readonly credentialsRepository: ICredentialsRepository) {}

  public async execute(dto: ValidatePasswordResetDto): Promise<ValidatePasswordResetResult> {
    const token = dto.token.trim();
    if (token.length === 0) {
      return { valid: false };
    }

    const result = await this.credentialsRepository.validatePasswordResetTokenHash(
      hashToken(token),
    );

    if (!result.valid) {
      return { valid: false };
    }

    return {
      valid: true,
      expiresAt: result.expiresAt.toISOString(),
    };
  }
}
