import { UserNotFoundError } from "@/modules/users/application/errors/user-not-found.error";
import type { UserRepository } from "@/modules/users/application/repositories/user.repository";

export class DeleteUserUseCase {
  public constructor(private readonly userRepository: UserRepository) {}

  public async execute(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);

    if (!deleted) {
      throw new UserNotFoundError();
    }
  }
}
