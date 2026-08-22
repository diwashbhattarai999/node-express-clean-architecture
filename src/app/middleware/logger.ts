import pinoHttp from "pino-http";

import { logger } from "@/shared/logger/logger";

export const httpLoggerMiddleware = pinoHttp({
  logger,

  genReqId: (req) => req.requestId,

  customProps: (req) => ({
    requestId: req.requestId,
  }),

  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) {
      return "error";
    }

    if (res.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },

  customSuccessMessage: (req, res) => `${req.method} ${req.url} completed with ${res.statusCode}`,

  customErrorMessage: (req, res, error) =>
    `${req.method} ${req.url} failed with ${res.statusCode}: ${error.message}`,

  quietReqLogger: true,
});
