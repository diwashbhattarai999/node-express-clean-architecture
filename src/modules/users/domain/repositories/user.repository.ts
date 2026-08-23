import type { User } from "@/modules/users/domain/entities/user.entity";
import type { Email } from "@/modules/users/domain/value-objects/email.vo";

export interface UserRepository {
  create(user: User): Promise<User>;

  findById(id: string): Promise<User | null>;

  findByEmail(email: Email): Promise<User | null>;
}
