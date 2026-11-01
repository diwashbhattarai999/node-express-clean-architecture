import {
  isReservedUsername,
  normalizeUsername,
} from "@/modules/auth/identity/application/constants/username";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { TLoginIdentityType } from "@/modules/auth/shared/application/types/auth.types";

export type CheckIdentifierInput = {
  type: TLoginIdentityType;
  identifier: string;
};

export type CheckIdentifierResult = {
  available: boolean;
};

const normalizeIdentifier = (type: TLoginIdentityType, identifier: string): string => {
  switch (type) {
    case "email":
      return identifier.trim().toLowerCase();
    case "phone":
      return identifier.trim();
    case "username":
      return normalizeUsername(identifier);
  }
};

export class CheckIdentifierUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findIdentityByNormalized">,
  ) {}

  public async execute(input: CheckIdentifierInput): Promise<CheckIdentifierResult> {
    const normalizedIdentifier = normalizeIdentifier(input.type, input.identifier);

    if (input.type === "username" && isReservedUsername(normalizedIdentifier)) {
      return { available: false };
    }

    // Look up for uniform timing, but never reveal whether email/phone/username is taken.
    await this.identityRepository.findIdentityByNormalized(input.type, normalizedIdentifier);

    return { available: true };
  }
}
