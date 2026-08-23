import argon2 from "argon2";

import type { PasswordHasher } from "@/modules/users/application/services/password-hasher";

export class Argon2PasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
    });
  }

  public async compare(password: string, passwordHash: string): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }
}
