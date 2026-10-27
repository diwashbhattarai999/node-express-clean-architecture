import { env } from "@/config/env";
import { createEmailSender } from "@/infrastructure/email";
import { createHttpClient } from "@/infrastructure/http-client";
import { createObjectStorage } from "@/infrastructure/storage";
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
    uploads: createUploadsModule({ objectStorage }),
  };
}
