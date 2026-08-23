import type { SortOrder } from "@/shared/http/pagination";

export type UserSortField = "name" | "email" | "createdAt" | "updatedAt";

export interface ListUsersDto {
  page: number;
  limit: number;
  search?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  createdFrom?: Date | undefined;
  createdTo?: Date | undefined;
  sortBy: UserSortField;
  sortOrder: SortOrder;
}
