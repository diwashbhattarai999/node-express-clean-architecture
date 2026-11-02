export type WebAuthnCredentialDescriptor = {
  id: string;
  transports?: string[] | null;
};

export type GenerateRegistrationOptionsInput = {
  userId: string;
  userName: string;
  userDisplayName: string;
  excludeCredentials: WebAuthnCredentialDescriptor[];
};

export type GenerateAuthenticationOptionsInput = {
  allowCredentials: WebAuthnCredentialDescriptor[];
};

export type WebAuthnRegistrationVerificationInput = {
  response: {
    id: string;
    rawId: string;
    type: "public-key";
    response: {
      clientDataJSON: string;
      attestationObject: string;
      transports?: string[] | undefined;
      authenticatorData?: string | undefined;
      publicKeyAlgorithm?: number | undefined;
      publicKey?: string | undefined;
    };
    clientExtensionResults?: Record<string, unknown> | undefined;
    authenticatorAttachment?: string | undefined;
  };
  expectedChallenge: string;
};

export type VerifiedWebAuthnRegistration = {
  credentialId: string;
  publicKey: Buffer;
  signCount: number;
  transports: string[] | null;
  aaguid: string | null;
  backedUp: boolean | null;
};

export type WebAuthnAuthenticationVerificationInput = {
  response: {
    id: string;
    rawId: string;
    type: "public-key";
    response: {
      clientDataJSON: string;
      authenticatorData: string;
      signature: string;
      userHandle?: string | undefined;
    };
    clientExtensionResults?: Record<string, unknown> | undefined;
    authenticatorAttachment?: string | undefined;
  };
  expectedChallenge: string;
  credential: {
    id: string;
    publicKey: Buffer;
    signCount: number;
    transports: string[] | null;
  };
};

export type VerifiedWebAuthnAuthentication = {
  newSignCount: number;
};

export interface IWebAuthnService {
  generateRegistrationOptions(
    input: GenerateRegistrationOptionsInput,
  ): Promise<{ challenge: string; options: Record<string, unknown> }>;

  verifyRegistration(
    input: WebAuthnRegistrationVerificationInput,
  ): Promise<VerifiedWebAuthnRegistration | null>;

  generateAuthenticationOptions(
    input: GenerateAuthenticationOptionsInput,
  ): Promise<{ challenge: string; options: Record<string, unknown> }>;

  verifyAuthentication(
    input: WebAuthnAuthenticationVerificationInput,
  ): Promise<VerifiedWebAuthnAuthentication | null>;
}
