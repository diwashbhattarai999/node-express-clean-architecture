import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { ISecretEncryptor } from "@/modules/auth/mfa/application/ports/secret-encryptor.port";
import type { ITotpService } from "@/modules/auth/mfa/application/ports/totp.service";
import { MfaOtpDispatcher } from "@/modules/auth/mfa/application/services/mfa-otp-dispatcher";
import { BeginMfaEnrollUseCase } from "@/modules/auth/mfa/application/use-cases/begin-mfa-enroll.use-case";
import { ConflictError } from "@/shared/errors/conflict-error";

describe("BeginMfaEnrollUseCase", () => {
  const mfaRepository = {
    findFactorByType: vi.fn(),
    findAuthUserById: vi.fn(),
    insertFactor: vi.fn(),
    updateFactor: vi.fn(),
    insertChallenge: vi.fn(),
  } as unknown as IMfaRepository;

  const identityRepository = {
    listIdentitiesForUser: vi.fn(),
  } as unknown as Pick<IIdentityRepository, "listIdentitiesForUser">;

  const totpService: ITotpService = {
    generateSecret: vi.fn(),
    buildOtpauthUrl: vi.fn(),
    generate: vi.fn(),
    verify: vi.fn(),
  };

  const secretEncryptor: ISecretEncryptor = {
    encrypt: vi.fn().mockReturnValue("encrypted"),
    decrypt: vi.fn(),
  };

  const otpDispatcher = {
    send: vi.fn(),
  } as unknown as MfaOtpDispatcher;

  const useCase = new BeginMfaEnrollUseCase(
    mfaRepository,
    identityRepository,
    totpService,
    secretEncryptor,
    otpDispatcher,
    { brandName: "Acme" },
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(totpService.generateSecret).mockReturnValue({ secret: "SECRETBASE32" });
    vi.mocked(totpService.buildOtpauthUrl).mockReturnValue(
      "otpauth://totp/Acme:ada@example.com?secret=SECRETBASE32",
    );
    vi.mocked(secretEncryptor.encrypt).mockReturnValue("encrypted");
  });

  it("creates an unverified TOTP factor and returns otpauth material", async () => {
    vi.mocked(mfaRepository.findFactorByType).mockResolvedValue(null);
    vi.mocked(mfaRepository.findAuthUserById).mockResolvedValue({
      id: "user-1",
      status: "active",
      displayName: "Ada",
      avatarUrl: null,
      email: "ada@example.com",
      username: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(mfaRepository.insertFactor).mockResolvedValue({
      id: "factor-1",
      userId: "user-1",
      type: "totp",
      label: "Authenticator app",
      secretEncrypted: "encrypted",
      destination: null,
      isVerified: false,
      verifiedAt: null,
      lastUsedAt: null,
      disabledAt: null,
    });

    const result = await useCase.execute("user-1", { type: "totp" });

    expect(result).toEqual({
      factorId: "factor-1",
      secret: "SECRETBASE32",
      otpauthUrl: "otpauth://totp/Acme:ada@example.com?secret=SECRETBASE32",
    });
  });

  it("rejects a second verified factor of the same type", async () => {
    vi.mocked(mfaRepository.findFactorByType).mockResolvedValue({
      id: "factor-1",
      userId: "user-1",
      type: "totp",
      label: "Authenticator app",
      secretEncrypted: "encrypted",
      destination: null,
      isVerified: true,
      verifiedAt: new Date(),
      lastUsedAt: null,
      disabledAt: null,
    });

    await expect(useCase.execute("user-1", { type: "totp" })).rejects.toBeInstanceOf(ConflictError);
  });
});
