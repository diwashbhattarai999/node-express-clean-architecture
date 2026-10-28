import type { Request } from "express";

export const extractBearerToken = (req: Request): string | null => {
  const header = req.get("authorization");
  if (typeof header !== "string" || header.length === 0) {
    return null;
  }

  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    return null;
  }

  return token;
};
