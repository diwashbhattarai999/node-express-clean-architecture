import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListPermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/list-permissions.use-case";
import {
  type PermissionResponse,
  toPermissionResponseList,
} from "@/modules/auth/authorization/presentation/http/mappers/permission.response";
import type { ListPermissionsSchema } from "@/modules/auth/authorization/presentation/http/validators/list-permissions.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import type { IPagination } from "@/shared/http/api-response";
import { HttpStatus } from "@/shared/http/http-status";
import { createPaginationMeta } from "@/shared/http/pagination";
import { sendSuccessWithMeta } from "@/shared/http/send-response";

export class ListPermissionsController {
  public constructor(private readonly listPermissionsUseCase: ListPermissionsUseCase) {}

  public async handle(req: ValidatedRequest<ListPermissionsSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const query = req.query;

    const result = await this.listPermissionsUseCase.execute({
      userId,
      sessionId,
      page: query.page,
      limit: query.limit,
      ...(query.search !== undefined && query.search.length > 0 ? { search: query.search } : {}),
    });

    sendSuccessWithMeta<PermissionResponse[], IPagination>(
      res,
      HttpStatus.OK,
      "Permissions retrieved.",
      toPermissionResponseList(result.items),
      createPaginationMeta({
        totalRecords: result.total,
        page: query.page,
        limit: query.limit,
        recordShown: result.items.length,
      }),
    );
  }
}
