import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-roles.use-case";
import {
  type RoleResponse,
  toRoleResponseList,
} from "@/modules/auth/authorization/presentation/http/mappers/role.response";
import type { ListRolesSchema } from "@/modules/auth/authorization/presentation/http/validators/list-roles.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import type { IPagination } from "@/shared/http/api-response";
import { HttpStatus } from "@/shared/http/http-status";
import { createPaginationMeta } from "@/shared/http/pagination";
import { sendSuccessWithMeta } from "@/shared/http/send-response";

export class ListRolesController {
  public constructor(private readonly listRolesUseCase: ListRolesUseCase) {}

  public async handle(req: ValidatedRequest<ListRolesSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const query = req.query;

    const result = await this.listRolesUseCase.execute({
      userId,
      sessionId,
      page: query.page,
      limit: query.limit,
      ...(query.search !== undefined && query.search.length > 0 ? { search: query.search } : {}),
    });

    sendSuccessWithMeta<RoleResponse[], IPagination>(
      res,
      HttpStatus.OK,
      "Roles retrieved.",
      toRoleResponseList(result.items),
      createPaginationMeta({
        totalRecords: result.total,
        page: query.page,
        limit: query.limit,
        recordShown: result.items.length,
      }),
    );
  }
}
