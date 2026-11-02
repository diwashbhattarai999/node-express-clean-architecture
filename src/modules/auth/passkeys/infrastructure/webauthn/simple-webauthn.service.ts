import {
  type AuthenticationResponseJSON,
  type AuthenticatorAttachment,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

import type {
  GenerateAuthenticationOptionsInput,
  GenerateRegistrationOptionsInput,
  IWebAuthnService,
  VerifiedWebAuthnAuthentication,
  VerifiedWebAuthnRegistration,
  WebAuthnAuthenticationVerificationInput,
  WebAuthnCredentialDescriptor,
  WebAuthnRegistrationVerificationInput,
} from "@/modules/auth/passkeys/application/ports/webauthn.service";
import type { AuthWebAuthnOptions } from "@/modules/auth/shared/application/types/auth-composition";

const uuidToBytes = (userId: string): Uint8Array<ArrayBuffer> => {
  const hex = userId.replaceAll("-", "");

  if (hex.length !== 32) {
    return new TextEncoder().encode(userId);
  }

  return new Uint8Array(Buffer.from(hex, "hex"));
};

const toAllowCredentials = (credentials: WebAuthnCredentialDescriptor[]) =>
  credentials.map((credential) => ({
    id: credential.id,
    ...(credential.transports && credential.transports.length > 0
      ? { transports: credential.transports }
      : {}),
  }));

const toAuthenticatorAttachment = (
  value: string | undefined,
): AuthenticatorAttachment | undefined => {
  if (value === "platform" || value === "cross-platform") {
    return value;
  }

  return undefined;
};

export class SimpleWebAuthnService implements IWebAuthnService {
  public constructor(private readonly options: AuthWebAuthnOptions) {}

  public async generateRegistrationOptions(
    input: GenerateRegistrationOptionsInput,
  ): Promise<{ challenge: string; options: Record<string, unknown> }> {
    const options = await generateRegistrationOptions({
      rpName: this.options.rpName,
      rpID: this.options.rpID,
      userName: input.userName,
      userDisplayName: input.userDisplayName,
      userID: uuidToBytes(input.userId),
      attestationType: "none",
      excludeCredentials: toAllowCredentials(input.excludeCredentials),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    return { challenge: options.challenge, options: options as unknown as Record<string, unknown> };
  }

  public async verifyRegistration(
    input: WebAuthnRegistrationVerificationInput,
  ): Promise<VerifiedWebAuthnRegistration | null> {
    const attachment = toAuthenticatorAttachment(input.response.authenticatorAttachment);
    const response: RegistrationResponseJSON = {
      id: input.response.id,
      rawId: input.response.rawId,
      type: "public-key",
      response: {
        clientDataJSON: input.response.response.clientDataJSON,
        attestationObject: input.response.response.attestationObject,
        ...(input.response.response.transports
          ? { transports: input.response.response.transports }
          : {}),
        ...(input.response.response.authenticatorData
          ? { authenticatorData: input.response.response.authenticatorData }
          : {}),
        ...(input.response.response.publicKeyAlgorithm !== undefined
          ? { publicKeyAlgorithm: input.response.response.publicKeyAlgorithm }
          : {}),
        ...(input.response.response.publicKey
          ? { publicKey: input.response.response.publicKey }
          : {}),
      },
      clientExtensionResults: input.response.clientExtensionResults ?? {},
      ...(attachment !== undefined ? { authenticatorAttachment: attachment } : {}),
    };

    let result: Awaited<ReturnType<typeof verifyRegistrationResponse>>;

    try {
      result = await verifyRegistrationResponse({
        response,
        expectedChallenge: input.expectedChallenge,
        expectedOrigin: this.options.origin,
        expectedRPID: this.options.rpID,
        requireUserVerification: true,
      });
    } catch {
      return null;
    }

    if (!result.verified || !result.registrationInfo) {
      return null;
    }

    const { credential, aaguid, credentialBackedUp } = result.registrationInfo;
    const aaguidValue = aaguid.length <= 36 ? aaguid : aaguid.slice(0, 36);

    return {
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      signCount: credential.counter,
      transports:
        credential.transports && credential.transports.length > 0
          ? [...credential.transports]
          : null,
      aaguid: aaguidValue || null,
      backedUp: credentialBackedUp,
    };
  }

  public async generateAuthenticationOptions(
    input: GenerateAuthenticationOptionsInput,
  ): Promise<{ challenge: string; options: Record<string, unknown> }> {
    const options = await generateAuthenticationOptions({
      rpID: this.options.rpID,
      userVerification: "preferred",
      ...(input.allowCredentials.length > 0
        ? { allowCredentials: toAllowCredentials(input.allowCredentials) }
        : {}),
    });

    return { challenge: options.challenge, options: options as unknown as Record<string, unknown> };
  }

  public async verifyAuthentication(
    input: WebAuthnAuthenticationVerificationInput,
  ): Promise<VerifiedWebAuthnAuthentication | null> {
    const attachment = toAuthenticatorAttachment(input.response.authenticatorAttachment);
    const response: AuthenticationResponseJSON = {
      id: input.response.id,
      rawId: input.response.rawId,
      type: "public-key",
      response: {
        clientDataJSON: input.response.response.clientDataJSON,
        authenticatorData: input.response.response.authenticatorData,
        signature: input.response.response.signature,
        ...(input.response.response.userHandle
          ? { userHandle: input.response.response.userHandle }
          : {}),
      },
      clientExtensionResults: input.response.clientExtensionResults ?? {},
      ...(attachment !== undefined ? { authenticatorAttachment: attachment } : {}),
    };

    let result: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;

    try {
      result = await verifyAuthenticationResponse({
        response,
        expectedChallenge: input.expectedChallenge,
        expectedOrigin: this.options.origin,
        expectedRPID: this.options.rpID,
        requireUserVerification: true,
        credential: {
          id: input.credential.id,
          publicKey: new Uint8Array(input.credential.publicKey),
          counter: input.credential.signCount,
          ...(input.credential.transports && input.credential.transports.length > 0
            ? { transports: input.credential.transports }
            : {}),
        },
      });
    } catch {
      return null;
    }

    if (!result.verified) {
      return null;
    }

    return { newSignCount: result.authenticationInfo.newCounter };
  }
}
