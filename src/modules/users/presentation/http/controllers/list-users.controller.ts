import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListUsersUseCase } from "@/modules/users/application/use-cases/list-users.use-case";
import {
  toUserResponseList,
  type UserResponse,
} from "@/modules/users/presentation/http/mappers/user.response";
import type { ListUsersSchema } from "@/modules/users/presentation/http/validators/user.schema";
import type { IPagination } from "@/shared/http/api-response";
import { HttpStatus } from "@/shared/http/http-status";
import { createPaginationMeta } from "@/shared/http/pagination";
import { sendSuccessWithMeta } from "@/shared/http/send-response";

export class ListUsersController {
  constructor(private readonly listUsersUseCase: ListUsersUseCase) {}

  async handle(req: ValidatedRequest<ListUsersSchema>, res: Response): Promise<void> {
    const result = await this.listUsersUseCase.execute(req.query);

    sendSuccessWithMeta<UserResponse[], IPagination>(
      res,
      HttpStatus.OK,
      "Users retrieved successfully.",
      toUserResponseList(result.items),
      createPaginationMeta({
        totalRecords: result.total,
        page: req.query.page,
        limit: req.query.limit,
        recordShown: result.items.length,
      }),
    );
  }
}
