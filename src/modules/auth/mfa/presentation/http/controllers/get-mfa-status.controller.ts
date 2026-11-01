import type { Request, Response } from "express";

import type { GetMfaStatusUseCase } from "@/modules/auth/mfa/application/use-cases/get-mfa-status.use-case";
import {
  type MfaFactorResponse,
  toMfaFactorResponse,
} from "@/modules/auth/mfa/presentation/http/mappers/mfa-factor.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type GetMfaStatusResponseData = {
  enabled: boolean;
  factors: MfaFactorResponse[];
};

export class GetMfaStatusController {
  public constructor(private readonly getMfaStatusUseCase: GetMfaStatusUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    const result = await this.getMfaStatusUseCase.execute(userId);

    sendSuccess<GetMfaStatusResponseData>(res, HttpStatus.OK, "MFA status retrieved.", {
      enabled: result.enabled,
      factors: result.factors.map(toMfaFactorResponse),
    });
  }
}
