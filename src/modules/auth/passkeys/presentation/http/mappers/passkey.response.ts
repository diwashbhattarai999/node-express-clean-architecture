import type { Passkey } from "@/modules/auth/passkeys/application/ports/passkey.repository";

export type PasskeyResponse = {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type PasskeyCreatedResponse = {
  id: string;
  name: string | null;
  createdAt: string;
};

export const toPasskeyResponse = (passkey: Passkey): PasskeyResponse => ({
  id: passkey.id,
  name: passkey.name,
  createdAt: passkey.createdAt.toISOString(),
  lastUsedAt: passkey.lastUsedAt ? passkey.lastUsedAt.toISOString() : null,
});

export const toPasskeyCreatedResponse = (passkey: Passkey): PasskeyCreatedResponse => ({
  id: passkey.id,
  name: passkey.name,
  createdAt: passkey.createdAt.toISOString(),
});
