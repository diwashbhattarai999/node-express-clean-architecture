import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { AddEmailUseCase } from "@/modules/auth/identity/application/use-cases/add-email.use-case";
import { CancelAccountDeletionUseCase } from "@/modules/auth/identity/application/use-cases/cancel-account-deletion.use-case";
import { ChangeUsernameUseCase } from "@/modules/auth/identity/application/use-cases/change-username.use-case";
import { GetMeUseCase } from "@/modules/auth/identity/application/use-cases/get-me.use-case";
import { GetOwnProfileUseCase } from "@/modules/auth/identity/application/use-cases/get-own-profile.use-case";
import { ListOwnIdentitiesUseCase } from "@/modules/auth/identity/application/use-cases/list-own-identities.use-case";
import { RegisterUseCase } from "@/modules/auth/identity/application/use-cases/register.use-case";
import { RemoveEmailUseCase } from "@/modules/auth/identity/application/use-cases/remove-email.use-case";
import { RequestAccountDeletionUseCase } from "@/modules/auth/identity/application/use-cases/request-account-deletion.use-case";
import { UpdateOwnProfileUseCase } from "@/modules/auth/identity/application/use-cases/update-own-profile.use-case";
import { VerifyAddedEmailUseCase } from "@/modules/auth/identity/application/use-cases/verify-added-email.use-case";
import { PostgresIdentityRepository } from "@/modules/auth/identity/infrastructure/repositories/postgres-identity.repository";
import { AddEmailController } from "@/modules/auth/identity/presentation/http/controllers/add-email.controller";
import { CancelAccountDeletionController } from "@/modules/auth/identity/presentation/http/controllers/cancel-account-deletion.controller";
import { ChangeUsernameController } from "@/modules/auth/identity/presentation/http/controllers/change-username.controller";
import { GetMeController } from "@/modules/auth/identity/presentation/http/controllers/get-me.controller";
import { GetOwnProfileController } from "@/modules/auth/identity/presentation/http/controllers/get-own-profile.controller";
import { ListOwnIdentitiesController } from "@/modules/auth/identity/presentation/http/controllers/list-own-identities.controller";
import { RegisterController } from "@/modules/auth/identity/presentation/http/controllers/register.controller";
import { RemoveEmailController } from "@/modules/auth/identity/presentation/http/controllers/remove-email.controller";
import { RequestAccountDeletionController } from "@/modules/auth/identity/presentation/http/controllers/request-account-deletion.controller";
import { UpdateOwnProfileController } from "@/modules/auth/identity/presentation/http/controllers/update-own-profile.controller";
import { VerifyAddedEmailController } from "@/modules/auth/identity/presentation/http/controllers/verify-added-email.controller";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import type { AuthEmailOptions } from "@/modules/auth/shared/application/types/auth-composition";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

export type CreateIdentityModuleOptions = {
  credentialsRepository: ICredentialsRepository;
  passwordHasher: IPasswordHasher;
  emailSender: IEmailSender;
  jobQueue: IJobQueue;
  emailOptions: AuthEmailOptions;
  accountDeletionGraceDays: number;
};

export type IdentityModule = {
  registerController: RegisterController;
  getMeController: GetMeController;
  getOwnProfileController: GetOwnProfileController;
  updateOwnProfileController: UpdateOwnProfileController;
  listOwnIdentitiesController: ListOwnIdentitiesController;
  addEmailController: AddEmailController;
  verifyAddedEmailController: VerifyAddedEmailController;
  removeEmailController: RemoveEmailController;
  requestAccountDeletionController: RequestAccountDeletionController;
  cancelAccountDeletionController: CancelAccountDeletionController;
  changeUsernameController: ChangeUsernameController;
};

export function createIdentityModule(options: CreateIdentityModuleOptions): IdentityModule {
  const identityRepository = new PostgresIdentityRepository();

  return {
    registerController: new RegisterController(
      new RegisterUseCase(
        identityRepository,
        options.passwordHasher,
        options.emailSender,
        options.emailOptions,
      ),
    ),
    getMeController: new GetMeController(new GetMeUseCase(identityRepository)),
    getOwnProfileController: new GetOwnProfileController(
      new GetOwnProfileUseCase(identityRepository),
    ),
    updateOwnProfileController: new UpdateOwnProfileController(
      new UpdateOwnProfileUseCase(identityRepository),
    ),
    listOwnIdentitiesController: new ListOwnIdentitiesController(
      new ListOwnIdentitiesUseCase(identityRepository),
    ),
    addEmailController: new AddEmailController(
      new AddEmailUseCase(identityRepository, options.emailSender, options.emailOptions),
    ),
    verifyAddedEmailController: new VerifyAddedEmailController(
      new VerifyAddedEmailUseCase(identityRepository),
    ),
    removeEmailController: new RemoveEmailController(new RemoveEmailUseCase(identityRepository)),
    requestAccountDeletionController: new RequestAccountDeletionController(
      new RequestAccountDeletionUseCase(
        identityRepository,
        options.credentialsRepository,
        options.passwordHasher,
        options.jobQueue,
        { graceDays: options.accountDeletionGraceDays },
      ),
    ),
    cancelAccountDeletionController: new CancelAccountDeletionController(
      new CancelAccountDeletionUseCase(identityRepository, options.jobQueue),
    ),
    changeUsernameController: new ChangeUsernameController(
      new ChangeUsernameUseCase(identityRepository),
    ),
  };
}
