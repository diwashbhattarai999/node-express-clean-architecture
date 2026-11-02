import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { MfaModule } from "@/modules/auth/mfa/mfa.module";
import { beginMfaEnrollSchema } from "@/modules/auth/mfa/presentation/http/validators/begin-mfa-enroll.validator";
import { confirmMfaEnrollSchema } from "@/modules/auth/mfa/presentation/http/validators/confirm-mfa-enroll.validator";
import { disableMfaSchema } from "@/modules/auth/mfa/presentation/http/validators/disable-mfa.validator";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";

export function createMfaUserRouter(
  authModule: Pick<
    MfaModule,
    | "getMfaStatusController"
    | "beginMfaEnrollController"
    | "confirmMfaEnrollController"
    | "disableMfaController"
    | "regenerateMfaRecoveryCodesController"
  > &
    Pick<AuthHttpGuards, "requireBearerAuth"> & {
      requireStepUp: AuthHttpGuards["requireBearerAuth"];
    },
): IRouter {
  const router = Router();

  router.get(
    "/me/mfa",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.getMfaStatusController),
  );
  router.post(
    "/me/mfa/enroll/confirm",
    validate(confirmMfaEnrollSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.confirmMfaEnrollController),
  );
  router.post(
    "/me/mfa/enroll",
    validate(beginMfaEnrollSchema),
    authModule.requireBearerAuth,
    authModule.requireStepUp,
    asHandler(authModule.beginMfaEnrollController),
  );
  router.post(
    "/me/mfa/recovery-codes/regenerate",
    authModule.requireBearerAuth,
    authModule.requireStepUp,
    asRequestHandler(authModule.regenerateMfaRecoveryCodesController),
  );
  router.delete(
    "/me/mfa",
    validate(disableMfaSchema),
    authModule.requireBearerAuth,
    authModule.requireStepUp,
    asHandler(authModule.disableMfaController),
  );

  return router;
}
