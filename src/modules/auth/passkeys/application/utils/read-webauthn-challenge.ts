export const readWebAuthnClientChallenge = (clientDataJSON: string): string | null => {
  try {
    const json = JSON.parse(Buffer.from(clientDataJSON, "base64url").toString("utf8")) as {
      challenge?: unknown;
    };

    return typeof json.challenge === "string" && json.challenge.length > 0 ? json.challenge : null;
  } catch {
    return null;
  }
};
