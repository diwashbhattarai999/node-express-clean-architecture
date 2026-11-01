import type { Request, Response } from "express";

import type { ListOwnPermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/list-own-permissions.use-case";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type ListOwnPermissionsResponseData = {
  permissions: string[];
};

export class ListOwnPermissionsController {
  public constructor(private readonly listOwnPermissionsUseCase: ListOwnPermissionsUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.listOwnPermissionsUseCase.execute({
      userId,
      sessionId,
    });

    sendSuccess<ListOwnPermissionsResponseData>(res, HttpStatus.OK, "Permissions retrieved.", {
      permissions: result.permissions,
    });
  }
}
