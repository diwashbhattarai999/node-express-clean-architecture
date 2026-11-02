import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { PasskeysModule } from "@/modules/auth/passkeys/passkeys.module";
import { deletePasskeySchema } from "@/modules/auth/passkeys/presentation/http/validators/delete-passkey.validator";
import { renamePasskeySchema } from "@/modules/auth/passkeys/presentation/http/validators/rename-passkey.validator";
import { verifyPasskeyRegisterSchema } from "@/modules/auth/passkeys/presentation/http/validators/verify-passkey-register.validator";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";

export function createPasskeysUserRouter(
  authModule: Pick<
    PasskeysModule,
    | "listPasskeysController"
    | "beginPasskeyRegisterController"
    | "verifyPasskeyRegisterController"
    | "renamePasskeyController"
    | "deletePasskeyController"
  > &
    Pick<AuthHttpGuards, "requireBearerAuth"> & {
      requireStepUp: AuthHttpGuards["requireBearerAuth"];
    },
): IRouter {
  const router = Router();

  router.post(
    "/me/passkeys/register/verify",
    validate(verifyPasskeyRegisterSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.verifyPasskeyRegisterController),
  );
  router.post(
    "/me/passkeys/register/options",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.beginPasskeyRegisterController),
  );
  router.patch(
    "/me/passkeys/:passkeyId",
    validate(renamePasskeySchema),
    authModule.requireBearerAuth,
    asHandler(authModule.renamePasskeyController),
  );
  router.delete(
    "/me/passkeys/:passkeyId",
    validate(deletePasskeySchema),
    authModule.requireBearerAuth,
    authModule.requireStepUp,
    asHandler(authModule.deletePasskeyController),
  );
  router.get(
    "/me/passkeys",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.listPasskeysController),
  );

  return router;
}
