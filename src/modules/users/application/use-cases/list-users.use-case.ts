import type { ListUsersDto } from "@/modules/users/application/dto/list-users.dto";
import type { UserRepository } from "@/modules/users/application/repositories/user.repository";
import type { User } from "@/modules/users/domain/entities/user.entity";
import type { PaginatedResult } from "@/shared/http/pagination";

export class ListUsersUseCase {
  public constructor(private readonly userRepository: UserRepository) {}

  public async execute(criteria: ListUsersDto): Promise<PaginatedResult<User>> {
    return this.userRepository.findMany(criteria);
  }
}
