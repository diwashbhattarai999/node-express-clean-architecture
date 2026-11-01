import type { TMfaEnrollType } from "@/modules/auth/mfa/application/constants/mfa";

export type BeginMfaEnrollDto = {
  type: TMfaEnrollType;
  destination?: string | undefined;
};
