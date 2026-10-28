import type { TFrontendRoute } from "@/shared/frontend/frontend-routes";

export type BuildFrontendUrlParams = {
  /** Public frontend origin, e.g. https://app.example.com */
  baseUrl: string;
  path: TFrontendRoute | (string & {});
  query?: Record<string, string>;
};

/**
 * Builds an absolute frontend URL from `FRONTEND_BASE_URL` + a known route path.
 */
export const buildFrontendUrl = (params: BuildFrontendUrlParams): string => {
  const url = new URL(params.path, normalizeFrontendBaseUrl(params.baseUrl));

  if (params.query) {
    for (const [key, value] of Object.entries(params.query)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
};

const normalizeFrontendBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim();

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};
