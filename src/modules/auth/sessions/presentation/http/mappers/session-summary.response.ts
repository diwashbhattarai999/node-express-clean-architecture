import type { AuthSessionSummary } from "@/modules/auth/sessions/application/ports/session.repository";

export type SessionSummaryResponse = {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  isCurrent: boolean;
};

export const toSessionSummaryResponse = (session: AuthSessionSummary): SessionSummaryResponse => ({
  id: session.id,
  createdAt: session.createdAt.toISOString(),
  lastUsedAt: session.lastUsedAt.toISOString(),
  expiresAt: session.expiresAt.toISOString(),
  ipAddress: session.ipAddress,
  userAgent: session.userAgent,
  deviceName: session.deviceName,
  isCurrent: session.isCurrent,
});

export const toSessionSummaryResponseList = (
  sessions: AuthSessionSummary[],
): SessionSummaryResponse[] => sessions.map(toSessionSummaryResponse);
