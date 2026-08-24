import { UserNotFoundError } from "@/modules/users/application/errors/user-not-found.error";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";

export class DeleteUserUseCase {
  public constructor(private readonly userRepository: IUserRepository) {}

  public async execute(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);

    if (!deleted) {
      throw new UserNotFoundError();
    }
  }
}
