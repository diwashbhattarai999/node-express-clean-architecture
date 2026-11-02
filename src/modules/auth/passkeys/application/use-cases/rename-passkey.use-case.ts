import type { RenamePasskeyDto } from "@/modules/auth/passkeys/application/dto/rename-passkey.dto";
import { PasskeyNotFoundError } from "@/modules/auth/passkeys/application/errors/passkey-not-found.error";
import type {
  IPasskeyRepository,
  Passkey,
} from "@/modules/auth/passkeys/application/ports/passkey.repository";

export class RenamePasskeyUseCase {
  public constructor(private readonly passkeyRepository: IPasskeyRepository) {}

  public async execute(userId: string, passkeyId: string, dto: RenamePasskeyDto): Promise<Passkey> {
    const updated = await this.passkeyRepository.updatePasskeyName(userId, passkeyId, dto.name);

    if (!updated) {
      throw new PasskeyNotFoundError();
    }

    return updated;
  }
}
