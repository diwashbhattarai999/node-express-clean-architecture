import { describe, expect, it, vi } from "vitest";

import { seedSuperadmin, toSeedSuperadminInput } from "@/infrastructure/database/seed/seed-superadmin";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";

describe("toSeedSuperadminInput", () => {
  it("skips when email and password are omitted", () => {
    expect(toSeedSuperadminInput({})).toBeNull();
  });

  it("requires email and password together", () => {
    expect(() => toSeedSuperadminInput({ email: "superadmin@example.com" })).toThrow(
      "SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD must be set together.",
    );
    expect(() => toSeedSuperadminInput({ password: "ChangeMe@1234" })).toThrow(
      "SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD must be set together.",
    );
  });

  it("rejects a password that fails the policy before hashing", async () => {
    const hasher: IPasswordHasher = { hash: vi.fn(), compare: vi.fn() };

    await expect(
      seedSuperadmin({ email: "superadmin@example.com", password: "weak" }, hasher),
    ).rejects.toThrow(/Password must/);
    expect(hasher.hash).not.toHaveBeenCalled();
  });

  it("returns the seed payload when both credentials are present", () => {
    expect(
      toSeedSuperadminInput({
        email: "superadmin@example.com",
        password: "ChangeMe@1234",
        displayName: "Root",
      }),
    ).toEqual({
      email: "superadmin@example.com",
      password: "ChangeMe@1234",
      displayName: "Root",
    });
  });
});
