import type { Request, Response } from "express";

import type { ListOwnOAuthAccountsUseCase } from "@/modules/auth/oauth/application/use-cases/list-own-oauth-accounts.use-case";
import {
  type OAuthAccountResponse,
  toOAuthAccountResponseList,
} from "@/modules/auth/oauth/presentation/http/mappers/oauth-account.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ListOwnOAuthAccountsController {
  public constructor(private readonly listOwnOAuthAccountsUseCase: ListOwnOAuthAccountsUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.listOwnOAuthAccountsUseCase.execute({
      userId,
      sessionId,
    });

    sendSuccess<OAuthAccountResponse[]>(
      res,
      HttpStatus.OK,
      "OAuth accounts retrieved.",
      toOAuthAccountResponseList(result.accounts),
    );
  }
}
