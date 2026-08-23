import type { RequestHandler } from "express";

import { HealthService } from "@/modules/health/health.service";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

const healthService = new HealthService();

export const healthController: RequestHandler = (_req, res) => {
  const result = healthService.getHealth();

  sendSuccess(res, HttpStatus.OK, "Service is healthy.", result);
};

export const readinessController: RequestHandler = async (_req, res) => {
  const result = await healthService.getReadiness();

  if (result.status === "ok") {
    sendSuccess(res, HttpStatus.OK, "Service is ready.", result);

    return;
  }

  sendSuccess(res, HttpStatus.SERVICE_UNAVAILABLE, "Service is not ready.", result);
};
