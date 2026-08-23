import { CreateUserUseCase } from "@/modules/users/application/use-cases/create-user.use-case";
import { DeleteUserUseCase } from "@/modules/users/application/use-cases/delete-user.use-case";
import { GetUserByIdUseCase } from "@/modules/users/application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "@/modules/users/application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "@/modules/users/application/use-cases/update-user.use-case";
import { PostgresUserRepository } from "@/modules/users/infrastructure/repositories/postgres-user.repository";
import { Argon2PasswordHasher } from "@/modules/users/infrastructure/security/argon2-password-hasher";
import { CreateUserController } from "@/modules/users/presentation/http/controllers/create-user.controller";
import { DeleteUserController } from "@/modules/users/presentation/http/controllers/delete-user.controller";
import { GetUserByIdController } from "@/modules/users/presentation/http/controllers/get-user-by-id.controller";
import { ListUsersController } from "@/modules/users/presentation/http/controllers/list-users.controller";
import { UpdateUserController } from "@/modules/users/presentation/http/controllers/update-user.controller";

export function createUsersModule() {
  const userRepository = new PostgresUserRepository();
  const passwordHasher = new Argon2PasswordHasher();

  const createUserUseCase = new CreateUserUseCase(userRepository, passwordHasher);
  const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository, passwordHasher);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);

  return {
    createUserController: new CreateUserController(createUserUseCase),
    getUserByIdController: new GetUserByIdController(getUserByIdUseCase),
    listUsersController: new ListUsersController(listUsersUseCase),
    updateUserController: new UpdateUserController(updateUserUseCase),
    deleteUserController: new DeleteUserController(deleteUserUseCase),
  };
}
