import pino from "pino";

import { env } from "@/config/env";
import { Environment } from "@/config/environment";

const isDevelopment =
  process.env.NODE_ENV === Environment.LOCAL || process.env.NODE_ENV === Environment.DEVELOPMENT;

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
      "headers.authorization",
      "headers.cookie",
      "headers.Authorization",
      "headers.Cookie",
      "*.password",
      "*.passwordConfirmation",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.authorization",
      "*.cookie",
      "*.headers.authorization",
      "*.headers.cookie",
    ],
    censor: "[REDACTED]",
  },

  ...(isDevelopment
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
