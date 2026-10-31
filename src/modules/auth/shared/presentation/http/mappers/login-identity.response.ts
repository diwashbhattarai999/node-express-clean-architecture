import type { AuthLoginIdentity } from "@/modules/auth/shared/application/types/auth.types";

export type LoginIdentityResponse = {
  id: string;
  type: AuthLoginIdentity["type"];
  identifier: string;
  verifiedAt: string | null;
  isPrimary: boolean;
  createdAt: string;
};

export const toLoginIdentityResponse = (identity: AuthLoginIdentity): LoginIdentityResponse => ({
  id: identity.id,
  type: identity.type,
  identifier: identity.identifier,
  verifiedAt: identity.verifiedAt?.toISOString() ?? null,
  isPrimary: identity.isPrimary,
  createdAt: identity.createdAt.toISOString(),
});

export const toLoginIdentityResponseList = (
  identities: AuthLoginIdentity[],
): LoginIdentityResponse[] => identities.map(toLoginIdentityResponse);
