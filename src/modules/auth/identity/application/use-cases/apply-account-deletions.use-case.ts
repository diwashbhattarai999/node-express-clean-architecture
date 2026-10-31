import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";

export type ApplyAccountDeletionsInput = {
  userId?: string;
};

export type ApplyAccountDeletionsResult = {
  appliedUserIds: string[];
};

export class ApplyAccountDeletionsUseCase {
  public constructor(private readonly identityRepository: IIdentityRepository) {}

  public async execute(
    input: ApplyAccountDeletionsInput = {},
  ): Promise<ApplyAccountDeletionsResult> {
    const appliedUserIds = await this.identityRepository.applyDueAccountDeletions({
      now: new Date(),
      ...(input.userId ? { userId: input.userId } : {}),
    });

    return { appliedUserIds };
  }
}
