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
    .number("Port must be a number")
    .int("Port must be an integer")
    .positive("Port must be a positive number")
    .default(3000),

  HOST: z.string("Host must be a string").default("0.0.0.0"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(z.prettifyError(result.error));

  process.exit(1);
}

export const env = result.data;
