import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { MS_PER_DAY } from "@/modules/auth/identity/application/constants/account-deletion";
import type { RequestAccountDeletionDto } from "@/modules/auth/identity/application/dto/request-account-deletion.dto";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import { accountDeletionJobId, JobName } from "@/shared/jobs/job-names";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

export type RequestAccountDeletionUseCaseOptions = {
  graceDays: number;
};

export type RequestAccountDeletionInput = RequestAccountDeletionDto & {
  userId: string;
  sessionId: string;
};

export class RequestAccountDeletionUseCase {
  public constructor(
    private readonly identityRepository: IIdentityRepository,
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly jobQueue: IJobQueue,
    private readonly options: RequestAccountDeletionUseCaseOptions,
  ) {}

  public async execute(input: RequestAccountDeletionInput): Promise<Date> {
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

    if (input.password !== undefined) {
      const passwordHash = await this.credentialsRepository.findPasswordHashForUser(input.userId);

      if (!passwordHash) {
        throw new InvalidCredentialsError();
      }

      const matches = await this.passwordHasher.compare(input.password, passwordHash);

      if (!matches) {
        throw new InvalidCredentialsError();
      }
    }

    const scheduledFor = new Date(Date.now() + this.options.graceDays * MS_PER_DAY);
    const result = await this.identityRepository.scheduleAccountDeletion({
      userId: input.userId,
      scheduledFor,
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
    });

    if (result.outcome === "not_found") {
      throw new TokenInvalidError("The access token is invalid.");
    }

    await this.jobQueue.enqueue(
      JobName.APPLY_ACCOUNT_DELETION,
      { userId: input.userId },
      {
        jobId: accountDeletionJobId(input.userId),
        delayMs: Math.max(0, result.scheduledFor.getTime() - Date.now()),
      },
    );

    return result.scheduledFor;
  }
}
