import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { AddEmailUseCase } from "@/modules/auth/identity/application/use-cases/add-email.use-case";
import { AddPhoneUseCase } from "@/modules/auth/identity/application/use-cases/add-phone.use-case";
import { CancelAccountDeletionUseCase } from "@/modules/auth/identity/application/use-cases/cancel-account-deletion.use-case";
import { ChangeUsernameUseCase } from "@/modules/auth/identity/application/use-cases/change-username.use-case";
import { CheckIdentifierUseCase } from "@/modules/auth/identity/application/use-cases/check-identifier.use-case";
import { DeleteAdminUserUseCase } from "@/modules/auth/identity/application/use-cases/delete-admin-user.use-case";
import { GetAdminUserUseCase } from "@/modules/auth/identity/application/use-cases/get-admin-user.use-case";
import { GetMeUseCase } from "@/modules/auth/identity/application/use-cases/get-me.use-case";
import { GetOwnProfileUseCase } from "@/modules/auth/identity/application/use-cases/get-own-profile.use-case";
import { ListAdminUsersUseCase } from "@/modules/auth/identity/application/use-cases/list-admin-users.use-case";
import { ListOwnIdentitiesUseCase } from "@/modules/auth/identity/application/use-cases/list-own-identities.use-case";
import { RegisterUseCase } from "@/modules/auth/identity/application/use-cases/register.use-case";
import { RemoveEmailUseCase } from "@/modules/auth/identity/application/use-cases/remove-email.use-case";
import { RemovePhoneUseCase } from "@/modules/auth/identity/application/use-cases/remove-phone.use-case";
import { RequestAccountDeletionUseCase } from "@/modules/auth/identity/application/use-cases/request-account-deletion.use-case";
import { SetAdminUserStatusUseCase } from "@/modules/auth/identity/application/use-cases/set-admin-user-status.use-case";
import { UpdateAdminUserUseCase } from "@/modules/auth/identity/application/use-cases/update-admin-user.use-case";
import { UpdateOwnProfileUseCase } from "@/modules/auth/identity/application/use-cases/update-own-profile.use-case";
import { VerifyAddedEmailUseCase } from "@/modules/auth/identity/application/use-cases/verify-added-email.use-case";
import { AddEmailController } from "@/modules/auth/identity/presentation/http/controllers/add-email.controller";
import { AddPhoneController } from "@/modules/auth/identity/presentation/http/controllers/add-phone.controller";
import { CancelAccountDeletionController } from "@/modules/auth/identity/presentation/http/controllers/cancel-account-deletion.controller";
import { ChangeUsernameController } from "@/modules/auth/identity/presentation/http/controllers/change-username.controller";
import { CheckIdentifierController } from "@/modules/auth/identity/presentation/http/controllers/check-identifier.controller";
import { DeleteAdminUserController } from "@/modules/auth/identity/presentation/http/controllers/delete-admin-user.controller";
import { GetAdminUserController } from "@/modules/auth/identity/presentation/http/controllers/get-admin-user.controller";
import { GetMeController } from "@/modules/auth/identity/presentation/http/controllers/get-me.controller";
import { GetOwnProfileController } from "@/modules/auth/identity/presentation/http/controllers/get-own-profile.controller";
import { ListAdminUsersController } from "@/modules/auth/identity/presentation/http/controllers/list-admin-users.controller";
import { ListOwnIdentitiesController } from "@/modules/auth/identity/presentation/http/controllers/list-own-identities.controller";
import { RegisterController } from "@/modules/auth/identity/presentation/http/controllers/register.controller";
import { RemoveEmailController } from "@/modules/auth/identity/presentation/http/controllers/remove-email.controller";
import { RemovePhoneController } from "@/modules/auth/identity/presentation/http/controllers/remove-phone.controller";
import { RequestAccountDeletionController } from "@/modules/auth/identity/presentation/http/controllers/request-account-deletion.controller";
import { SetAdminUserStatusController } from "@/modules/auth/identity/presentation/http/controllers/set-admin-user-status.controller";
import { UpdateAdminUserController } from "@/modules/auth/identity/presentation/http/controllers/update-admin-user.controller";
import { UpdateOwnProfileController } from "@/modules/auth/identity/presentation/http/controllers/update-own-profile.controller";
import { VerifyAddedEmailController } from "@/modules/auth/identity/presentation/http/controllers/verify-added-email.controller";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import type { AuthEmailOptions } from "@/modules/auth/shared/application/types/auth-composition";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

