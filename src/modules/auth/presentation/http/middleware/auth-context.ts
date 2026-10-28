import type { Request } from "express";

export type AuthRefreshCredentials = {
  refreshToken: string;
  fromCookie: boolean;
};

export type AuthBearerCredentials = {
  accessToken: string;
  userId: string;
  sessionId: string;
};

export type AuthContext = {
  refresh?: AuthRefreshCredentials;
  bearer?: AuthBearerCredentials;
};

export type RequestWithAuth = Request & {
  auth: AuthContext;
};

/** Request after `requireBearerAuth` — `auth.bearer` is guaranteed. */
export type RequestWithBearerAuth = Request & {
  auth: AuthContext & { bearer: AuthBearerCredentials };
};

export const getAuthContext = (req: Request): AuthContext | undefined => {
  return (req as Request & { auth?: AuthContext }).auth;
};

export const setAuthContext = (req: Request, auth: AuthContext): void => {
  (req as Request & { auth?: AuthContext }).auth = auth;
};

export const asBearerAuthenticatedRequest = (req: Request): RequestWithBearerAuth => {
  return req as RequestWithBearerAuth;
};
