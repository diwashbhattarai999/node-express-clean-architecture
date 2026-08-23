import { UserNotFoundError } from "@/modules/users/application/errors/user-not-found.error";
import type { UserRepository } from "@/modules/users/application/repositories/user.repository";
import type { User } from "@/modules/users/domain/entities/user.entity";

export class GetUserByIdUseCase {
  public constructor(private readonly userRepository: UserRepository) {}

  public async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }
}
