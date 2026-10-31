import { AccountDeletionNotFoundError } from "@/modules/auth/identity/application/errors/account-deletion-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { accountDeletionJobId } from "@/shared/jobs/job-names";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

export type CancelAccountDeletionInput = {
  userId: string;
  sessionId: string;
};

export class CancelAccountDeletionUseCase {
  public constructor(
    private readonly identityRepository: IIdentityRepository,
    private readonly jobQueue: IJobQueue,
  ) {}

  public async execute(input: CancelAccountDeletionInput): Promise<void> {
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

    const result = await this.identityRepository.cancelAccountDeletion(input.userId);

    if (result.outcome === "not_found") {
      throw new AccountDeletionNotFoundError();
    }

    await this.jobQueue.remove(accountDeletionJobId(input.userId));
  }
}
