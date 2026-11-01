import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import { normalizeRecoveryCode } from "@/modules/auth/mfa/application/utils/recovery-codes";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export const consumeMatchingRecoveryCode = async (
  mfaRepository: IMfaRepository,
  userId: string,
  code: string,
): Promise<boolean> => {
  const normalized = normalizeRecoveryCode(code);

  if (!normalized) {
    return false;
  }

  const codeHash = hashToken(normalized);
  const unused = await mfaRepository.findUnusedRecoveryCodes(userId);
  const match = unused.find((row) => row.codeHash === codeHash);

  if (!match) {
    return false;
  }

  return mfaRepository.markRecoveryCodeUsed(match.id);
};
