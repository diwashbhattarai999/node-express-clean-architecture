import { type IRouter, Router } from "express";

import { env } from "@/config/env";
import { healthController, readinessController } from "@/modules/health/health.controller";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  sendSuccess(res, HttpStatus.OK, "API is running", {
    Environment: env.NODE_ENV,
  });
});
router.get("/health", healthController);
router.get("/ready", readinessController);

export { router as rootRouter };
