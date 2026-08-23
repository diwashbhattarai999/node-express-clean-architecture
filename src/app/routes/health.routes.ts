import { type IRouter, Router } from "express";

import { healthController, readinessController } from "@/modules/health/health.controller";

const router: IRouter = Router();

router.get("/health", healthController);
router.get("/ready", readinessController);

export { router as healthRouter };
