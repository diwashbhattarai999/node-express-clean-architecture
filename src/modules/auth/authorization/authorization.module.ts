import type { RequestHandler } from "express";

import { AssignRolePermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/assign-role-permissions.use-case";
import { CheckPermissionUseCase } from "@/modules/auth/authorization/application/use-cases/check-permission.use-case";
import { CreateRoleUseCase } from "@/modules/auth/authorization/application/use-cases/create-role.use-case";
import { DeleteRoleUseCase } from "@/modules/auth/authorization/application/use-cases/delete-role.use-case";
import { GetPermissionUseCase } from "@/modules/auth/authorization/application/use-cases/get-permission.use-case";
import { GetRoleUseCase } from "@/modules/auth/authorization/application/use-cases/get-role.use-case";
import { ListOwnPermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/list-own-permissions.use-case";
import { ListOwnRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-own-roles.use-case";
import { ListPermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/list-permissions.use-case";
import { ListRoleUsersUseCase } from "@/modules/auth/authorization/application/use-cases/list-role-users.use-case";
import { ListRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-roles.use-case";
import { ListUserRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-user-roles.use-case";
import { RemoveRolePermissionUseCase } from "@/modules/auth/authorization/application/use-cases/remove-role-permission.use-case";
import { UpdateRoleUseCase } from "@/modules/auth/authorization/application/use-cases/update-role.use-case";
import { PostgresPermissionRepository } from "@/modules/auth/authorization/infrastructure/repositories/postgres-permission.repository";
import { PostgresRoleRepository } from "@/modules/auth/authorization/infrastructure/repositories/postgres-role.repository";
import { AssignRolePermissionsController } from "@/modules/auth/authorization/presentation/http/controllers/assign-role-permissions.controller";
import { CheckPermissionController } from "@/modules/auth/authorization/presentation/http/controllers/check-permission.controller";
import { CreateRoleController } from "@/modules/auth/authorization/presentation/http/controllers/create-role.controller";
import { DeleteRoleController } from "@/modules/auth/authorization/presentation/http/controllers/delete-role.controller";
import { GetPermissionController } from "@/modules/auth/authorization/presentation/http/controllers/get-permission.controller";
import { GetRoleController } from "@/modules/auth/authorization/presentation/http/controllers/get-role.controller";
import { ListOwnPermissionsController } from "@/modules/auth/authorization/presentation/http/controllers/list-own-permissions.controller";
import { ListOwnRolesController } from "@/modules/auth/authorization/presentation/http/controllers/list-own-roles.controller";
import { ListPermissionsController } from "@/modules/auth/authorization/presentation/http/controllers/list-permissions.controller";
import { ListRoleUsersController } from "@/modules/auth/authorization/presentation/http/controllers/list-role-users.controller";
import { ListRolesController } from "@/modules/auth/authorization/presentation/http/controllers/list-roles.controller";
import { ListUserRolesController } from "@/modules/auth/authorization/presentation/http/controllers/list-user-roles.controller";
import { RemoveRolePermissionController } from "@/modules/auth/authorization/presentation/http/controllers/remove-role-permission.controller";
import { UpdateRoleController } from "@/modules/auth/authorization/presentation/http/controllers/update-role.controller";
import { createRequirePermission } from "@/modules/auth/authorization/presentation/http/middleware/require-permission.middleware";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";

export type CreateAuthorizationModuleOptions = {
  identityRepository: Pick<IIdentityRepository, "existsById" | "findAuthenticatedPrincipal">;
};

export type AuthorizationModule = {
  listOwnRolesController: ListOwnRolesController;
  listOwnPermissionsController: ListOwnPermissionsController;
  checkPermissionController: CheckPermissionController;
  listRolesController: ListRolesController;
  getRoleController: GetRoleController;
  createRoleController: CreateRoleController;
  updateRoleController: UpdateRoleController;
  deleteRoleController: DeleteRoleController;
  listPermissionsController: ListPermissionsController;
  getPermissionController: GetPermissionController;
  assignRolePermissionsController: AssignRolePermissionsController;
  removeRolePermissionController: RemoveRolePermissionController;
  listRoleUsersController: ListRoleUsersController;
  listUserRolesController: ListUserRolesController;
  requirePermission: (permission: string) => RequestHandler;
};

export function createAuthorizationModule(
  options: CreateAuthorizationModuleOptions,
): AuthorizationModule {
  const roleRepository = new PostgresRoleRepository();
  const permissionRepository = new PostgresPermissionRepository();

  return {
    listOwnRolesController: new ListOwnRolesController(
      new ListOwnRolesUseCase(options.identityRepository, roleRepository),
    ),
    listOwnPermissionsController: new ListOwnPermissionsController(
      new ListOwnPermissionsUseCase(options.identityRepository, permissionRepository),
    ),
    checkPermissionController: new CheckPermissionController(
      new CheckPermissionUseCase(options.identityRepository, permissionRepository),
    ),
    listRolesController: new ListRolesController(
      new ListRolesUseCase(options.identityRepository, permissionRepository, roleRepository),
    ),
    getRoleController: new GetRoleController(
      new GetRoleUseCase(options.identityRepository, permissionRepository, roleRepository),
    ),
    createRoleController: new CreateRoleController(
      new CreateRoleUseCase(options.identityRepository, permissionRepository, roleRepository),
    ),
    updateRoleController: new UpdateRoleController(
      new UpdateRoleUseCase(options.identityRepository, permissionRepository, roleRepository),
    ),
    deleteRoleController: new DeleteRoleController(
      new DeleteRoleUseCase(options.identityRepository, permissionRepository, roleRepository),
    ),
    listPermissionsController: new ListPermissionsController(
      new ListPermissionsUseCase(options.identityRepository, permissionRepository),
    ),
    getPermissionController: new GetPermissionController(
      new GetPermissionUseCase(options.identityRepository, permissionRepository),
    ),
    assignRolePermissionsController: new AssignRolePermissionsController(
      new AssignRolePermissionsUseCase(options.identityRepository, permissionRepository),
    ),
    removeRolePermissionController: new RemoveRolePermissionController(
      new RemoveRolePermissionUseCase(options.identityRepository, permissionRepository),
    ),
    listRoleUsersController: new ListRoleUsersController(
      new ListRoleUsersUseCase(options.identityRepository, permissionRepository, roleRepository),
    ),
    listUserRolesController: new ListUserRolesController(
      new ListUserRolesUseCase(options.identityRepository, permissionRepository, roleRepository),
    ),
    requirePermission: createRequirePermission(permissionRepository),
  };
}
