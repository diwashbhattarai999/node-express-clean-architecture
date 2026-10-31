import type { Request, Response } from "express";

import type { ListOwnIdentitiesUseCase } from "@/modules/auth/identity/application/use-cases/list-own-identities.use-case";
import {
  type LoginIdentityResponse,
  toLoginIdentityResponseList,
} from "@/modules/auth/shared/presentation/http/mappers/login-identity.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ListOwnIdentitiesController {
  public constructor(private readonly listOwnIdentitiesUseCase: ListOwnIdentitiesUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.listOwnIdentitiesUseCase.execute({
      userId,
      sessionId,
    });

    sendSuccess<LoginIdentityResponse[]>(
      res,
      HttpStatus.OK,
      "Identities retrieved.",
      toLoginIdentityResponseList(result.identities),
    );
  }
}
