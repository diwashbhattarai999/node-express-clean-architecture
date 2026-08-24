import type { CreateUserDto } from "@/modules/users/application/dto/create-user.dto";
import { UserEmailAlreadyExistsError } from "@/modules/users/application/errors/user-email-already-exists.error";
import type { IPasswordHasher } from "@/modules/users/application/ports/password-hasher";
import type { User } from "@/modules/users/domain/entities/user.entity";
import { UserFactory } from "@/modules/users/domain/factories/user.factory";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import { Email } from "@/modules/users/domain/value-objects/email.vo";

export class CreateUserUseCase {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  public async execute(dto: CreateUserDto): Promise<User> {
    const email = Email.create(dto.email);

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new UserEmailAlreadyExistsError();
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const user = UserFactory.create({
      name: dto.name,
      email: email.getValue(),
      passwordHash,
    });

    return this.userRepository.create(user);
  }
}
