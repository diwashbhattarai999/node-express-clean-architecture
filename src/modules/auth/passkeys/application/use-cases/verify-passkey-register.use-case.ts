import { DEFAULT_PASSKEY_NAME } from "@/modules/auth/passkeys/application/constants/passkeys";
import type { WebAuthnAttestationResponseDto } from "@/modules/auth/passkeys/application/dto/webauthn-json.dto";
import type {
  IPasskeyRepository,
  Passkey,
} from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { IWebAuthnService } from "@/modules/auth/passkeys/application/ports/webauthn.service";
import { readWebAuthnClientChallenge } from "@/modules/auth/passkeys/application/utils/read-webauthn-challenge";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { ConflictError } from "@/shared/errors/conflict-error";

export class VerifyPasskeyRegisterUseCase {
  public constructor(
    private readonly passkeyRepository: IPasskeyRepository,
    private readonly webAuthnService: IWebAuthnService,
  ) {}

  public async execute(userId: string, dto: WebAuthnAttestationResponseDto): Promise<Passkey> {
    const challengeValue = readWebAuthnClientChallenge(dto.response.clientDataJSON);

    if (!challengeValue) {
      throw new TokenInvalidError("The passkey registration response is invalid.");
    }

    const challenge = await this.passkeyRepository.findUsableChallenge(challengeValue, "register");

    if (!challenge || challenge.userId !== userId) {
      throw new TokenInvalidError("The passkey registration challenge is invalid.");
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new TokenExpiredError("The passkey registration challenge has expired.");
    }

    const verified = await this.webAuthnService.verifyRegistration({
      response: dto,
      expectedChallenge: challenge.challenge,
    });

    if (!verified) {
      throw new TokenInvalidError("The passkey registration response is invalid.");
    }

    const existing = await this.passkeyRepository.findPasskeyByCredentialId(verified.credentialId);

    if (existing) {
      throw new ConflictError("This passkey is already registered.");
    }

    const consumed = await this.passkeyRepository.consumeChallenge(challenge.id);

    if (!consumed) {
      throw new TokenInvalidError("The passkey registration challenge is invalid.");
    }

    const name = dto.name?.trim() || DEFAULT_PASSKEY_NAME;

    return this.passkeyRepository.insertPasskey({
      userId,
      credentialId: verified.credentialId,
      publicKey: verified.publicKey,
      signCount: verified.signCount,
      transports: verified.transports ?? dto.response.transports ?? null,
      aaguid: verified.aaguid,
      backedUp: verified.backedUp,
      name,
    });
  }
}
