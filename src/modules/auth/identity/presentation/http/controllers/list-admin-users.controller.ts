import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListAdminUsersUseCase } from "@/modules/auth/identity/application/use-cases/list-admin-users.use-case";
import type { ListAdminUsersSchema } from "@/modules/auth/identity/presentation/http/validators/list-admin-users.validator";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import type { IPagination } from "@/shared/http/api-response";
import { HttpStatus } from "@/shared/http/http-status";
import { createPaginationMeta } from "@/shared/http/pagination";
import { sendSuccessWithMeta } from "@/shared/http/send-response";

export class ListAdminUsersController {
  public constructor(private readonly listAdminUsersUseCase: ListAdminUsersUseCase) {}

  public async handle(req: ValidatedRequest<ListAdminUsersSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const query = req.query;

    const result = await this.listAdminUsersUseCase.execute({
      userId,
      sessionId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      ...(query.search !== undefined && query.search.length > 0 ? { search: query.search } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    });

    sendSuccessWithMeta<UserPublicResponse[], IPagination>(
      res,
      HttpStatus.OK,
      "Users retrieved.",
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
