import { type IRouter, Router } from "express";

import type { ApplicationModules } from "@/app/composition";
import { createV1Router } from "@/app/routes/v1";

export function createApiRouter(modules: ApplicationModules): IRouter {
  const apiRouter: IRouter = Router();

  apiRouter.use("/v1", createV1Router(modules));

  return apiRouter;
}