export type CreateIdentityModuleOptions = {
  identityRepository: IIdentityRepository;
  credentialsRepository: ICredentialsRepository;
  sessionRepository: ISessionRepository;
  permissionRepository: IPermissionRepository;
  roleRepository: IRoleRepository;
  passwordHasher: IPasswordHasher;
  emailSender: IEmailSender;
  jobQueue: IJobQueue;
  emailOptions: AuthEmailOptions;
  accountDeletionGraceDays: number;
};

export type IdentityModule = {
  registerController: RegisterController;
  checkIdentifierController: CheckIdentifierController;
  getMeController: GetMeController;
  getOwnProfileController: GetOwnProfileController;
  updateOwnProfileController: UpdateOwnProfileController;
  listOwnIdentitiesController: ListOwnIdentitiesController;
  addEmailController: AddEmailController;
  verifyAddedEmailController: VerifyAddedEmailController;
  removeEmailController: RemoveEmailController;
  addPhoneController: AddPhoneController;
  removePhoneController: RemovePhoneController;
  requestAccountDeletionController: RequestAccountDeletionController;
  cancelAccountDeletionController: CancelAccountDeletionController;
  changeUsernameController: ChangeUsernameController;
  listAdminUsersController: ListAdminUsersController;
  getAdminUserController: GetAdminUserController;
  updateAdminUserController: UpdateAdminUserController;
  suspendAdminUserController: SetAdminUserStatusController;
  reactivateAdminUserController: SetAdminUserStatusController;
  disableAdminUserController: SetAdminUserStatusController;
  enableAdminUserController: SetAdminUserStatusController;
  deleteAdminUserController: DeleteAdminUserController;
};

export function createIdentityModule(options: CreateIdentityModuleOptions): IdentityModule {
  const { identityRepository, permissionRepository, roleRepository } = options;
  const setAdminUserStatusUseCase = new SetAdminUserStatusUseCase(
    identityRepository,
    permissionRepository,
    options.sessionRepository,
  );

  return {
    registerController: new RegisterController(
      new RegisterUseCase(
        identityRepository,
        options.passwordHasher,
        options.emailSender,
        options.emailOptions,
      ),
    ),
    checkIdentifierController: new CheckIdentifierController(
      new CheckIdentifierUseCase(identityRepository),
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
    addPhoneController: new AddPhoneController(new AddPhoneUseCase(identityRepository)),
    removePhoneController: new RemovePhoneController(new RemovePhoneUseCase(identityRepository)),
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
    listAdminUsersController: new ListAdminUsersController(
      new ListAdminUsersUseCase(identityRepository, permissionRepository),
    ),
    getAdminUserController: new GetAdminUserController(
      new GetAdminUserUseCase(identityRepository, permissionRepository, roleRepository),
    ),
    updateAdminUserController: new UpdateAdminUserController(
      new UpdateAdminUserUseCase(identityRepository, permissionRepository),
    ),
    suspendAdminUserController: new SetAdminUserStatusController(
      setAdminUserStatusUseCase,
      "suspend",
    ),
    reactivateAdminUserController: new SetAdminUserStatusController(
      setAdminUserStatusUseCase,
      "reactivate",
    ),
    disableAdminUserController: new SetAdminUserStatusController(
      setAdminUserStatusUseCase,
      "disable",
    ),
    enableAdminUserController: new SetAdminUserStatusController(
      setAdminUserStatusUseCase,
      "enable",
    ),
    deleteAdminUserController: new DeleteAdminUserController(
      new DeleteAdminUserUseCase(identityRepository, permissionRepository),
    ),
  };
}
