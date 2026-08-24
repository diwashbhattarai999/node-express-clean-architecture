import { UserNotFoundError } from "@/modules/users/application/errors/user-not-found.error";
import type { User } from "@/modules/users/domain/entities/user.entity";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";

export class GetUserByIdUseCase {
  public constructor(private readonly userRepository: IUserRepository) {}

  public async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }
}
