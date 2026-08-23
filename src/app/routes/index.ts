import { type IRouter, Router } from "express";

import { v1Router } from "@/app/routes/v1";

export const apiRouter: IRouter = Router();

apiRouter.use("/v1", v1Router);
