import { describe, expect, it } from "vitest";

import type { TEnv } from "@/config/env-schema";
import { AxiosHttpClient } from "@/infrastructure/http-client/axios-http-client";
import { createHttpClient } from "@/infrastructure/http-client/create-http-client";

describe("createHttpClient", () => {
  it("creates an AxiosHttpClient from env defaults", () => {
    const env = {
      HTTP_CLIENT_TIMEOUT_MS: 10_000,
      HTTP_CLIENT_MAX_RETRIES: 2,
      HTTP_CLIENT_RETRY_BASE_DELAY_MS: 200,
    } as TEnv;

    const client = createHttpClient(env);

    expect(client).toBeInstanceOf(AxiosHttpClient);
  });
});
