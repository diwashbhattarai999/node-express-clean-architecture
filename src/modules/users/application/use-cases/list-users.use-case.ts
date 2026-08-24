import type { ListUsersDto } from "@/modules/users/application/dto/list-users.dto";
import type { User } from "@/modules/users/domain/entities/user.entity";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import type { PaginatedResult } from "@/shared/kernal/pagination/paginated-result";

export class ListUsersUseCase {
  public constructor(private readonly userRepository: IUserRepository) {}

  public async execute(criteria: ListUsersDto): Promise<PaginatedResult<User>> {
    return this.userRepository.findMany(criteria);
  }
}
