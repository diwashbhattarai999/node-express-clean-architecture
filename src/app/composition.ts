import { createUsersModule } from "@/modules/users/infrastructure/users.module";

export function createApplicationModules() {
  return {
    users: createUsersModule(),
  };
}
