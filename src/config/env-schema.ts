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
});

export type TEnv = z.infer<typeof envSchema>;
