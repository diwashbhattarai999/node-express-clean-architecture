import type { RequestHandler } from "express";

import { HealthService } from "@/infrastructure/health/health.service";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

const healthService = new HealthService();

export const healthController: RequestHandler = (_req, res) => {
  const result = healthService.getHealth();

  sendSuccess(res, result, "Service is healthy.", HttpStatus.OK);
};

export const readinessController: RequestHandler = (_req, res) => {
  const result = healthService.getReadiness();

  sendSuccess(res, result, "Service is ready.", HttpStatus.OK);
};
