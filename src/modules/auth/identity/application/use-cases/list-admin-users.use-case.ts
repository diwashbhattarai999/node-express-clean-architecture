import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type {
  IIdentityRepository,
  ListUsersQuery,
  ListUsersResult,
} from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type ListAdminUsersInput = {
  userId: string;
  sessionId: string;
} & ListUsersQuery;

export class ListAdminUsersUseCase {
  public constructor(
    private readonly identityRepository: Pick<
      IIdentityRepository,
      "findAuthenticatedPrincipal" | "listUsers"
    >,
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  public async execute(input: ListAdminUsersInput): Promise<ListUsersResult> {
    const principal = await this.identityRepository.findAuthenticatedPrincipal(
      input.userId,
      input.sessionId,
    );

    switch (principal.outcome) {
      case "invalid_session":
      case "user_not_found":
        throw new TokenInvalidError("The access token is invalid.");
      case "expired_session":
        throw new TokenExpiredError("The session has expired.");
      case "revoked_session":
        throw new TokenRevokedError("The session has been revoked.");
      case "ok":
        break;
    }

    const allowed = await this.permissionRepository.hasKeyForUser(
      input.userId,
      PermissionKey.USERS_READ,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    return this.identityRepository.listUsers({
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      ...(input.search !== undefined ? { search: input.search } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });
  }
}
