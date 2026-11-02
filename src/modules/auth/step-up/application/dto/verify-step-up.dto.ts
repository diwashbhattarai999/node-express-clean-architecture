import type { WebAuthnAssertionResponseDto } from "@/modules/auth/passkeys/application/dto/webauthn-json.dto";

export type VerifyStepUpDto = {
  stepUpId: string;
  password?: string | undefined;
  code?: string | undefined;
  assertion?: WebAuthnAssertionResponseDto | undefined;
};
