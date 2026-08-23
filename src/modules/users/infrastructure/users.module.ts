import { CreateUserUseCase } from "@/modules/users/application/use-cases/create-user.use-case";
import { PostgresUserRepository } from "@/modules/users/infrastructure/repositories/postgres-user.repository";
import { Argon2PasswordHasher } from "@/modules/users/infrastructure/security/argon2-password-hasher";

export function createUsersModule() {
  const userRepository = new PostgresUserRepository();
  const passwordHasher = new Argon2PasswordHasher();

  return {
    createUserUseCase: new CreateUserUseCase(userRepository, passwordHasher),
  };
}
