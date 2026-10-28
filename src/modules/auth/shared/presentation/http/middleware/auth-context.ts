import type { Request } from "express";

import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";

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

export const getAuthContext = (req: Request): AuthContext | undefined => req.auth;

export const setAuthContext = (req: Request, auth: AuthContext): void => {
  req.auth = auth;
};

/** After `requireBearerAuth` — throws if bearer credentials are missing. */
export const getBearerAuth = (req: { auth?: AuthContext }): AuthBearerCredentials => {
  const bearer = req.auth?.bearer;
  if (!bearer) {
    throw new TokenInvalidError("Unauthorized. Please login to continue.");
  }

  return bearer;
};
