import pino from "pino";

import { env } from "@/config/env";
import { Environment } from "@/shared/constants/environment";

export const logger = pino({
  level: env.LOG_LEVEL,

  redact: {
    paths: [
      "password",
      "passwordConfirmation",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",
      "*.password",
      "*.passwordConfirmation",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.authorization",
      "*.cookie",
    ],
    censor: "[REDACTED]",
  },

  ...(env.NODE_ENV === Environment.LOCAL
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            singleLine: false,
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});
