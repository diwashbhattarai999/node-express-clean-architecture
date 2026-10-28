import { randomBytes } from "node:crypto";

export const generateCsrfToken = (): string => randomBytes(32).toString("base64url");
