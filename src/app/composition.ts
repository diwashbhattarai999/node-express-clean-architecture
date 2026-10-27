import { env } from "@/config/env";
import { createEmailSender } from "@/infrastructure/email";
import { createUsersModule } from "@/modules/users/users.module";

export function createApplicationModules() {
  const emailSender = createEmailSender(env);

  return {
    emailSender,
    users: createUsersModule(),
  };
}
