import { type IRouter, Router } from "express";

import { createApplicationModules } from "@/app/composition";
import { createUsersRouter } from "@/modules/users/presentation/routes/user.routes";

const modules = createApplicationModules();

export const v1Router: IRouter = Router();

v1Router.use("/users", createUsersRouter(modules.users));
