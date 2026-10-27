import argon2 from "argon2";

import type { IPasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";

/** Argon2id password hasher for the auth module (AUTH.md). */
export class Argon2PasswordHasher implements IPasswordHasher {
  public async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
    });
  }

  public async compare(password: string, passwordHash: string): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }
}
