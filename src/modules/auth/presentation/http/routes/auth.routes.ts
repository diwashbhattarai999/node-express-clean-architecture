import { type IRouter, Router } from "express";

import type { AuthModule } from "@/modules/auth/auth.module";
import { createCredentialsRouter } from "@/modules/auth/credentials/presentation/http/routes/credentials.routes";
import { createIdentityRouter } from "@/modules/auth/identity/presentation/http/routes/identity.routes";
import { createSessionsRouter } from "@/modules/auth/sessions/presentation/http/routes/sessions.routes";
import { createVerificationRouter } from "@/modules/auth/verification/presentation/http/routes/verification.routes";

export function createAuthRouter(authModule: AuthModule): IRouter {
  const router = Router();

  router.use(createIdentityRouter(authModule));
  router.use(createCredentialsRouter(authModule));
  router.use(createVerificationRouter(authModule));
  router.use(createSessionsRouter(authModule));

  return router;
}
