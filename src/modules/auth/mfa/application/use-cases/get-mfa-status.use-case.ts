import type { TMfaEnrollType } from "@/modules/auth/mfa/application/constants/mfa";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";

export type MfaFactorStatus = {
  id: string;
  type: TMfaEnrollType;
  label: string | null;
  verifiedAt: Date | null;
};

export type GetMfaStatusResult = {
  enabled: boolean;
  factors: MfaFactorStatus[];
};

export class GetMfaStatusUseCase {
  public constructor(private readonly mfaRepository: IMfaRepository) {}

  public async execute(userId: string): Promise<GetMfaStatusResult> {
    const factors = await this.mfaRepository.listVerifiedFactors(userId);

    return {
      enabled: factors.length > 0,
      factors: factors.map((factor) => ({
        id: factor.id,
        type: factor.type,
        label: factor.label,
        verifiedAt: factor.verifiedAt,
      })),
    };
  }
}
