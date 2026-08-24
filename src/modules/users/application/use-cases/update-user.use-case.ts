import type { UpdateUserDto } from "@/modules/users/application/dto/update-user.dto";
import { UserEmailAlreadyExistsError } from "@/modules/users/application/errors/user-email-already-exists.error";
import { UserNotFoundError } from "@/modules/users/application/errors/user-not-found.error";
import type { IPasswordHasher } from "@/modules/users/application/ports/password-hasher";
import type { User } from "@/modules/users/domain/entities/user.entity";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import { Email } from "@/modules/users/domain/value-objects/email.vo";

export class UpdateUserUseCase {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  public async execute(id: string, dto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new UserNotFoundError();
    }

    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
    } = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.email !== undefined) {
      const email = Email.create(dto.email);

      if (!email.equals(existingUser.getEmail())) {
        const userWithEmail = await this.userRepository.findByEmail(email);

        if (userWithEmail) {
          throw new UserEmailAlreadyExistsError();
        }
      }

      updateData.email = email.getValue();
    }

    if (dto.password !== undefined) {
      updateData.passwordHash = await this.passwordHasher.hash(dto.password);
    }

    const updatedUser = await this.userRepository.update(id, updateData);

    if (!updatedUser) {
      throw new UserNotFoundError();
    }

    return updatedUser;
  }
}
