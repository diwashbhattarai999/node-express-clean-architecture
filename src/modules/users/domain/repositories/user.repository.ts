import type { User } from "@/modules/users/domain/entities/user.entity";
import type { Email } from "@/modules/users/domain/value-objects/email.vo";
import type { PaginatedResult } from "@/shared/kernal/pagination/paginated-result";
import type { Pagination } from "@/shared/kernal/pagination/pagination";
import type { Sort } from "@/shared/kernal/sorting/sorting";

export type UserSortField = "name" | "email" | "createdAt" | "updatedAt";

export interface FindUsersCriteria {
  pagination: Pagination;

  search?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;

  createdFrom?: Date | undefined;
  createdTo?: Date | undefined;

  sort: Sort<UserSortField>;
}

export interface UpdateUserData {
  name?: string | undefined;
  email?: string | undefined;
  passwordHash?: string | undefined;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findMany(criteria: FindUsersCriteria): Promise<PaginatedResult<User>>;
  create(user: User): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
