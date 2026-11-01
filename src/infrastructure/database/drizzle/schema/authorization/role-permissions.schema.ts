import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "../users.schema";
import { permissions } from "./permissions.schema";
import { roles } from "./roles.schema";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export type RolePermissionRecord = typeof rolePermissions.$inferSelect;
export type NewRolePermissionRecord = typeof rolePermissions.$inferInsert;
