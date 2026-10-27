export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type HttpHeaders = Record<string, string>;

export type HttpBody = string | Buffer | Record<string, unknown> | unknown[] | null;

export interface HttpRequest {
  method: HttpMethod;
  url: string;
  headers?: HttpHeaders;
  body?: HttpBody;
  /** Per-request timeout in milliseconds; falls back to client default. */
  timeoutMs?: number;
  /** When false, skips retry/backoff for this request. Defaults to true. */
  retry?: boolean;
}

export interface HttpResponse<T = unknown> {
  status: number;
  headers: HttpHeaders;
  data: T;
}
