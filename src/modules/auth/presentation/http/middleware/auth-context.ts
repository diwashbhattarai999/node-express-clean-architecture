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

export const getAuthContext = (req: Request): AuthContext | undefined => {
  return (req as Request & { auth?: AuthContext }).auth;
};

export const setAuthContext = (req: Request, auth: AuthContext): void => {
  (req as Request & { auth?: AuthContext }).auth = auth;
};
