import { randomBytes } from "node:crypto";

export const generateRefreshToken = (): string => randomBytes(32).toString("base64url");
