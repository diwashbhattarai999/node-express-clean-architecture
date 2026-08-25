export interface ListUsersDto {
  page: number;
  limit: number;
  sortBy: "name" | "email" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
  search?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  createdFrom?: Date | undefined;
  createdTo?: Date | undefined;
}
