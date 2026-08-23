import type { ListUsersDto } from "@/modules/users/application/dto/list-users.dto";
import type { User } from "@/modules/users/domain/entities/user.entity";
import type { Email } from "@/modules/users/domain/value-objects/email.vo";
import type { PaginatedResult } from "@/shared/http/pagination";

export interface UpdateUserData {
  name?: string;
  email?: string;
  passwordHash?: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findMany(criteria: ListUsersDto): Promise<PaginatedResult<User>>;
  create(user: User): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
