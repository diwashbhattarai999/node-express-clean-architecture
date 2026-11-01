import type { Request, Response } from "express";

import type {
  AuthConfig,
  GetAuthConfigUseCase,
} from "@/modules/auth/oauth/application/use-cases/get-auth-config.use-case";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class GetAuthConfigController {
  public constructor(private readonly getAuthConfigUseCase: GetAuthConfigUseCase) {}

  public handle(_req: Request, res: Response): void {
    sendSuccess<AuthConfig>(
      res,
      HttpStatus.OK,
      "Auth config retrieved.",
      this.getAuthConfigUseCase.execute(),
    );
  }
}
