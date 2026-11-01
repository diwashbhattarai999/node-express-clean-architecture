import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { AuditModule } from "@/modules/auth/audit/audit.module";
import { exportAdminAuditLogsSchema } from "@/modules/auth/audit/presentation/http/validators/export-admin-audit-logs.validator";
import { getAdminAuditExportSchema } from "@/modules/auth/audit/presentation/http/validators/get-admin-audit-export.validator";
import { getAdminAuditLogSchema } from "@/modules/auth/audit/presentation/http/validators/get-admin-audit-log.validator";
import { listAdminAuditLogsSchema } from "@/modules/auth/audit/presentation/http/validators/list-admin-audit-logs.validator";
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
import type { CredentialsModule } from "@/modules/auth/credentials/credentials.module";
import type { IdentityModule } from "@/modules/auth/identity/identity.module";
import { adminUserIdSchema } from "@/modules/auth/identity/presentation/http/validators/admin-user-id.validator";
import { deleteAdminUserSchema } from "@/modules/auth/identity/presentation/http/validators/delete-admin-user.validator";
import { listAdminUsersSchema } from "@/modules/auth/identity/presentation/http/validators/list-admin-users.validator";
import { setAdminUserStatusSchema } from "@/modules/auth/identity/presentation/http/validators/set-admin-user-status.validator";
import { updateAdminUserSchema } from "@/modules/auth/identity/presentation/http/validators/update-admin-user.validator";
import type { SessionsModule } from "@/modules/auth/sessions/sessions.module";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";

export function createAdminRouter(
  authModule: AuthorizationModule &
    IdentityModule &
    SessionsModule &
    CredentialsModule &
    AuditModule &
    Pick<AuthHttpGuards, "requireBearerAuth">,
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

  router.get(
    "/users",
    validate(listAdminUsersSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.USERS_READ),
    asHandler(authModule.listAdminUsersController),
  );

  router.get(
    "/users/:userId",
    validate(adminUserIdSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.USERS_READ),
    asHandler(authModule.getAdminUserController),
  );

  router.patch(
    "/users/:userId",
    validate(updateAdminUserSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.USERS_UPDATE),
    asHandler(authModule.updateAdminUserController),
  );

  router.post(
    "/users/:userId/suspend",
    validate(setAdminUserStatusSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.USERS_SUSPEND),
    asHandler(authModule.suspendAdminUserController),
  );

  router.post(
    "/users/:userId/reactivate",
    validate(adminUserIdSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.USERS_SUSPEND),
    asHandler(authModule.reactivateAdminUserController),
  );

  router.post(
    "/users/:userId/disable",
    validate(setAdminUserStatusSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.USERS_SUSPEND),
    asHandler(authModule.disableAdminUserController),
  );

  router.post(
    "/users/:userId/enable",
    validate(adminUserIdSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.USERS_SUSPEND),
    asHandler(authModule.enableAdminUserController),
  );

  router.post(
    "/users/:userId/sessions/revoke-all",
    validate(adminUserIdSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.SESSIONS_REVOKE),
    asHandler(authModule.revokeAdminUserSessionsController),
  );

  router.post(
    "/users/:userId/password-reset",
    validate(adminUserIdSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.USERS_UPDATE),
    asHandler(authModule.adminPasswordResetController),
  );

  router.delete(
    "/users/:userId",
    validate(deleteAdminUserSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.USERS_DELETE),
    asHandler(authModule.deleteAdminUserController),
  );

  router.get(
    "/audit-logs",
    validate(listAdminAuditLogsSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.AUDIT_LOGS_READ),
    asHandler(authModule.listAdminAuditLogsController),
  );

  router.post(
    "/audit-logs/exports",
    validate(exportAdminAuditLogsSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.AUDIT_LOGS_EXPORT),
    asHandler(authModule.exportAdminAuditLogsController),
  );

  router.get(
    "/audit-logs/exports/:exportId",
    validate(getAdminAuditExportSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.AUDIT_LOGS_EXPORT),
    asHandler(authModule.getAdminAuditExportController),
  );

  router.get(
    "/audit-logs/:eventId",
    validate(getAdminAuditLogSchema),
    authModule.requireBearerAuth,
    authModule.requirePermission(PermissionKey.AUDIT_LOGS_READ),
    asHandler(authModule.getAdminAuditLogController),
  );

  return router;
}
