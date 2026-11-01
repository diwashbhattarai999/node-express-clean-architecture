import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import type { AuthorizationModule } from "@/modules/auth/authorization/authorization.module";
import { assignRolePermissionsSchema } from "@/modules/auth/authorization/presentation/http/validators/assign-role-permissions.validator";
import { assignUserRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/assign-user-role.validator";
import { createRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/create-role.validator";
import { deleteRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/delete-role.validator";
import { getPermissionSchema } from "@/modules/auth/authorization/presentation/http/validators/get-permission.validator";
import { getRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/get-role.validator";
import { listPermissionsSchema } from "@/modules/auth/authorization/presentation/http/validators/list-permissions.validator";
import { listRoleUsersSchema } from "@/modules/auth/authorization/presentation/http/validators/list-role-users.validator";
import { listRolesSchema } from "@/modules/auth/authorization/presentation/http/validators/list-roles.validator";
import { listUserPermissionsSchema } from "@/modules/auth/authorization/presentation/http/validators/list-user-permissions.validator";
import { listUserRolesSchema } from "@/modules/auth/authorization/presentation/http/validators/list-user-roles.validator";
import { removeRolePermissionSchema } from "@/modules/auth/authorization/presentation/http/validators/remove-role-permission.validator";
import { removeUserRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/remove-user-role.validator";
import { replaceUserRolesSchema } from "@/modules/auth/authorization/presentation/http/validators/replace-user-roles.validator";
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

  router.put(
    "/roles/:roleId/permissions",
    validate(assignRolePermissionsSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.PERMISSIONS_ASSIGN),
    asHandler(authModule.assignRolePermissionsController),
  );

  router.delete(
    "/roles/:roleId/permissions/:permissionId",
    validate(removeRolePermissionSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.PERMISSIONS_ASSIGN),
    asHandler(authModule.removeRolePermissionController),
  );

  router.get(
    "/roles/:roleId/users",
    validate(listRoleUsersSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_READ),
    asHandler(authModule.listRoleUsersController),
  );

  router.get(
    "/users/:userId/roles",
    validate(listUserRolesSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_READ),
    asHandler(authModule.listUserRolesController),
  );

  router.post(
    "/users/:userId/roles",
    validate(assignUserRoleSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_ASSIGN),
    asHandler(authModule.assignUserRoleController),
  );

  router.delete(
    "/users/:userId/roles/:roleId",
    validate(removeUserRoleSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_ASSIGN),
    asHandler(authModule.removeUserRoleController),
  );

  router.put(
    "/users/:userId/roles",
    validate(replaceUserRolesSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.ROLES_ASSIGN),
    asHandler(authModule.replaceUserRolesController),
  );

  router.get(
    "/users/:userId/permissions",
    validate(listUserPermissionsSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.PERMISSIONS_READ),
    asHandler(authModule.listUserPermissionsController),
  );

  return router;
}
