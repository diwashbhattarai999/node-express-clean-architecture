import type { User } from "@/modules/users/domain/entities/user.entity";

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.getId(),
    name: user.getName(),
    email: user.getEmail().getValue(),
    createdAt: user.getCreatedAt().toISOString(),
    updatedAt: user.getUpdatedAt().toISOString(),
  };
}

export function toUserResponseList(users: User[]): UserResponse[] {
  return users.map(toUserResponse);
}
