import { randomUUID } from "node:crypto";

import { User } from "@/modules/users/domain/entities/user.entity";
import { Email } from "@/modules/users/domain/value-objects/email.vo";

export interface CreateUserFactoryInput {
  name: string;
  email: string;
  passwordHash: string;
}

export class UserFactory {
  public static create(input: CreateUserFactoryInput): User {
    return User.create({
      id: randomUUID(),
      name: input.name,
      email: Email.create(input.email),
      passwordHash: input.passwordHash,
    });
  }
}
