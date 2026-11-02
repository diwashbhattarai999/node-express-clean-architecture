import { PASSKEY_CHALLENGE_TTL_MS } from "@/modules/auth/passkeys/application/constants/passkeys";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { IWebAuthnService } from "@/modules/auth/passkeys/application/ports/webauthn.service";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";

export class BeginPasskeyRegisterUseCase {
  public constructor(
    private readonly passkeyRepository: IPasskeyRepository,
    private readonly webAuthnService: IWebAuthnService,
  ) {}

  public async execute(userId: string): Promise<Record<string, unknown>> {
    const user = await this.passkeyRepository.findAuthUserById(userId);

    if (!user) {
      throw new TokenInvalidError("The access token is invalid.");
    }

    const existing = await this.passkeyRepository.listPasskeysForUser(userId);
    const generated = await this.webAuthnService.generateRegistrationOptions({
      userId: user.id,
      userName: user.email ?? user.username ?? user.id,
      userDisplayName: user.displayName ?? user.email ?? user.username ?? user.id,
      excludeCredentials: existing.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports,
      })),
    });

    await this.passkeyRepository.consumeOpenChallenges(userId, "register");
    await this.passkeyRepository.insertChallenge({
      userId,
      type: "register",
      challenge: generated.challenge,
      expiresAt: new Date(Date.now() + PASSKEY_CHALLENGE_TTL_MS),
    });

    return generated.options;
  }
}
