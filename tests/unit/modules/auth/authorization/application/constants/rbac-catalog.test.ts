import { describe, expect, it } from "vitest";

import {
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLES,
} from "@/modules/auth/authorization/application/constants/rbac-catalog";
import { PERMISSION_KEYS } from "@/modules/auth/authorization/application/constants/permission-keys";
import { RoleKey } from "@/modules/auth/authorization/application/constants/role-keys";

describe("RBAC catalog", () => {
  it("covers every normative permission key once", () => {
    expect(DEFAULT_PERMISSIONS.map((permission) => permission.key).sort()).toEqual(
      [...PERMISSION_KEYS].sort(),
    );
  });

  it("seeds member, admin, and superadmin", () => {
    expect(DEFAULT_ROLES.map((role) => role.key)).toEqual([
      RoleKey.MEMBER,
      RoleKey.ADMIN,
      RoleKey.SUPERADMIN,
    ]);
  });

  it("gives admin and superadmin the full catalog; member has none", () => {
    expect(DEFAULT_ROLE_PERMISSIONS[RoleKey.MEMBER]).toEqual([]);
    expect([...DEFAULT_ROLE_PERMISSIONS[RoleKey.ADMIN]].sort()).toEqual([...PERMISSION_KEYS].sort());
    expect([...DEFAULT_ROLE_PERMISSIONS[RoleKey.SUPERADMIN]].sort()).toEqual(
      [...PERMISSION_KEYS].sort(),
    );
  });
});
