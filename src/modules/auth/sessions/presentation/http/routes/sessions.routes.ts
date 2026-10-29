import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { AuthModule } from "@/modules/auth/auth.module";
import { getSessionSchema } from "@/modules/auth/sessions/presentation/http/validators/get-session.validator";
import { listSessionsSchema } from "@/modules/auth/sessions/presentation/http/validators/list-sessions.validator";
import { logoutSchema } from "@/modules/auth/sessions/presentation/http/validators/logout.validator";
import { refreshSchema } from "@/modules/auth/sessions/presentation/http/validators/refresh.validator";
import { revokeSessionSchema } from "@/modules/auth/sessions/presentation/http/validators/revoke-session.validator";

export function createSessionsRouter(authModule: AuthModule): IRouter {
  const router = Router();

  router.post(
    "/refresh",
    validate(refreshSchema),
    authModule.requireRefreshAuth,
    asHandler(authModule.refreshController),
  );
  router.post(
    "/logout",
    validate(logoutSchema),
    authModule.requireRefreshOrBearerAuth,
    asHandler(authModule.logoutController),
  );
  router.post(
    "/logout-all",
    authModule.requireBearerAuth,
    authModule.assertCsrfWhenRefreshCookie,
    asRequestHandler(authModule.logoutAllController),
  );
  router.get(
    "/sessions",
    validate(listSessionsSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.listSessionsController),
  );
  router.post(
    "/sessions/revoke-others",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.revokeOtherSessionsController),
  );
  router.get(
    "/sessions/:sessionId",
    validate(getSessionSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.getSessionController),
  );
  router.delete(
    "/sessions/:sessionId",
    validate(revokeSessionSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.revokeSessionController),
  );

  return router;
}
