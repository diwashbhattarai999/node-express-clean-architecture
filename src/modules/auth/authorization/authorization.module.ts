import { ListOwnRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-own-roles.use-case";
import { PostgresRoleRepository } from "@/modules/auth/authorization/infrastructure/repositories/postgres-role.repository";
import { ListOwnRolesController } from "@/modules/auth/authorization/presentation/http/controllers/list-own-roles.controller";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";

export type CreateAuthorizationModuleOptions = {
  identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">;
};

export type AuthorizationModule = {
  listOwnRolesController: ListOwnRolesController;
};

export function createAuthorizationModule(
  options: CreateAuthorizationModuleOptions,
): AuthorizationModule {
  const roleRepository = new PostgresRoleRepository();

  return {
    listOwnRolesController: new ListOwnRolesController(
      new ListOwnRolesUseCase(options.identityRepository, roleRepository),
    ),
  };
}
