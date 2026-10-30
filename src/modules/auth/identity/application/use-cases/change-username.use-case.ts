import {
  isReservedUsername,
  normalizeUsername,
} from "@/modules/auth/identity/application/constants/username";
import type { ChangeUsernameDto } from "@/modules/auth/identity/application/dto/change-username.dto";
import { IdentityAlreadyExistsError } from "@/modules/auth/identity/application/errors/identity-already-exists.error";
import { UsernameReservedError } from "@/modules/auth/identity/application/errors/username-reserved.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

export type ChangeUsernameInput = ChangeUsernameDto & {
  userId: string;
};

export type ChangeUsernameResult = {
  user: AuthUser;
};

export class ChangeUsernameUseCase {
  public constructor(private readonly identityRepository: IIdentityRepository) {}

  public async execute(input: ChangeUsernameInput): Promise<ChangeUsernameResult> {
    const identifier = input.username.trim();
    const normalizedIdentifier = normalizeUsername(identifier);

    if (isReservedUsername(normalizedIdentifier)) {
      throw new UsernameReservedError();
    }

    const existing = await this.identityRepository.findIdentityByNormalized(
      "username",
      normalizedIdentifier,
    );

    if (existing && existing.userId !== input.userId) {
      throw new IdentityAlreadyExistsError();
    }

    const user = await this.identityRepository.upsertUsername({
      userId: input.userId,
      identifier,
      normalizedIdentifier,
    });

    return { user };
  }
}
