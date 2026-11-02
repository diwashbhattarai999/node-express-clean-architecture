import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { PasskeysModule } from "@/modules/auth/passkeys/passkeys.module";
import { beginPasskeyLoginSchema } from "@/modules/auth/passkeys/presentation/http/validators/begin-passkey-login.validator";
import { verifyPasskeyLoginSchema } from "@/modules/auth/passkeys/presentation/http/validators/verify-passkey-login.validator";

export function createPasskeysRouter(
  authModule: Pick<PasskeysModule, "beginPasskeyLoginController" | "verifyPasskeyLoginController">,
): IRouter {
  const router = Router();

  router.post(
    "/passkeys/login/verify",
    validate(verifyPasskeyLoginSchema),
    asHandler(authModule.verifyPasskeyLoginController),
  );
  router.post(
    "/passkeys/login/options",
    validate(beginPasskeyLoginSchema),
    asHandler(authModule.beginPasskeyLoginController),
  );

  return router;
}
