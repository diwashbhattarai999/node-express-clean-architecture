import { z } from "zod";

import { EmailProvider } from "@/config/email-provider";
import { Environment } from "@/config/environment";
import { StorageProvider } from "@/config/storage-provider";
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

    FRONTEND_BASE_URL: z.url("Frontend base URL is required."),

    APP_NAME: z.string("App name is required.").min(1).default("Node Express Clean Architecture"),

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

    STORAGE_PROVIDER: z
      .enum(
        StorageProvider,
        `Invalid storage provider. Must be one of: ${Object.values(StorageProvider).join(", ")}`,
      )
      .default(StorageProvider.LOCAL),

    STORAGE_LOCAL_PATH: z.preprocess(emptyToUndefined, z.string().min(1).default("./uploads")),

    STORAGE_PUBLIC_BASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),

    STORAGE_BUCKET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

    STORAGE_REGION: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

    STORAGE_ENDPOINT: z.preprocess(emptyToUndefined, z.url().optional()),

    STORAGE_ACCESS_KEY_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

    STORAGE_SECRET_ACCESS_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

    STORAGE_FORCE_PATH_STYLE: z
      .preprocess((value) => {
        if (value === undefined || value === null || value === "") {
          return undefined;
        }

        if (typeof value === "boolean") {
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
        }

        return value;
      }, z.boolean().optional())
      .optional(),

    HTTP_CLIENT_TIMEOUT_MS: z.coerce
      .number("HTTP client timeout is required.")
      .int("HTTP client timeout must be an integer")
      .positive("HTTP client timeout must be a positive number")
      .default(10_000),

    HTTP_CLIENT_MAX_RETRIES: z.coerce
      .number("HTTP client max retries is required.")
      .int("HTTP client max retries must be an integer")
      .nonnegative("HTTP client max retries must be zero or greater")
      .default(2),

    HTTP_CLIENT_RETRY_BASE_DELAY_MS: z.coerce
      .number("HTTP client retry base delay is required.")
      .int("HTTP client retry base delay must be an integer")
      .positive("HTTP client retry base delay must be a positive number")
      .default(200),

    HTTP_SERVER_REQUEST_TIMEOUT_MS: z.coerce
      .number("HTTP server request timeout is required.")
      .int("HTTP server request timeout must be an integer")
      .positive("HTTP server request timeout must be a positive number")
      .default(30_000),

    HTTP_SERVER_HEADERS_TIMEOUT_MS: z.coerce
      .number("HTTP server headers timeout is required.")
      .int("HTTP server headers timeout must be an integer")
      .positive("HTTP server headers timeout must be a positive number")
      .default(70_000),

    HTTP_SERVER_KEEP_ALIVE_TIMEOUT_MS: z.coerce
      .number("HTTP server keep-alive timeout is required.")
      .int("HTTP server keep-alive timeout must be an integer")
      .positive("HTTP server keep-alive timeout must be a positive number")
      .default(65_000),

    AUTH_JWT_SECRET: z
      .string("Auth JWT secret is required.")
      .min(32, "Auth JWT secret must be at least 32 characters long"),

    AUTH_JWT_ISSUER: z.string("Auth JWT issuer is required.").min(1).default("api"),

    AUTH_JWT_AUDIENCE: z.string("Auth JWT audience is required.").min(1).default("api"),

    AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce
      .number("Auth access token TTL is required.")
      .int("Auth access token TTL must be an integer")
      .positive("Auth access token TTL must be a positive number")
      .default(600),

    AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number("Auth refresh token TTL is required.")
      .int("Auth refresh token TTL must be an integer")
      .positive("Auth refresh token TTL must be a positive number")
      .default(2_592_000),
  })
  .superRefine((env, context) => {
    if (env.HTTP_SERVER_HEADERS_TIMEOUT_MS <= env.HTTP_SERVER_KEEP_ALIVE_TIMEOUT_MS) {
      context.addIssue({
        code: "custom",
        path: ["HTTP_SERVER_HEADERS_TIMEOUT_MS"],
        message:
          "HTTP_SERVER_HEADERS_TIMEOUT_MS must be greater than HTTP_SERVER_KEEP_ALIVE_TIMEOUT_MS.",
      });
    }

    if (env.EMAIL_PROVIDER === EmailProvider.RESEND) {
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
    }

    if (env.STORAGE_PROVIDER === StorageProvider.LOCAL) {
      return;
    }

    if (!env.STORAGE_BUCKET) {
      context.addIssue({
        code: "custom",
        path: ["STORAGE_BUCKET"],
        message: "STORAGE_BUCKET is required when STORAGE_PROVIDER is s3.",
      });
    }

    if (!env.STORAGE_ACCESS_KEY_ID) {
      context.addIssue({
        code: "custom",
        path: ["STORAGE_ACCESS_KEY_ID"],
        message: "STORAGE_ACCESS_KEY_ID is required when STORAGE_PROVIDER is s3.",
      });
    }

    if (!env.STORAGE_SECRET_ACCESS_KEY) {
      context.addIssue({
        code: "custom",
        path: ["STORAGE_SECRET_ACCESS_KEY"],
        message: "STORAGE_SECRET_ACCESS_KEY is required when STORAGE_PROVIDER is s3.",
      });
    }
  });

export type TEnv = z.infer<typeof envSchema>;
