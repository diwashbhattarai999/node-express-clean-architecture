import type {
  IPasskeyRepository,
  Passkey,
} from "@/modules/auth/passkeys/application/ports/passkey.repository";

export type ListPasskeysResult = {
  passkeys: Passkey[];
};

export class ListPasskeysUseCase {
  public constructor(private readonly passkeyRepository: IPasskeyRepository) {}

  public async execute(userId: string): Promise<ListPasskeysResult> {
    const passkeys = await this.passkeyRepository.listPasskeysForUser(userId);

    return { passkeys };
  }
}
