import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";

import { AxiosHttpClient } from "@/infrastructure/http-client/axios-http-client";
import { ExternalServiceError } from "@/shared/http-client/errors/external-service.error";
import { ErrorCode } from "@/shared/errors/error-code";

const createAxiosResponse = <T>(
  status: number,
  data: T,
  config: InternalAxiosRequestConfig = {} as InternalAxiosRequestConfig,
): AxiosResponse<T> => ({
  status,
  statusText: String(status),
  data,
  headers: { "content-type": "application/json" },
  config,
});

describe("AxiosHttpClient", () => {
  it("returns data on a successful response", async () => {
    const request = vi.fn().mockResolvedValue(createAxiosResponse(200, { ok: true }));
    const client = new AxiosHttpClient({
      timeoutMs: 1000,
      maxRetries: 2,
      retryBaseDelayMs: 1,
      client: { request } as unknown as AxiosInstance,
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    const result = await client.request<{ ok: boolean }>({
      method: "GET",
      url: "https://api.example.com/health",
    });

    expect(result).toEqual({
      status: 200,
      headers: { "content-type": "application/json" },
      data: { ok: true },
    });
    expect(request).toHaveBeenCalledOnce();
  });

  it("maps timeouts to ExternalServiceError with timeout code", async () => {
    const timeoutError = new AxiosError(
      "timeout of 1000ms exceeded",
      AxiosError.ECONNABORTED,
      {} as InternalAxiosRequestConfig,
    );
    const request = vi.fn().mockRejectedValue(timeoutError);
    const client = new AxiosHttpClient({
      timeoutMs: 1000,
      maxRetries: 0,
      retryBaseDelayMs: 1,
      client: { request } as unknown as AxiosInstance,
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      client.request({ method: "GET", url: "https://api.example.com/slow" }),
    ).rejects.toMatchObject({
      name: "ExternalServiceError",
      code: ErrorCode.EXTERNAL_SERVICE_TIMEOUT,
      timedOut: true,
    });
  });

  it("retries retryable status codes then succeeds", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(createAxiosResponse(503, { error: "unavailable" }))
      .mockResolvedValueOnce(createAxiosResponse(200, { ok: true }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const client = new AxiosHttpClient({
      timeoutMs: 1000,
      maxRetries: 2,
      retryBaseDelayMs: 10,
      client: { request } as unknown as AxiosInstance,
      sleep,
    });

    const result = await client.request({
      method: "GET",
      url: "https://api.example.com/flaky",
    });

    expect(result.status).toBe(200);
    expect(request).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledOnce();
  });

  it("exhausts retries on persistent retryable failures", async () => {
    const request = vi.fn().mockResolvedValue(createAxiosResponse(502, { error: "bad gateway" }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const client = new AxiosHttpClient({
      timeoutMs: 1000,
      maxRetries: 2,
      retryBaseDelayMs: 5,
      client: { request } as unknown as AxiosInstance,
      sleep,
    });

    await expect(
      client.request({ method: "GET", url: "https://api.example.com/down" }),
    ).rejects.toBeInstanceOf(ExternalServiceError);

    expect(request).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable 4xx responses", async () => {
    const request = vi.fn().mockResolvedValue(createAxiosResponse(400, { error: "bad request" }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const client = new AxiosHttpClient({
      timeoutMs: 1000,
      maxRetries: 3,
      retryBaseDelayMs: 5,
      client: { request } as unknown as AxiosInstance,
      sleep,
    });

    await expect(
      client.request({ method: "POST", url: "https://api.example.com/items", body: {} }),
    ).rejects.toMatchObject({
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      externalStatus: 400,
    });

    expect(request).toHaveBeenCalledOnce();
    expect(sleep).not.toHaveBeenCalled();
  });

  it("skips retries when retry is false", async () => {
    const request = vi.fn().mockResolvedValue(createAxiosResponse(503, { error: "unavailable" }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const client = new AxiosHttpClient({
      timeoutMs: 1000,
      maxRetries: 5,
      retryBaseDelayMs: 5,
      client: { request } as unknown as AxiosInstance,
      sleep,
    });

    await expect(
      client.request({
        method: "GET",
        url: "https://api.example.com/no-retry",
        retry: false,
      }),
    ).rejects.toBeInstanceOf(ExternalServiceError);

    expect(request).toHaveBeenCalledOnce();
    expect(sleep).not.toHaveBeenCalled();
  });
});
