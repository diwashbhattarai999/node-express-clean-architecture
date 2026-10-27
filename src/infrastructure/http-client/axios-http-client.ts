import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from "axios";

import { ExternalServiceError } from "@/shared/http-client/errors/external-service.error";
import type { IHttpClient } from "@/shared/http-client/http-client.port";
import type {
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from "@/shared/http-client/http-client.types";
import { logger } from "@/shared/logger/logger";

export interface AxiosHttpClientOptions {
  timeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  /** Injectable Axios instance for tests; defaults to a configured axios.create(). */
  client?: AxiosInstance;
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const toHeaderRecord = (headers: AxiosResponse["headers"]): HttpHeaders => {
  const result: HttpHeaders = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) {
      continue;
    }

    result[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  return result;
};

const sanitizeUrlForLog = (url: string): string => {
  try {
    const parsed = new URL(url);

    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0] ?? url;
  }
};

const isRetryableAxiosError = (error: AxiosError): boolean => {
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT" || error.code === "ERR_NETWORK") {
    return true;
  }

  const status = error.response?.status;

  return status !== undefined && RETRYABLE_STATUS_CODES.has(status);
};

const computeBackoffMs = (attempt: number, baseDelayMs: number): number => {
  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = Math.floor(Math.random() * baseDelayMs);

  return exponential + jitter;
};

const mapAxiosError = (error: unknown, url: string): ExternalServiceError => {
  if (isAxiosError(error)) {
    const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    const externalStatus = error.response?.status;

    if (timedOut) {
      return new ExternalServiceError({
        timedOut: true,
        message: `External service request timed out: ${sanitizeUrlForLog(url)}`,
        cause: error,
      });
    }

    if (externalStatus !== undefined) {
      return new ExternalServiceError({
        message: `External service responded with status ${externalStatus}.`,
        externalStatus,
        cause: error,
      });
    }

    return new ExternalServiceError({
      message: `External service request failed: ${sanitizeUrlForLog(url)}`,
      cause: error,
    });
  }

  return new ExternalServiceError({
    message: `External service request failed: ${sanitizeUrlForLog(url)}`,
    cause: error,
  });
};

export class AxiosHttpClient implements IHttpClient {
  private readonly client: AxiosInstance;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;

  public constructor(options: AxiosHttpClientOptions) {
    this.maxRetries = options.maxRetries;
    this.retryBaseDelayMs = options.retryBaseDelayMs;
    this.sleep = options.sleep ?? defaultSleep;
    this.client =
      options.client ??
      axios.create({
        timeout: options.timeoutMs,
        validateStatus: () => true,
      });
  }

  public async request<T = unknown>(input: HttpRequest): Promise<HttpResponse<T>> {
    const retryEnabled = input.retry !== false;
    const maxAttempts = retryEnabled ? this.maxRetries + 1 : 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const startedAt = Date.now();

      try {
        const config: AxiosRequestConfig = {
          method: input.method,
          url: input.url,
          validateStatus: () => true,
          ...(input.headers ? { headers: input.headers } : {}),
          ...(input.body !== undefined && input.body !== null ? { data: input.body } : {}),
          ...(input.timeoutMs !== undefined ? { timeout: input.timeoutMs } : {}),
        };

        const response = await this.client.request<T>(config);
        const durationMs = Date.now() - startedAt;

        logger.info(
          {
            outboundHttp: true,
            method: input.method,
            url: sanitizeUrlForLog(input.url),
            status: response.status,
            durationMs,
            attempt: attempt + 1,
            headers: {
              authorization: input.headers?.authorization ?? input.headers?.Authorization,
              cookie: input.headers?.cookie ?? input.headers?.Cookie,
            },
          },
          "Outbound HTTP request completed",
        );

        if (response.status >= 200 && response.status < 300) {
          return {
            status: response.status,
            headers: toHeaderRecord(response.headers),
            data: response.data,
          };
        }

        const axiosLikeError = new AxiosError(
          `Request failed with status code ${response.status}`,
          AxiosError.ERR_BAD_RESPONSE,
          response.config,
          response.request,
          response,
        );

        if (
          retryEnabled &&
          attempt < maxAttempts - 1 &&
          RETRYABLE_STATUS_CODES.has(response.status)
        ) {
          lastError = axiosLikeError;
          await this.sleep(computeBackoffMs(attempt, this.retryBaseDelayMs));
          continue;
        }

        throw mapAxiosError(axiosLikeError, input.url);
      } catch (error) {
        lastError = error;

        if (error instanceof ExternalServiceError) {
          throw error;
        }

        const shouldRetry =
          retryEnabled &&
          attempt < maxAttempts - 1 &&
          isAxiosError(error) &&
          isRetryableAxiosError(error);

        logger.warn(
          {
            outboundHttp: true,
            method: input.method,
            url: sanitizeUrlForLog(input.url),
            durationMs: Date.now() - startedAt,
            attempt: attempt + 1,
            willRetry: shouldRetry,
            err: error,
          },
          "Outbound HTTP request failed",
        );

        if (shouldRetry) {
          await this.sleep(computeBackoffMs(attempt, this.retryBaseDelayMs));
          continue;
        }

        throw mapAxiosError(error, input.url);
      }
    }

    throw mapAxiosError(lastError, input.url);
  }
}
