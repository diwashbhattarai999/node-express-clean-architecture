import { LastAuthMethodError } from "@/modules/auth/identity/application/errors/last-auth-method.error";
import { PasskeyNotFoundError } from "@/modules/auth/passkeys/application/errors/passkey-not-found.error";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";

export class DeletePasskeyUseCase {
  public constructor(private readonly passkeyRepository: IPasskeyRepository) {}

  public async execute(userId: string, passkeyId: string): Promise<void> {
    const passkey = await this.passkeyRepository.findPasskeyForUser(userId, passkeyId);

    if (!passkey || passkey.revokedAt) {
      throw new PasskeyNotFoundError();
    }

    const remaining = await this.passkeyRepository.countViableAuthMethods(userId, passkeyId);

    if (remaining <= 0) {
      throw new LastAuthMethodError();
    }

    const revoked = await this.passkeyRepository.revokePasskey(userId, passkeyId);

    if (!revoked) {
      throw new PasskeyNotFoundError();
    }
  }
}
