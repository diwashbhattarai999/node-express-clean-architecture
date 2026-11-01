import type { SecurityEvent } from "@/modules/auth/audit/application/ports/audit-log.repository";

export type SecurityEventResponse = {
  id: string;
  eventType: string;
  outcome: "success" | "failure" | "blocked";
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export const toSecurityEventResponse = (event: SecurityEvent): SecurityEventResponse => {
  const response: SecurityEventResponse = {
    id: event.id,
    eventType: event.eventType,
    outcome: event.outcome,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    createdAt: event.createdAt.toISOString(),
  };

  if (event.metadata !== undefined) {
    response.metadata = event.metadata;
  }

  return response;
};

export const toSecurityEventResponseList = (events: SecurityEvent[]): SecurityEventResponse[] =>
  events.map(toSecurityEventResponse);
