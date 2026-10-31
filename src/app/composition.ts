import { env } from "@/config/env";
import { createEmailSender } from "@/infrastructure/email";
import { createHttpClient } from "@/infrastructure/http-client";
import { createJobQueue } from "@/infrastructure/jobs";
import { createObjectStorage } from "@/infrastructure/storage";
import { createAuthModule } from "@/modules/auth/auth.module";
import { Argon2PasswordHasher } from "@/modules/auth/shared/infrastructure/security/argon2-password-hasher";
import { createUploadsModule } from "@/modules/uploads/uploads.module";

export function createApplicationModules() {
  const emailSender = createEmailSender(env);
  const objectStorage = createObjectStorage(env);
  const httpClient = createHttpClient(env);
  const jobQueue = createJobQueue(env);

  return {
    emailSender,
    objectStorage,
    httpClient,
    jobQueue,
    auth: createAuthModule({
      emailSender,
      passwordHasher: new Argon2PasswordHasher(),
      jobQueue,
      env,
    }),
    uploads: createUploadsModule({ objectStorage }),
  };
}
