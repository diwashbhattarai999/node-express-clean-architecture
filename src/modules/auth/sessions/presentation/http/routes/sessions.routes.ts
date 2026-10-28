import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { AuthModule } from "@/modules/auth/auth.module";
import { listSessionsSchema } from "@/modules/auth/sessions/presentation/http/validators/list-sessions.validator";
import { logoutSchema } from "@/modules/auth/sessions/presentation/http/validators/logout.validator";
import { refreshSchema } from "@/modules/auth/sessions/presentation/http/validators/refresh.validator";

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

  return router;
}
