import type { Request, Response } from "express";

import type { AuthProviderPublic } from "@/modules/auth/oauth/application/types/auth-provider-public";
import type { ListAuthProvidersUseCase } from "@/modules/auth/oauth/application/use-cases/list-auth-providers.use-case";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ListAuthProvidersController {
  public constructor(private readonly listAuthProvidersUseCase: ListAuthProvidersUseCase) {}

  public handle(_req: Request, res: Response): void {
    const result = this.listAuthProvidersUseCase.execute();

    sendSuccess<AuthProviderPublic[]>(
      res,
      HttpStatus.OK,
      "Auth providers retrieved.",
      result.providers,
    );
  }
}
