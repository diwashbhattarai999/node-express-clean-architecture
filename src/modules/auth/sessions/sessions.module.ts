import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { GetSessionUseCase } from "@/modules/auth/sessions/application/use-cases/get-session.use-case";
import { ListSessionsUseCase } from "@/modules/auth/sessions/application/use-cases/list-sessions.use-case";
import { LogoutUseCase } from "@/modules/auth/sessions/application/use-cases/logout.use-case";
import { LogoutAllUseCase } from "@/modules/auth/sessions/application/use-cases/logout-all.use-case";
import { RefreshUseCase } from "@/modules/auth/sessions/application/use-cases/refresh.use-case";
import { RevokeOtherSessionsUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-other-sessions.use-case";
import { RevokeSessionUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-session.use-case";
import { GetSessionController } from "@/modules/auth/sessions/presentation/http/controllers/get-session.controller";
import { ListSessionsController } from "@/modules/auth/sessions/presentation/http/controllers/list-sessions.controller";
import { LogoutController } from "@/modules/auth/sessions/presentation/http/controllers/logout.controller";
import { LogoutAllController } from "@/modules/auth/sessions/presentation/http/controllers/logout-all.controller";
import { RefreshController } from "@/modules/auth/sessions/presentation/http/controllers/refresh.controller";
import { RevokeOtherSessionsController } from "@/modules/auth/sessions/presentation/http/controllers/revoke-other-sessions.controller";
import { RevokeSessionController } from "@/modules/auth/sessions/presentation/http/controllers/revoke-session.controller";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type {
  AuthCookieOptions,
  AuthSessionOptions,
} from "@/modules/auth/shared/application/types/auth-composition";

export type CreateSessionsModuleOptions = {
  sessionRepository: ISessionRepository;
  accessTokenSigner: IAccessTokenSigner;
  sessionOptions: AuthSessionOptions;
  cookieOptions: AuthCookieOptions;
};

export type SessionsModule = {
  refreshController: RefreshController;
  logoutController: LogoutController;
  logoutAllController: LogoutAllController;
  listSessionsController: ListSessionsController;
  getSessionController: GetSessionController;
  revokeSessionController: RevokeSessionController;
  revokeOtherSessionsController: RevokeOtherSessionsController;
};

export function createSessionsModule(options: CreateSessionsModuleOptions): SessionsModule {
  return {
    refreshController: new RefreshController(
      new RefreshUseCase(
        options.sessionRepository,
        options.accessTokenSigner,
        options.sessionOptions,
      ),
      options.cookieOptions,
    ),
    logoutController: new LogoutController(new LogoutUseCase(options.sessionRepository), {
      secureCookies: options.cookieOptions.secureCookies,
    }),
    logoutAllController: new LogoutAllController(new LogoutAllUseCase(options.sessionRepository), {
      secureCookies: options.cookieOptions.secureCookies,
    }),
    listSessionsController: new ListSessionsController(
      new ListSessionsUseCase(options.sessionRepository),
    ),
    getSessionController: new GetSessionController(
      new GetSessionUseCase(options.sessionRepository),
    ),
    revokeSessionController: new RevokeSessionController(
      new RevokeSessionUseCase(options.sessionRepository),
      {
        secureCookies: options.cookieOptions.secureCookies,
      },
    ),
    revokeOtherSessionsController: new RevokeOtherSessionsController(
      new RevokeOtherSessionsUseCase(options.sessionRepository),
    ),
  };
}
