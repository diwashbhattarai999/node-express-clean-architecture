import { z } from "zod";

import { envSchema } from "./env-schema";

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(z.prettifyError(result.error));

  process.exit(1);
}

export const env = result.data;
