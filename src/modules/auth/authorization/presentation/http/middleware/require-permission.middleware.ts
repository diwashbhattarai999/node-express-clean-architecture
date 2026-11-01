import type { RequestHandler } from "express";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { asyncMiddleware } from "@/modules/auth/shared/presentation/http/middleware/async-middleware";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";

export const createRequirePermission =
  (permissionRepository: IPermissionRepository) =>
  (permission: string): RequestHandler =>
    asyncMiddleware(async (req, _res, next) => {
      const { userId } = getBearerAuth(req);
      const allowed = await permissionRepository.hasKeyForUser(userId, permission);

      if (!allowed) {
        throw new PermissionDeniedError();
      }

      next();
    });
