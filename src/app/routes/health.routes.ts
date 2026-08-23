import { type IRouter, Router } from "express";

import { sendSuccess } from "@/shared/http/send-response";

const router: IRouter = Router();

router.get("/health", (_req, res) => {
  sendSuccess(res, {
    status: "ok",
  });
});

export { router as healthRouter };
