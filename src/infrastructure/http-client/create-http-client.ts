import type { TEnv } from "@/config/env-schema";
import { AxiosHttpClient } from "@/infrastructure/http-client/axios-http-client";
import type { IHttpClient } from "@/shared/http-client/http-client.port";

export const createHttpClient = (env: TEnv): IHttpClient =>
  new AxiosHttpClient({
    timeoutMs: env.HTTP_CLIENT_TIMEOUT_MS,
    maxRetries: env.HTTP_CLIENT_MAX_RETRIES,
    retryBaseDelayMs: env.HTTP_CLIENT_RETRY_BASE_DELAY_MS,
  });
