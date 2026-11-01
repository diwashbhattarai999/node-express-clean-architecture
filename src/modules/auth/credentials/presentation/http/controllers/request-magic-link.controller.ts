import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { RequestMagicLinkUseCase } from "@/modules/auth/credentials/application/use-cases/request-magic-link.use-case";
import type { RequestMagicLinkSchema } from "@/modules/auth/credentials/presentation/http/validators/request-magic-link.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class RequestMagicLinkController {
  public constructor(private readonly requestMagicLinkUseCase: RequestMagicLinkUseCase) {}

  public async handle(req: ValidatedRequest<RequestMagicLinkSchema>, res: Response): Promise<void> {
    await this.requestMagicLinkUseCase.execute(req.body);

    sendSuccess(
      res,
      HttpStatus.OK,
      "If an account exists for that email, a sign-in link has been sent.",
      null,
    );
  }
}
