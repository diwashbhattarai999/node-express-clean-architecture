import { env } from "@/config/env";
import { createEmailSender } from "@/infrastructure/email";
import { createHttpClient } from "@/infrastructure/http-client";
import { createObjectStorage } from "@/infrastructure/storage";
import { createAuthModule } from "@/modules/auth/auth.module";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/security/argon2-password-hasher";
import { createUploadsModule } from "@/modules/uploads/uploads.module";
import { createUsersModule } from "@/modules/users/users.module";

export function createApplicationModules() {
  const emailSender = createEmailSender(env);
  const objectStorage = createObjectStorage(env);
  const httpClient = createHttpClient(env);

  return {
    emailSender,
    objectStorage,
    httpClient,
    users: createUsersModule(),
    auth: createAuthModule({
      emailSender,
      passwordHasher: new Argon2PasswordHasher(),
      env,
    }),
    uploads: createUploadsModule({ objectStorage }),
  };
}
