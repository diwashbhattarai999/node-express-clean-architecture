import { z } from "zod";

import { EmailProvider } from "@/config/email-provider";
import { Environment } from "@/config/environment";
import { LogLevel } from "@/shared/logger/log-level";

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

export const envSchema = z
  .object({
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

    TRUST_PROXY: z
      .preprocess(
        (value) => {
          if (value === undefined || value === null || value === "") {
            return false;
          }

          if (typeof value === "boolean" || typeof value === "number") {
            return value;
          }

          if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();

            if (normalized === "true") {
              return true;
            }

            if (normalized === "false") {
              return false;
            }

            if (/^\d+$/.test(normalized)) {
              return Number(normalized);
            }
          }

          return value;
        },
        z.union([z.boolean(), z.number().int().nonnegative()]),
      )
      .default(false),

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

    COOKIES_SECRET: z
      .string("Cookies secret is required.")
      .min(32, "Cookies secret must be at least 32 characters long"),

    DATABASE_URL: z.url("Database URL is required."),

    REDIS_URL: z.url("Redis URL is required."),

    EMAIL_PROVIDER: z
      .enum(
        EmailProvider,
        `Invalid email provider. Must be one of: ${Object.values(EmailProvider).join(", ")}`,
      )
      .default(EmailProvider.NOOP),

    EMAIL_FROM: z.preprocess(
      emptyToUndefined,
      z.email("EMAIL_FROM must be a valid email.").optional(),
    ),

    EMAIL_FROM_NAME: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

    RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  })
  .superRefine((env, context) => {
    if (env.EMAIL_PROVIDER !== EmailProvider.RESEND) {
      return;
    }

    if (!env.EMAIL_FROM) {
      context.addIssue({
        code: "custom",
        path: ["EMAIL_FROM"],
        message: "EMAIL_FROM is required when EMAIL_PROVIDER is resend.",
      });
    }

    if (!env.RESEND_API_KEY) {
      context.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required when EMAIL_PROVIDER is resend.",
      });
    }
  });

export type TEnv = z.infer<typeof envSchema>;
