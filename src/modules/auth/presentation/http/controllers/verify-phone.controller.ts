import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { VerifyPhoneUseCase } from "@/modules/auth/application/use-cases/verify-phone.use-case";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/presentation/http/mappers/user-public.response";
import type { VerifyPhoneSchema } from "@/modules/auth/presentation/http/validators/verify-phone.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type VerifyPhoneResponseData = {
  user: UserPublicResponse;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export class VerifyPhoneController {
  public constructor(private readonly verifyPhoneUseCase: VerifyPhoneUseCase) {}

  public async handle(req: ValidatedRequest<VerifyPhoneSchema>, res: Response): Promise<void> {
    const result = await this.verifyPhoneUseCase.execute(req.body, {
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    sendSuccess<VerifyPhoneResponseData>(res, HttpStatus.OK, "Phone verified.", {
      user: toUserPublicResponse(result.user),
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
    });
  }
}
