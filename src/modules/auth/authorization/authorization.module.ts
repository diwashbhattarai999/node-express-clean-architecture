import { CheckPermissionUseCase } from "@/modules/auth/authorization/application/use-cases/check-permission.use-case";
import { ListOwnPermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/list-own-permissions.use-case";
import { ListOwnRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-own-roles.use-case";
import { PostgresPermissionRepository } from "@/modules/auth/authorization/infrastructure/repositories/postgres-permission.repository";
import { PostgresRoleRepository } from "@/modules/auth/authorization/infrastructure/repositories/postgres-role.repository";
import { CheckPermissionController } from "@/modules/auth/authorization/presentation/http/controllers/check-permission.controller";
import { ListOwnPermissionsController } from "@/modules/auth/authorization/presentation/http/controllers/list-own-permissions.controller";
import { ListOwnRolesController } from "@/modules/auth/authorization/presentation/http/controllers/list-own-roles.controller";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";

export type CreateAuthorizationModuleOptions = {
  identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">;
};

export type AuthorizationModule = {
  listOwnRolesController: ListOwnRolesController;
  listOwnPermissionsController: ListOwnPermissionsController;
  checkPermissionController: CheckPermissionController;
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
  };
}
