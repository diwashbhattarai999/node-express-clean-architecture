import type { MfaFactorStatus } from "@/modules/auth/mfa/application/use-cases/get-mfa-status.use-case";

export type MfaFactorResponse = {
  id: string;
  type: "totp" | "sms" | "email";
  label: string | null;
  verifiedAt: string | null;
};

export const toMfaFactorResponse = (factor: MfaFactorStatus): MfaFactorResponse => ({
  id: factor.id,
  type: factor.type,
  label: factor.label,
  verifiedAt: factor.verifiedAt ? factor.verifiedAt.toISOString() : null,
});
