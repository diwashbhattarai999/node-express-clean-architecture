import { randomUUID } from "node:crypto";

import { SignJWT } from "jose";

import { STEP_UP_TOKEN_PURPOSE } from "@/modules/auth/step-up/application/constants/step-up";

const TEST_JWT_SECRET = "test-auth-jwt-secret-at-least-32-chars";

export const mintStepUpToken = async (
  userId: string,
  sessionId: string,
  expiresInSeconds = 300,
): Promise<string> =>
  new SignJWT({
    sid: sessionId,
    purpose: STEP_UP_TOKEN_PURPOSE,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer("api")
    .setAudience("api")
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .setJti(randomUUID())
    .sign(new TextEncoder().encode(TEST_JWT_SECRET));
