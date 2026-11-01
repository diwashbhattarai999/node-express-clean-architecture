import { type IRouter, Router } from "express";

import { createApplicationModules } from "@/app/composition";
import { createAdminRouter } from "@/modules/auth/authorization/presentation/http/routes/admin.routes";
import { createAuthorizationRouter } from "@/modules/auth/authorization/presentation/http/routes/authorization.routes";
import { createUsersRouter } from "@/modules/auth/identity/presentation/http/routes/users.routes";
import { createAuthRouter } from "@/modules/auth/presentation/http/routes/auth.routes";
import { createUploadsRouter } from "@/modules/uploads/presentation/http/routes/upload.routes";

const modules = createApplicationModules();

export const v1Router: IRouter = Router();

v1Router.use("/auth", createAuthRouter(modules.auth));
v1Router.use("/authz", createAuthorizationRouter(modules.auth));
v1Router.use("/admin", createAdminRouter(modules.auth));
v1Router.use("/users", createUsersRouter(modules.auth));
v1Router.use("/uploads", createUploadsRouter(modules.uploads));
