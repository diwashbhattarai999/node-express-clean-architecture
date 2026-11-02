export type WebAuthnAttestationResponseDto = {
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
  name?: string | undefined;
};

export type WebAuthnAssertionResponseDto = {
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
