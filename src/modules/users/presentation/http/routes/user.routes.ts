import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import {
  createUserSchema,
  deleteUserSchema,
  getUserByIdSchema,
  listUsersSchema,
  updateUserSchema,
} from "@/modules/users/presentation/http/validators";
import type { createUsersModule } from "@/modules/users/users.module";

export function createUsersRouter(usersModule: ReturnType<typeof createUsersModule>): IRouter {
  const router = Router();

  router.post("/", validate(createUserSchema), asHandler(usersModule.createUserController));

  router.get("/", validate(listUsersSchema), asHandler(usersModule.listUsersController));

  router.get("/:id", validate(getUserByIdSchema), asHandler(usersModule.getUserByIdController));

  router.patch("/:id", validate(updateUserSchema), asHandler(usersModule.updateUserController));

  router.delete("/:id", validate(deleteUserSchema), asHandler(usersModule.deleteUserController));

  return router;
}
