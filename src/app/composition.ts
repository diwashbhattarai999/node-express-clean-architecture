import { createUsersModule } from "@/modules/users/users.module";

export function createApplicationModules() {
  return {
    users: createUsersModule(),
  };
}
