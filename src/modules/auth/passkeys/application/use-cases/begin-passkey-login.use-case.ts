import { resolveLoginIdentifier } from "@/modules/auth/credentials/application/utils/resolve-login-identifier";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { PASSKEY_CHALLENGE_TTL_MS } from "@/modules/auth/passkeys/application/constants/passkeys";
import type { BeginPasskeyLoginDto } from "@/modules/auth/passkeys/application/dto/begin-passkey-login.dto";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { IWebAuthnService } from "@/modules/auth/passkeys/application/ports/webauthn.service";

export class BeginPasskeyLoginUseCase {
  public constructor(
    private readonly passkeyRepository: IPasskeyRepository,
    private readonly identityRepository: Pick<IIdentityRepository, "findIdentityByNormalized">,
    private readonly webAuthnService: IWebAuthnService,
  ) {}

  public async execute(dto: BeginPasskeyLoginDto): Promise<Record<string, unknown>> {
    const identifier = dto.identifier?.trim();
    let userId: string | null = null;
    let allowCredentials: { id: string; transports: string[] | null }[] = [];

    if (identifier) {
      const resolved = resolveLoginIdentifier(identifier);
      const identity = await this.identityRepository.findIdentityByNormalized(
        resolved.type,
        resolved.normalizedIdentifier,
      );

      if (identity) {
        userId = identity.userId;
        const passkeys = await this.passkeyRepository.listPasskeysForUser(identity.userId);
        allowCredentials = passkeys.map((passkey) => ({
          id: passkey.credentialId,
          transports: passkey.transports,
        }));
      }
    }

    const generated = await this.webAuthnService.generateAuthenticationOptions({
      allowCredentials,
    });

    await this.passkeyRepository.insertChallenge({
      ...(userId !== null ? { userId } : {}),
      type: "login",
      challenge: generated.challenge,
      expiresAt: new Date(Date.now() + PASSKEY_CHALLENGE_TTL_MS),
    });

    return generated.options;
  }
}
