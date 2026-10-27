import { type IRouter, Router } from "express";

import { createApplicationModules } from "@/app/composition";
import { createAuthRouter } from "@/modules/auth/presentation/http/routes/auth.routes";
import { createUploadsRouter } from "@/modules/uploads/presentation/http/routes/upload.routes";
import { createUsersRouter } from "@/modules/users/presentation/http/routes/user.routes";

const modules = createApplicationModules();

export const v1Router: IRouter = Router();

v1Router.use("/auth", createAuthRouter(modules.auth));
v1Router.use("/users", createUsersRouter(modules.users));
v1Router.use("/uploads", createUploadsRouter(modules.uploads));
