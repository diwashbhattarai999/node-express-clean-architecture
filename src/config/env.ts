import "dotenv/config";
import { z } from "zod";

import { Environment } from "@/shared/constants/environment";

const envSchema = z.object({
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
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(z.prettifyError(result.error));

  process.exit(1);
}

export const env = result.data;
