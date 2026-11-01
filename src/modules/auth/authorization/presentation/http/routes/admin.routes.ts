import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import type { AuthorizationModule } from "@/modules/auth/authorization/authorization.module";
import { createRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/create-role.validator";
import { deleteRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/delete-role.validator";
import { getPermissionSchema } from "@/modules/auth/authorization/presentation/http/validators/get-permission.validator";
import { getRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/get-role.validator";
import { listPermissionsSchema } from "@/modules/auth/authorization/presentation/http/validators/list-permissions.validator";
import { listRolesSchema } from "@/modules/auth/authorization/presentation/http/validators/list-roles.validator";
import { updateRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/update-role.validator";
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

  router.patch(
    "/roles/:roleId",
    validate(updateRoleSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_UPDATE),
    asHandler(authModule.updateRoleController),
  );

  router.delete(
    "/roles/:roleId",
    validate(deleteRoleSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_DELETE),
    asHandler(authModule.deleteRoleController),
  );

  router.get(
    "/permissions",
    validate(listPermissionsSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.PERMISSIONS_READ),
    asHandler(authModule.listPermissionsController),
  );

  router.get(
    "/permissions/:permissionId",
    validate(getPermissionSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.PERMISSIONS_READ),
    asHandler(authModule.getPermissionController),
  );

  return router;
}
