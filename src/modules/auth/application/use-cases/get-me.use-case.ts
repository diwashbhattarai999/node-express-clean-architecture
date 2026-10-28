import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/application/errors/token-revoked.error";
import type {
  AuthUser,
  IAuthAccountRepository,
} from "@/modules/auth/application/ports/auth-account.repository";

export type GetMeResult = {
  user: AuthUser;
  roles: string[];
  /** Permission keys; empty until RBAC permission tables/APIs land. */
  permissions: string[];
};

export type GetMeInput = {
  userId: string;
  sessionId: string;
};

export class GetMeUseCase {
  public constructor(private readonly authAccountRepository: IAuthAccountRepository) {}

  public async execute(input: GetMeInput): Promise<GetMeResult> {
    const result = await this.authAccountRepository.findAuthenticatedPrincipal(
      input.userId,
      input.sessionId,
    );

    switch (result.outcome) {
      case "invalid_session":
      case "user_not_found":
        throw new TokenInvalidError("The access token is invalid.");
      case "expired_session":
        throw new TokenExpiredError("The session has expired.");
      case "revoked_session":
        throw new TokenRevokedError("The session has been revoked.");
      case "ok":
        return {
          user: result.user,
          roles: result.roles,
          permissions: [],
        };
    }
  }
}
