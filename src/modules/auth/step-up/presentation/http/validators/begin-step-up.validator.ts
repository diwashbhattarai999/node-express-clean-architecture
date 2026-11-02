import { z } from "zod";

import { STEP_UP_METHODS } from "@/modules/auth/step-up/application/constants/step-up";

export const beginStepUpSchema = z.object({
  body: z.object({
    method: z.enum(STEP_UP_METHODS, {
      error: "Step-up method must be password, mfa, or passkey.",
    }),
    factorId: z.uuid({ error: "Factor id must be a valid UUID." }).optional(),
  }),
});

export type BeginStepUpSchema = typeof beginStepUpSchema;
