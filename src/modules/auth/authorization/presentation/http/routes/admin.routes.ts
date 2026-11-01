import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import type { AuthorizationModule } from "@/modules/auth/authorization/authorization.module";
import { createRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/create-role.validator";
import { getRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/get-role.validator";
import { listRolesSchema } from "@/modules/auth/authorization/presentation/http/validators/list-roles.validator";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";

export function createAdminRouter(
  authModule: AuthorizationModule & Pick<AuthHttpGuards, "requireBearerAuth">,
): IRouter {
  const router = Router();

  router.get(
    "/roles",
    validate(listRolesSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_READ),
    asHandler(authModule.listRolesController),
  );

  router.get(
    "/roles/:roleId",
    validate(getRoleSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_READ),
    asHandler(authModule.getRoleController),
  );

  router.post(
    "/roles",
    validate(createRoleSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_CREATE),
    asHandler(authModule.createRoleController),
  );

  return router;
}
