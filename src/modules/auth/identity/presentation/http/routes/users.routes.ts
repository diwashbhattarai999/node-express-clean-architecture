import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { AuditModule } from "@/modules/auth/audit/audit.module";
import { listOwnSecurityEventsSchema } from "@/modules/auth/audit/presentation/http/validators/list-own-security-events.validator";
import type { IdentityModule } from "@/modules/auth/identity/identity.module";
import { addEmailSchema } from "@/modules/auth/identity/presentation/http/validators/add-email.validator";
import { addPhoneSchema } from "@/modules/auth/identity/presentation/http/validators/add-phone.validator";
import { changeUsernameSchema } from "@/modules/auth/identity/presentation/http/validators/change-username.validator";
import { removeEmailSchema } from "@/modules/auth/identity/presentation/http/validators/remove-email.validator";
import { removePhoneSchema } from "@/modules/auth/identity/presentation/http/validators/remove-phone.validator";
import { requestAccountDeletionSchema } from "@/modules/auth/identity/presentation/http/validators/request-account-deletion.validator";
import { updateOwnProfileSchema } from "@/modules/auth/identity/presentation/http/validators/update-own-profile.validator";
import { verifyAddedEmailSchema } from "@/modules/auth/identity/presentation/http/validators/verify-added-email.validator";
import type { MfaModule } from "@/modules/auth/mfa/mfa.module";
import { createMfaUserRouter } from "@/modules/auth/mfa/presentation/http/routes/mfa-user.routes";
import type { OAuthModule } from "@/modules/auth/oauth/oauth.module";
import { linkOAuthAccountSchema } from "@/modules/auth/oauth/presentation/http/validators/link-oauth-account.validator";
import { startOAuthAuthorizationSchema } from "@/modules/auth/oauth/presentation/http/validators/start-oauth-authorization.validator";
import { unlinkOAuthAccountSchema } from "@/modules/auth/oauth/presentation/http/validators/unlink-oauth-account.validator";
import type { PasskeysModule } from "@/modules/auth/passkeys/passkeys.module";
import { createPasskeysUserRouter } from "@/modules/auth/passkeys/presentation/http/routes/passkeys-user.routes";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";

/**
 * HTTP mount for `/api/v1/users`.
 * Self-service `/me` routes are implemented in auth/identity (login identities)
 * and auth/oauth (linked accounts); mount them here so v1 only wires module roots.
 */
export function createUsersRouter(
  authModule: IdentityModule &
    Pick<AuditModule, "listOwnSecurityEventsController"> &
    Pick<
      MfaModule,
      | "getMfaStatusController"
      | "beginMfaEnrollController"
      | "confirmMfaEnrollController"
      | "disableMfaController"
      | "regenerateMfaRecoveryCodesController"
    > &
    Pick<
      PasskeysModule,
      | "listPasskeysController"
      | "beginPasskeyRegisterController"
      | "verifyPasskeyRegisterController"
      | "renamePasskeyController"
      | "deletePasskeyController"
    > &
    Pick<
      OAuthModule,
      | "listOwnOAuthAccountsController"
      | "startOAuthLinkAuthorizationController"
      | "linkOAuthAccountController"
      | "unlinkOAuthAccountController"
    > &
    Pick<AuthHttpGuards, "requireBearerAuth" | "optionalBearerAuth">,
): IRouter {
  const router = Router();

  router.use(createMfaUserRouter(authModule));
  router.use(createPasskeysUserRouter(authModule));

  router.get(
    "/me/security-events",
    validate(listOwnSecurityEventsSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.listOwnSecurityEventsController),
  );

  router.get(
    "/me/identities",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.listOwnIdentitiesController),
  );

  router.get(
    "/me/oauth-accounts/:provider/authorize",
    validate(startOAuthAuthorizationSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.startOAuthLinkAuthorizationController),
  );

  router.post(
    "/me/oauth-accounts/:provider/link",
    validate(linkOAuthAccountSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.linkOAuthAccountController),
  );

  router.delete(
    "/me/oauth-accounts/:provider",
    validate(unlinkOAuthAccountSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.unlinkOAuthAccountController),
  );

  router.get(
    "/me/oauth-accounts",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.listOwnOAuthAccountsController),
  );

  router.post(
    "/me/emails/verify",
    validate(verifyAddedEmailSchema),
    authModule.optionalBearerAuth,
    asHandler(authModule.verifyAddedEmailController),
  );

  router.post(
    "/me/emails",
    validate(addEmailSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.addEmailController),
  );

  router.delete(
    "/me/emails/:identityId",
    validate(removeEmailSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.removeEmailController),
  );

  router.post(
    "/me/phones",
    validate(addPhoneSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.addPhoneController),
  );

  router.delete(
    "/me/phones/:identityId",
    validate(removePhoneSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.removePhoneController),
  );

  router.post(
    "/me/deletion-request/cancel",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.cancelAccountDeletionController),
  );

  router.post(
    "/me/deletion-request",
    validate(requestAccountDeletionSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.requestAccountDeletionController),
  );

  router.get(
    "/me",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.getOwnProfileController),
  );

  router.patch(
    "/me/username",
    validate(changeUsernameSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.changeUsernameController),
  );

  router.patch(
    "/me",
    validate(updateOwnProfileSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.updateOwnProfileController),
  );

  return router;
}
