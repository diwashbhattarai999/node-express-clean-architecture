import type { HttpRequest, HttpResponse } from "@/shared/http-client/http-client.types";

export interface IHttpClient {
  request<T = unknown>(input: HttpRequest): Promise<HttpResponse<T>>;
}
