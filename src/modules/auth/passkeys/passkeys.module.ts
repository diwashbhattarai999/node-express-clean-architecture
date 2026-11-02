import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { IWebAuthnService } from "@/modules/auth/passkeys/application/ports/webauthn.service";
import { BeginPasskeyLoginUseCase } from "@/modules/auth/passkeys/application/use-cases/begin-passkey-login.use-case";
import { BeginPasskeyRegisterUseCase } from "@/modules/auth/passkeys/application/use-cases/begin-passkey-register.use-case";
import { DeletePasskeyUseCase } from "@/modules/auth/passkeys/application/use-cases/delete-passkey.use-case";
import { ListPasskeysUseCase } from "@/modules/auth/passkeys/application/use-cases/list-passkeys.use-case";
import { RenamePasskeyUseCase } from "@/modules/auth/passkeys/application/use-cases/rename-passkey.use-case";
import { VerifyPasskeyLoginUseCase } from "@/modules/auth/passkeys/application/use-cases/verify-passkey-login.use-case";
import { VerifyPasskeyRegisterUseCase } from "@/modules/auth/passkeys/application/use-cases/verify-passkey-register.use-case";
import { BeginPasskeyLoginController } from "@/modules/auth/passkeys/presentation/http/controllers/begin-passkey-login.controller";
import { BeginPasskeyRegisterController } from "@/modules/auth/passkeys/presentation/http/controllers/begin-passkey-register.controller";
import { DeletePasskeyController } from "@/modules/auth/passkeys/presentation/http/controllers/delete-passkey.controller";
import { ListPasskeysController } from "@/modules/auth/passkeys/presentation/http/controllers/list-passkeys.controller";
import { RenamePasskeyController } from "@/modules/auth/passkeys/presentation/http/controllers/rename-passkey.controller";
import { VerifyPasskeyLoginController } from "@/modules/auth/passkeys/presentation/http/controllers/verify-passkey-login.controller";
import { VerifyPasskeyRegisterController } from "@/modules/auth/passkeys/presentation/http/controllers/verify-passkey-register.controller";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type {
  AuthCookieOptions,
  AuthSessionOptions,
} from "@/modules/auth/shared/application/types/auth-composition";

export type CreatePasskeysModuleOptions = {
  passkeyRepository: IPasskeyRepository;
  identityRepository: Pick<IIdentityRepository, "findIdentityByNormalized">;
  sessionRepository: ISessionRepository;
  accessTokenSigner: IAccessTokenSigner;
  webAuthnService: IWebAuthnService;
  sessionOptions: AuthSessionOptions;
  cookieOptions: AuthCookieOptions;
};

export type PasskeysModule = {
  listPasskeysController: ListPasskeysController;
  beginPasskeyRegisterController: BeginPasskeyRegisterController;
  verifyPasskeyRegisterController: VerifyPasskeyRegisterController;
  beginPasskeyLoginController: BeginPasskeyLoginController;
  verifyPasskeyLoginController: VerifyPasskeyLoginController;
  renamePasskeyController: RenamePasskeyController;
  deletePasskeyController: DeletePasskeyController;
};

export function createPasskeysModule(options: CreatePasskeysModuleOptions): PasskeysModule {
  return {
    listPasskeysController: new ListPasskeysController(
      new ListPasskeysUseCase(options.passkeyRepository),
    ),
    beginPasskeyRegisterController: new BeginPasskeyRegisterController(
      new BeginPasskeyRegisterUseCase(options.passkeyRepository, options.webAuthnService),
    ),
    verifyPasskeyRegisterController: new VerifyPasskeyRegisterController(
      new VerifyPasskeyRegisterUseCase(options.passkeyRepository, options.webAuthnService),
    ),
    beginPasskeyLoginController: new BeginPasskeyLoginController(
      new BeginPasskeyLoginUseCase(
        options.passkeyRepository,
        options.identityRepository,
        options.webAuthnService,
      ),
    ),
    verifyPasskeyLoginController: new VerifyPasskeyLoginController(
      new VerifyPasskeyLoginUseCase(
        options.passkeyRepository,
        options.sessionRepository,
        options.accessTokenSigner,
        options.webAuthnService,
        options.sessionOptions,
      ),
      options.cookieOptions,
    ),
    renamePasskeyController: new RenamePasskeyController(
      new RenamePasskeyUseCase(options.passkeyRepository),
    ),
    deletePasskeyController: new DeletePasskeyController(
      new DeletePasskeyUseCase(options.passkeyRepository),
    ),
  };
}
