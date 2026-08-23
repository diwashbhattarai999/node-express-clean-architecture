import { z } from "zod";

import { Environment } from "@/shared/constants/environment";
import { LogLevel } from "@/shared/constants/log-level";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(
      Environment,
      `Invalid environment. Must be one of: ${Object.values(Environment).join(", ")}`,
    )
    .default(Environment.DEVELOPMENT),

  PORT: z.coerce
    .number("Port is required.")
    .int("Port must be an integer")
    .positive("Port must be a positive number")
    .default(3000),

  HOST: z.string("Host is required.").default("0.0.0.0"),

  BASE_URL: z.url("Base URL is required."),

  CORS_ORIGINS: z
    .string("CORS Origins is required.")
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url())),

  LOG_LEVEL: z
    .enum(LogLevel, `Invalid log level. Must be one of: ${Object.values(LogLevel).join(", ")}`)
    .default(LogLevel.DEBUG),

  TRUST_PROXY: z.enum(["true", "false"]).transform((value) => value === "true"),

  RATE_LIMIT_WINDOW_MS: z.coerce
    .number("Rate limit window is required.")
    .int("Rate limit window must be an integer")
    .positive("Rate limit window must be a positive number")
    .default(60000),

  RATE_LIMIT_MAX_REQUESTS: z.coerce
    .number("Rate limit max requests is required.")
    .int("Rate limit max requests must be an integer")
    .positive("Rate limit max requests must be a positive number")
    .default(100),
});

export type TEnv = z.infer<typeof envSchema>;
