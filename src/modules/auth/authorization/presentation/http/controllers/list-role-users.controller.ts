import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListRoleUsersUseCase } from "@/modules/auth/authorization/application/use-cases/list-role-users.use-case";
import type { ListRoleUsersSchema } from "@/modules/auth/authorization/presentation/http/validators/list-role-users.validator";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import type { IPagination } from "@/shared/http/api-response";
import { HttpStatus } from "@/shared/http/http-status";
import { createPaginationMeta } from "@/shared/http/pagination";
import { sendSuccessWithMeta } from "@/shared/http/send-response";

export class ListRoleUsersController {
  public constructor(private readonly listRoleUsersUseCase: ListRoleUsersUseCase) {}

  public async handle(req: ValidatedRequest<ListRoleUsersSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const query = req.query;

    const result = await this.listRoleUsersUseCase.execute({
      userId,
      sessionId,
      roleId: req.params.roleId,
      page: query.page,
      limit: query.limit,
    });

    sendSuccessWithMeta<UserPublicResponse[], IPagination>(
      res,
      HttpStatus.OK,
      "Role users retrieved.",
      result.items.map(toUserPublicResponse),
      createPaginationMeta({
        totalRecords: result.total,
        page: query.page,
        limit: query.limit,
        recordShown: result.items.length,
      }),
    );
  }
}
