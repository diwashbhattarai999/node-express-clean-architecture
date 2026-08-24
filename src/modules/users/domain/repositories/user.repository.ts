import type { User } from "@/modules/users/domain/entities/user.entity";
import type { Email } from "@/modules/users/domain/value-objects/email.vo";
import type { PaginatedResult } from "@/shared/kernel/pagination/paginated-result";
import type { SortOrder } from "@/shared/kernel/sorting/sorting";

export type UserSortField = "name" | "email" | "createdAt" | "updatedAt";

export interface FindUsersCriteria {
  page: number;
  limit: number;
  sortBy: UserSortField;
  sortOrder: SortOrder;
  search?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  createdFrom?: Date | undefined;
  createdTo?: Date | undefined;
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
