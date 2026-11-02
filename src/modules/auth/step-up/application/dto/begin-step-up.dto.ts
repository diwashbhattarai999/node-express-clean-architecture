import type { TStepUpMethod } from "@/modules/auth/step-up/application/constants/step-up";

export type BeginStepUpDto = {
  method: TStepUpMethod;
  factorId?: string | undefined;
};
